import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { ConfigService } from '@nestjs/config';

import { DetectTaskTool } from './detect-task.tool';
import { PermissionTool } from './permission.tool';
import { ExecutionRouter } from './execution.router';
import { AuditTool } from './audit.tool';
import { NotificationTool } from './notification.tool';
import { TasksService } from '../modules/tasks/tasks.service';
import { ChatMessage } from 'src/modules/conversation-states/conversation-states.service';

export interface AIConfig {
  provider: 'local' | 'cloud';
  url: string;
  model: string;
  apiKey?: string;
  temperature: number;
  format: 'json' | 'json_object';
}

export interface ModelDecision {
  action: 'execute_task' | 'clarify' | 'update_fact' | 'summary' | 'noop';
  task_name?: string | null;
  parameters?: Record<string, any>;
  clarification_question?: string | null;
  pending_parameters?: Record<string, any>;
  conversation_summary?: string | null;
  needs_approval?: boolean;
}

@Injectable()
export class AIToolsService {

  private readonly aiConfig: AIConfig;

  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
    private readonly configService: ConfigService,
    private readonly detectTaskTool: DetectTaskTool,
    private readonly permissionTool: PermissionTool,
    private readonly executionRouter: ExecutionRouter,
    private readonly auditTool: AuditTool,
    private readonly notificationTool: NotificationTool,
    private readonly tasksService: TasksService,
    // ConversationStatesService is not needed here anymore since we receive history directly
  ) {
    this.aiConfig = this.loadAIConfig();
  }

  private loadAIConfig(): AIConfig {
    const provider = this.configService.get<'local' | 'cloud'>('AI_PROVIDER', 'local');

    if (provider === 'cloud') {
      return {
        provider: 'cloud',
        url: this.configService.get<string>('CLOUD_AI_URL', 'https://api.openai.com/v1/chat/completions')!,
        model: this.configService.get<string>('CLOUD_MODEL', 'gpt-4o-mini')!,
        apiKey: this.configService.get<string>('CLOUD_AI_API_KEY'),
        temperature: this.configService.get<number>('AI_TEMPERATURE', 0.0),
        format: 'json_object',
      };
    } else {
      return {
        provider: 'local',
        url: this.configService.get<string>('LOCAL_AI_URL', 'http://localhost:11434/api/generate')!,
        model: this.configService.get<string>('LOCAL_MODEL', 'qwen2.5:7b')!,
        apiKey: undefined,
        temperature: this.configService.get<number>('AI_TEMPERATURE', 0.0),
        format: 'json',
      };
    }
  }

  async processMessage(
    rawMessage: string,
    userId: string | null,
    source: string = 'chat'
  ): Promise<any> {
    const history: ChatMessage[] = [{ role: 'user', content: rawMessage }];
    return this.processMessageWithHistory(history, userId, source);
  }

  async processMessageWithHistory(
    chatHistory: ChatMessage[],
    userId: string | null,
    source: string = 'chat'
  ): Promise<any> {
    const startTime = Date.now();

    try {
      await this.auditTool.logEvent({
        event_type: 'message_received',
        user_id: userId,
        raw_input: chatHistory[chatHistory.length - 1]?.content || '',
        metadata: { source },
      });

      let user;
      if (userId) {
        user = await this.permissionTool.getUser(userId);
      }

      const tasks = await this.tasksService.findEnabledForAI();

      const modelDecision = await this.callModelForDecision(chatHistory, tasks, user);

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

      const permissionResult = await this.permissionTool.checkPermission(
        user,
        modelDecision.task_name,
        modelDecision.parameters || {}
      );

      if (!permissionResult.allowed) {
        await this.auditTool.logEvent({
          event_type: 'permission_denied',
          user_id: userId,
          task_name: modelDecision.task_name,
          status: 'denied',
        });
        return { reply: permissionResult.message, status: 'permission_denied' };
      }

      const executionResult = await this.executionRouter.execute(
        modelDecision.task_name,
        modelDecision.parameters || {},
        user
      );

      const latencyMs = Date.now() - startTime;

      await this.auditTool.logEvent({
        event_type: 'task_execution',
        user_id: userId,
        task_name: modelDecision.task_name,
        status: 'success',
        latency_ms: latencyMs,
      });

      if (executionResult.notify) {
        await this.notificationTool.sendNotifications(modelDecision.task_name, executionResult, user);
      }

      return {
        reply: executionResult.reply || 'Task completed successfully.',
        status: 'success',
        data: executionResult.data,
      };

    } catch (error: any) {
      console.error('Error in processMessageWithHistory:', error);
      await this.auditTool.logEvent({
        event_type: 'error',
        user_id: userId,
        status: 'error',
        result: error.message,
      });
      return {
        reply: "Sorry, something went wrong while processing your message.",
        status: 'error',
      };
    }
  }

  private async callModelForDecision(
    chatHistory: ChatMessage[],
    tasks: any[],
    user: any | null
  ): Promise<ModelDecision> {
    const taskList = tasks.map(t => ({
      task_name: t.task_name,
      description: t.description,
    }));

    const systemPrompt = `
You are a precise, privacy-first home assistant for a family.

Available actions:
- "execute_task": when you have ALL required parameters
- "clarify": when information is missing — ask ONE clear, friendly question
- "update_fact": when the user wants you to remember something
- "summary": when asked for a summary
- "noop": if nothing should be done

Available tasks: ${JSON.stringify(taskList, null, 2)}

CRITICAL RULES:
- Never guess missing parameters. If anything is missing, use action "clarify" and return a clear clarification_question.
- Also return pending_parameters showing what is still missing.
- Output ONLY valid JSON. No extra text.
`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
    ];

    try {
      let rawOutput = '{}';

      if (this.aiConfig.provider === 'cloud') {
        const res = await fetch(this.aiConfig.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.aiConfig.apiKey}`,
          },
          body: JSON.stringify({
            model: this.aiConfig.model,
            messages: messages,
            temperature: this.aiConfig.temperature,
            response_format: { type: this.aiConfig.format },
          }),
        });

        if (!res.ok) throw new Error(`Cloud AI error ${res.status}`);
        const data: any = await res.json();
        rawOutput = data.choices?.[0]?.message?.content || '{}';

      } else {
        // Local Ollama
        const promptText = messages
          .map(m => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n\n');

        const res = await fetch(this.aiConfig.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.aiConfig.model,
            prompt: promptText,
            stream: false,
            temperature: this.aiConfig.temperature,
            format: this.aiConfig.format,
          }),
        });

        if (!res.ok) throw new Error(`Ollama error ${res.status}`);
        const data: any = await res.json();
        rawOutput = data.response || '{}';
      }

      let decision: ModelDecision = { action: 'noop', task_name: null, parameters: {} };

      try {
        decision = JSON.parse(rawOutput);
      } catch (e) {
        console.error('Failed to parse model JSON:', rawOutput);
      }

      return decision;

    } catch (error) {
      console.error('Model call failed:', error);
      return { action: 'noop', task_name: null, parameters: {} };
    }
  }
}