import { Logger } from '@nestjs/common';
import { PermissionTool } from '../tools/utility-tools/permission.tool';
import { ToolRouter } from '../router/tool.router';
import { AuditTool } from '../tools/utility-tools/audit.tool';
import { NotificationTool } from '../tools/utility-tools/notification.tool';
import type { DispatchRequest } from '../tools/interfaces/dispatch-request';
import type { ToolRequest } from '../tools/interfaces/tool-request';
import { TasksService } from '../../core/tasks/tasks.service';
import { UsersService } from '../../core/users/users.service';
import {
  ChatMessage,
  ConversationState,
  ConversationStatesService,
} from '../../core/conversation-states/conversation-states.service';
import { MessageRequest } from './interfaces/message-request';
import { ModelDecision } from './interfaces/model-decision';
import { User } from 'src/core/users/user.domain';
import { Task } from 'src/core/tasks/task.domain';
import { DispatchResult } from '../tools/interfaces/dispatch-result';

/** Normalized response for all channels. */
export interface TaskPipelineResult {
  reply: string;
  status: string;
  clarification_question?: string;
  pending_parameters?: Record<string, any>;
  conversation_summary?: string | null;
  data?: unknown;
}

export interface TaskDetectionContext {
  chatHistory: ChatMessage[];
  tasks: { task_name: string; description?: string }[];
}

export interface AITask {
    taskName: string;
    description: string;
    actionType: string;
    parametersSchema: any
}

/**
 * Shared orchestration for Cloud / Local AI implementations.
 *
 * - No aiEnabled-style gates.
 * - No fallback task_requests on error in the catch path.
 * - Graceful `TaskPipelineResult` instead of throwing to HTTP callers where possible.
 * - Audit events use {@link AuditTool} (injected on concrete services that wire this base).
 *
 * Subclasses implement {@link detectTaskWithModel} only (LLM + provider HTTP).
 *
 * **Single public entry:** {@link processMessage} — all channels pass a {@link MessageRequest}.
 */
