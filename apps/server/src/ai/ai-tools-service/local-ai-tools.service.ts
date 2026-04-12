import { Injectable } from '@nestjs/common';
import { AITask, AIToolsServiceBase } from './ai-tools.service.base';
import { ModelDecision } from './interfaces/model-decision';
import { Ollama } from 'ollama';
import { ChatMessage } from 'src/core/conversation-states/conversation-states.service';
import { PermissionTool } from '../tools/utility-tools/permission.tool';
import { ToolRouter } from '../router/tool.router';
import { AuditTool } from '../tools/utility-tools/audit.tool';
import { NotificationTool } from '../tools/utility-tools/notification.tool';
import { TasksService } from '../../core/tasks/tasks.service';
import { UsersService } from '../../core/users/users.service';
import { ConversationStatesService } from '../../core/conversation-states/conversation-states.service';

/**
 * Local implementation using Ollama.
 * The system prompt explicitly describes the exact ModelDecision structure the model must follow.
 */
@Injectable()
export class LocalAIToolsService extends AIToolsServiceBase {
  private readonly ollama: Ollama;

  constructor(
    permissionTool: PermissionTool,
    toolRouter: ToolRouter,
    auditTool: AuditTool,
    notificationTool: NotificationTool,
    tasksService: TasksService,
    usersService: UsersService,
    conversationStatesService: ConversationStatesService,
  ) {
    super(permissionTool, toolRouter, auditTool, notificationTool, tasksService, usersService, conversationStatesService);

    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434',
    });
  }

  protected async detectTaskWithModel(chatHistory: ChatMessage[], tasks: AITask[]): Promise<ModelDecision> {

    try {
        const systemPrompt = this.buildSystemPromptForTasks(tasks);


      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
      ];

      const model = process.env.OLLAMA_MODEL || process.env.LOCAL_MODEL || 'qwen2.5:7b';

      const response = await this.ollama.chat({
        model,
        messages,
        format: 'json',           // Ollama structured output
        options: { temperature: 0.0 }, // Very deterministic
      });

      const content = response.message?.content?.trim();
      if (!content) {
        throw new Error('Empty response from Ollama');
      }

      const decision = JSON.parse(content) as ModelDecision;
      return decision;

    } catch (error) {
      this.logger.error('Local Ollama detectTaskWithModel failed', error);
      return {
        action: 'error',
        clarification_question: 'Sorry, my local AI is having trouble right now. Could you rephrase?',
        task_name: null,
        parameters: {},
        pending_parameters: {},
        conversation_summary: null,
      };
    }
  }
}