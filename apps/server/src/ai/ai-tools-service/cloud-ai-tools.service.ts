import { Injectable } from '@nestjs/common';
import { AITask, AIToolsServiceBase } from './ai-tools.service.base';
import { ModelDecision } from './interfaces/model-decision';
import { ChatMessage } from '../../core/conversation-states/conversation-states.service';
import OpenAI from 'openai'; // xAI Grok is compatible with OpenAI SDK
import { PermissionTool } from '../tools/utility-tools/permission.tool';
import { ToolRouter } from '../router/tool.router';
import { AuditTool } from '../tools/utility-tools/audit.tool';
import { NotificationTool } from '../tools/utility-tools/notification.tool';
import { TasksService } from '../../core/tasks/tasks.service';
import { UsersService } from '../../core/users/users.service';
import { ConversationStatesService } from '../../core/conversation-states/conversation-states.service';

/**
 * Cloud implementation using Grok via xAI (OpenAI-compatible SDK).
 * Uses structured outputs via response_format to guarantee the ModelDecision shape.
 */
@Injectable()
export class CloudAIToolsService extends AIToolsServiceBase {
  private readonly client: OpenAI;

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

    this.client = new OpenAI({
      apiKey: process.env.XAI_API_KEY || process.env.GROK_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });
  }

  protected async detectTaskWithModel(chatHistory: ChatMessage[], tasks: AITask[]): Promise<ModelDecision> {

    try {

        const systemPrompt = this.buildSystemPromptForTasks(tasks);

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
      ];

      const completion = await this.client.chat.completions.create({
        model: 'grok-2' as const, // or 'grok-3', 'grok-beta' — check your available models
        messages,
        response_format: { type: 'json_object' }, // Grok supports JSON mode; full JSON schema supported on recent models
        temperature: 0.0,
        max_tokens: 1024,
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('Empty response from Grok');
      }

      const decision = JSON.parse(content) as ModelDecision;
      return decision;

    } catch (error) {
      this.logger.error('Cloud Grok detectTaskWithModel failed', error);
      return {
        action: 'clarify',
        clarification_question: 'Sorry, Grok is having trouble right now. Could you rephrase?',
        task_name: null,
        parameters: {},
        pending_parameters: {},
        conversation_summary: null,
      };
    }
  }
}