export abstract class AIToolsServiceBase {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly permissionTool: PermissionTool,
    protected readonly toolRouter: ToolRouter,
    protected readonly auditTool: AuditTool,
    protected readonly notificationTool: NotificationTool,
    protected readonly tasksService: TasksService,
    protected readonly usersService: UsersService,
    protected readonly conversationStatesService: ConversationStatesService,
  ) {}

  /**
   * The only public entry: chat, device webhooks, and iMessage all build a {@link MessageRequest} and call this.
   * Chat lines for the model are gathered here: with `chatGuid`, {@link ConversationStatesService} builds
   * multi-turn history; without it, a single user message is used.
   */
  async processMessage(request: MessageRequest): Promise<TaskPipelineResult> {
    await this.auditTool.logEvent({
      event_type: 'message_received',
      raw_input: request.messageText?.trim() ?? '',
      metadata: { source: String(request.source), at: 'process_message_start' },
    });

    const userIdentifier = request.userIdentifier.trim();
    if (!userIdentifier) {
      return { reply: '', status: 'no_user_identifier' };
    }

    const text = request.messageText?.trim();
    if (!text) {
      return { reply: '', status: 'empty_message' };
    }

    const user = await this.usersService.findByUserIdOrHandle(userIdentifier);
    if (!user) {
      this.logger.warn(`No user resolved for userIdentifier=${userIdentifier} (source=${request.source})`);
      return { reply: '', status: 'user_not_found' };
    }

    const chatHistory = await this.buildChatMessages({ ...request, messageText: text }, user.userId);

    const result = await this.runPipeline(chatHistory, user.userId, String(request.source), user);

    if (request.chatGuid) {
      try {
        await this.persistConversationFromPipelineResult(request.chatGuid, user.userId, result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to persist conversation state for chatGuid=${request.chatGuid}: ${msg}`,
        );
      }
    }

    return result;
  }

  protected buildSystemPromptForTasks(tasks: AITask[]): string {
    let taskSection = 'Available tasks:\n\n';

    tasks.forEach((task, index) => {
      taskSection += `${index + 1}. ${task.taskName}\n`;
      taskSection += `   Description: ${task.description || 'No description provided'}\n`;

      if (task.parametersSchema) {
        try {
          const schema = typeof task.parametersSchema === 'string' 
            ? JSON.parse(task.parametersSchema) 
            : task.parametersSchema;

          // Show a compact version of the schema to save tokens
          const compactSchema = JSON.stringify(schema, null, 0); // minified
          taskSection += `   Expected parameters: ${compactSchema}\n`;
        } catch (e) {
          taskSection += `   Expected parameters: (schema unavailable)\n`;
        }
      } else {
        taskSection += `   Expected parameters: none required\n`;
      }
      taskSection += '\n';
    });

    const outputSchema = `
You MUST respond with **valid JSON only** — no extra text, no markdown, no explanations.

Exact response format:

{
  "action": "execute" or "clarify",
  "task_name": "exact taskName from the list above" or null,
  "parameters": { ...object matching the task's expected parameters, or {} },
  "clarification_question": "clear, polite question to ask the user if more info is needed" or null,
  "pending_parameters": { ...any missing parameters } or {},
  "conversation_summary": "optional very short summary" or null
}
`;

    return `You are a helpful, privacy-first home AI assistant for the family.

${taskSection}

${outputSchema}

Rules:
- Choose the single best matching task based on user intent and conversation history.
- If the request is ambiguous or missing required parameters, use "clarify" and ask a natural question.
- Do not invent parameters not defined in the task's expected parameters.
- Keep "conversation_summary" very brief when included.`;
  }

  /**
   * After any pipeline outcome, merge assistant output into the conversation row (iMessage, chat UI, etc.).
   */
  private async persistConversationFromPipelineResult(
    chatGuid: string,
    userId: string,
    result: TaskPipelineResult,
  ): Promise<void> {
    const currentState = await this.conversationStatesService.findOrCreateByChatGuid(chatGuid, userId);

    const updateData: Partial<ConversationState> = {
      last_ai_message: result.reply || JSON.stringify(result),
      current_task_type:
        (result as TaskPipelineResult & { task_type?: string }).task_type ?? currentState.current_task_type,
      pending_parameters: result.pending_parameters ?? currentState.pending_parameters,
      conversation_summary: result.conversation_summary ?? currentState.conversation_summary,
    };

    if (result.clarification_question) {
      updateData.clarification_question = result.clarification_question;
    }

    await this.conversationStatesService.updateFromAIOutput(chatGuid, updateData);
  }

  /**
   * Builds `ChatMessage[]` for the LLM: multi-turn from DB when `chatGuid` is set, otherwise one user turn.
   */
  protected async buildChatMessages(
    request: MessageRequest & { messageText: string },
    resolvedUserId: string,
  ): Promise<ChatMessage[]> {
    const text = request.messageText.trim();

    if (request.chatGuid) {
      const state = await this.conversationStatesService.findOrCreateByChatGuid(
        request.chatGuid,
        resolvedUserId,
      );
      return this.conversationStatesService.buildChatHistory(state, text);
    }

    return [{ role: 'user', content: text }];
  }

  /**
   * LLM task detection — implemented by Cloud / Local subclasses.
   */
  protected abstract detectTaskWithModel(chatHistory: ChatMessage[], tasks: AITask[]): Promise<ModelDecision>;

  private async runPipeline(
    chatHistory: ChatMessage[],
    userId: string,
    source: string,
    user: User,
  ): Promise<TaskPipelineResult> {
    const startTime = Date.now();

    try {
      await this.auditTool.logEvent({
        event_type: 'message_received',
        user_id: userId,
        raw_input: chatHistory[chatHistory.length - 1]?.content || '',
        metadata: { source },
      });

      const tasks = await this.tasksService.findEnabledForAI();
      const aiTasks = this.mapTasksToAITasks(tasks);

      const modelDecision = await this.detectTaskWithModel(chatHistory, aiTasks);

      if (modelDecision.action === 'clarify' && modelDecision.clarification_question) {
        await this.auditTool.logEvent({
          event_type: 'clarification_requested',
          user_id: userId,
          result: modelDecision.clarification_question,
        });

        return {
          reply: modelDecision.clarification_question,
          status: 'clarification_needed',
          clarification_question: modelDecision.clarification_question,
          pending_parameters: modelDecision.pending_parameters || {},
          conversation_summary: modelDecision.conversation_summary,
        };
      }

      if (!modelDecision.task_name) {
        return {
          reply: "I'm sorry, I didn't understand what you'd like me to do. Could you rephrase?",
          status: 'no_task_detected',
        };
      }

      const identifiedTask = tasks.find((t) => t.taskName === modelDecision.task_name);
      if (!identifiedTask) {
        const clarification_question = `I'm sorry, I didn't understand what you'd like me to do. Could you rephrase`;

        return {
          reply: clarification_question,
          status: 'clarification_needed',
          clarification_question,
          pending_parameters: modelDecision.pending_parameters || {},
          conversation_summary: modelDecision.conversation_summary,
        };
      }

      const permissionResult = await this.permissionTool.checkPermission(user, identifiedTask);

      if (!(permissionResult.canRequest || permissionResult.canExecute)) {
        await this.auditTool.logEvent({
          event_type: 'permission_denied',
          user_id: userId,
          task_name: modelDecision.task_name,
          status: 'denied',
        });
        return { reply: '', status: 'permission_denied' };
      }

      const dispatchRequest: DispatchRequest = {
        task: identifiedTask,
        user,
        permission: permissionResult,
        parameters: modelDecision.parameters || {},
        sourceType: 'ai' as const,
        chatGuid: undefined, // populated by channel if available
      };

      const executionResult: DispatchResult = await this.toolRouter.dispatch(dispatchRequest);

      const latencyMs = Date.now() - startTime;

      await this.auditTool.logEvent({
        event_type: 'task_execution',
        user_id: userId,
        task_name: modelDecision.task_name,
        status: 'success',
        latency_ms: latencyMs,
      });

      if (executionResult.notify) {
        await this.notificationTool.sendNotifications(identifiedTask.taskName, executionResult, user);
      }

      return {
        reply: executionResult.reply || 'Task completed successfully.',
        status: 'success',
        data: executionResult.data,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`runPipeline failed: ${message}`, error instanceof Error ? error.stack : undefined);

      await this.auditTool.logEvent({
        event_type: 'error',
        user_id: userId,
        status: 'error',
        result: message,
      });

      return {
        reply: 'Sorry, something went wrong while processing your message.',
        status: 'error',
      };
    }
  }

  private mapTasksToAITasks(tasks:Task[]): AITask[] {
    return tasks.map(t => ({
        taskName: t.taskName,
        description: t.description,
        actionType: t.actionType,
        parametersSchema: t.parametersSchema
    }));
  }
}
