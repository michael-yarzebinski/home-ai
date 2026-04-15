import { Injectable, Logger } from "@nestjs/common";
import { LLMEventType, LLMServiceBase } from "src/ai/llm-services/llm.service.base";
import { ChatMessage, ConversationStatesService, ConversationState } from "src/core/conversation-states/conversation-states.service";
import { Task } from "src/core/tasks/task.domain";
import { TasksService } from "src/core/tasks/tasks.service";
import { UserPermissionsService } from "src/core/user-permissions/user-permissions.service";
import { User } from "src/core/users/user.domain";
import { UsersService } from "src/core/users/users.service";
import { DispatchRequest } from "src/tools/interfaces/dispatch-request";
import { DispatchResult } from "src/tools/interfaces/dispatch-result";
import { MessageRequest } from "./interfaces/message-request";
import { AIAction, TaskDecision } from "./interfaces/task-decision";
import { ToolRouter } from "./router/tool.router";
import { LogService } from "src/core/log/log.serice";
import { ToolRegistryService } from "src/core/tools/registry/tool-registry.service";
import { ValidationService } from "src/core/validation/validation.service";


/** Normalized response for all channels. */
export interface TaskPipelineResult {
  reply: string;
  status: string;
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

@Injectable()
export class AIOrchestratorService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly llmService: LLMServiceBase,
    private readonly userPermissionsService: UserPermissionsService,
    protected readonly toolRouter: ToolRouter,
    protected readonly tasksService: TasksService,
    protected readonly usersService: UsersService,
    protected readonly conversationStatesService: ConversationStatesService,
    private readonly logService: LogService,
    private readonly toolRegistryService: ToolRegistryService,
    private readonly validationService: ValidationService,
  ) {
  }

  async processMessage(request: MessageRequest): Promise<TaskPipelineResult> {
    this.logger.debug('processMessage: IN');

    const user = await this.validateUser(request.userIdentifier);
    if (!user) {
      await this.logService.log({
        message: `User ${request.userIdentifier} not recognized`,
        severity: 'warn',
        userId: request.userIdentifier,
        data: request,
      })
      return { reply: '', status: '' };
    }

    const text = request.messageText?.trim();
    if (!text) {
      await this.logService.log({
        message: 'No message provided',
        severity: 'warn',
        data: request,
      })
      return { reply: '', status: '' };
    }

    const chatHistory = await this.buildChatMessages({ ...request, messageText: text }, user.id);
    const tasks = await this.toolRegistryService.getTasksAndParameters();
    const aiTasks = await this.generateAITasks(tasks);
    const prompt = this.generateTaskPrompt(aiTasks);

    const taskIdentification = await this.llmService.queryLLM<TaskDecision>({
      prompt, 
      userId: user.id, 
      chatHistory,
      eventType: LLMEventType.TASK_CATEGORIZATION
    });

    if (taskIdentification.action === AIAction.CLARIFY) {
      await this.logService.log({
        message: `AI requested clarification for Task Categorization`,
        severity: 'info',
        data: {
          prompt,
          response: taskIdentification.response
        },
        userId: user.id
      });

      return {
        reply: taskIdentification.response,
        status: AIAction.CLARIFY,
      };
    }
    const identifiedTask = tasks.find((t) => t.taskName === taskIdentification.taskName);

    if (!taskIdentification.taskName || !identifiedTask) {
      await this.logService.log({
        message: `AI could not categorize the task`,
        severity: 'warn',
        data: {
          prompt,
        },
        userId: user.id
      });

      return {
        reply: "I'm sorry, I didn't understand what you'd like me to do. Could you rephrase?",
        status: 'no_task_detected',
      };
    }

    const permissionResult = this.userPermissionsService.checkPermission(user, identifiedTask);

    if (!(permissionResult.canRequest || permissionResult.canExecute)) {
      await this.logService.log({
        message: `User did not meet the permissions to request or execute the specified task`,
        severity: 'warn',
        data: {
          prompt,
          task: identifiedTask,
        },
        userId: user.id
      });
      return { reply: '', status: '' };
    }

    const typedParameters = await this.validationService.validateAndTransform(taskIdentification.parameters, identifiedTask.parametersSchema)

    const dispatchRequest: DispatchRequest = {
      task: identifiedTask,
      user,
      permission: permissionResult,
      parameters: typedParameters,
      chatHistory,
    };

    const executionResult: DispatchResult = await this.toolRouter.dispatch(dispatchRequest);

    if (executionResult.notify) {
      // await this.notificationTool.sendNotifications(identifiedTask.taskName, executionResult, user);
    }

    return {
      reply: executionResult.reply || 'Task completed successfully.',
      status: 'success',
    };



  }

  private async validateUser(userId: string) : Promise<User | undefined> {
    if (!userId || userId.trim() === "") {
      return;
    }

    return await this.usersService.findByUserIdOrHandle(userId.trim()) ?? undefined;
  } 

  private async generateAITasks(tasks: Task[]) : Promise<AITask[]> {
    return tasks.map(t => ({
        taskName: t.taskName,
        description: t.description,
        actionType: t.actionType,
        parametersSchema: t.parametersSchema
      }));
    } 

  private generateTaskPrompt(tasks: AITask[]): string {
    let taskSection = 'AVAILABLE TASKS:\n\n';

    tasks.forEach((task) => {
      taskSection += `TASK NAME: ${task.taskName}\n`;
      taskSection += `DESCRIPTION: ${task.description || 'No description provided'}\n`;

      if (task.parametersSchema) {
        try {
          const schema = typeof task.parametersSchema === 'string' 
            ? JSON.parse(task.parametersSchema) 
            : task.parametersSchema;

          taskSection += `SCHEMA (YOU MUST FOLLOW THIS EXACTLY):\n`;
          taskSection += JSON.stringify(schema, null, 2) + '\n';
        } catch (e) {
          taskSection += `SCHEMA: (unavailable)\n`;
        }
      }
      taskSection += '\n';
    });

    return `You are a strict, precise Home AI task extractor.

${taskSection}

STRICT RULES — FOLLOW THESE OR FAIL:
- Choose EXACTLY ONE task from the list.
- For the chosen task, you MUST provide ALL "required" fields from its schema.
- If any required field is missing or ambiguous → set "action": "clarify" and ask a clear question. Do NOT guess.
- Do NOT invent or add fields that are not in the schema.
- Return ONLY valid JSON. No explanations, no markdown, no extra text whatsoever.

OUTPUT FORMAT (exactly this structure):

{
  "action": "execute" or "clarify",
  "taskName": "exact taskName from the list",
  "parameters": { ...must strictly match the schema for the chosen task... },
  "clarification_question": "natural question to ask the user" or null,
  "pendingParameters": { ...missing fields... } or {},
  "conversationSummary": "very brief summary" or null
}

Now process the user's latest message.`;
  }

  /**
   * After any pipeline outcome, merge assistant output into the conversation row (iMessage, chat UI, etc.).
   */
  // private async persistConversationFromPipelineResult(
  //   chatGuid: string,
  //   userId: string,
  //   result: TaskPipelineResult,
  // ): Promise<void> {
  //   const currentState = await this.conversationStatesService.findOrCreateByChatGuid(chatGuid, userId);

  //   const updateData: Partial<ConversationState> = {
  //     last_ai_message: result.reply || JSON.stringify(result),
  //     current_task_type:
  //       (result as TaskPipelineResult & { task_type?: string }).task_type ?? currentState.current_task_type,
  //     pending_parameters: result.pending_parameters ?? currentState.pending_parameters,
  //     conversation_summary: result.conversation_summary ?? currentState.conversation_summary,
  //   };

  //   if (result.clarification_question) {
  //     updateData.clarification_question = result.clarification_question;
  //   }

  //   await this.conversationStatesService.updateFromAIOutput(chatGuid, updateData);
  // }

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
}
