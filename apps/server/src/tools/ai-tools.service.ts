import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { DetectTaskTool } from './detect-task.tool';
import { PermissionTool } from './permission.tool';
import { ExecutionRouter } from './execution.router';
import { AuditTool } from './audit.tool';
import { NotificationTool } from './notification.tool';

interface OllamaResponse {
  response?: string;
  done?: boolean;
  total_duration?: number;
}

interface ModelDecision {
  task_name: string | null;
  parameters: any;
}

@Injectable()
export class AiToolsService {
  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
    private readonly detectTaskTool: DetectTaskTool,
    private readonly permissionTool: PermissionTool,
    private readonly executionRouter: ExecutionRouter,
    private readonly auditTool: AuditTool,
    private readonly notificationTool: NotificationTool,
  ) {}

  async processMessage(
    rawMessage: string,
    userId: string | null,
    source: string = 'chat'
  ): Promise<any> {
    const startTime = Date.now();

    try {
      await this.auditTool.logEvent({
        event_type: 'message_received',
        user_id: userId,
        raw_input: rawMessage,
        metadata: { source },
      });

      let user;
      if (userId) {
        user = await this.permissionTool.getUser(userId);
      }

      // Get all available tasks
      const tasks = await this.knex('tasks')
        .where('enabled', true)
        .select('task_name', 'description', 'parameters_schema');

      // Let the model decide the task
      const modelDecision = await this.callOllamaForTaskSelection(rawMessage, tasks, user);

      if (!modelDecision.task_name) {
        return {
          reply: "I'm sorry, I didn't understand what task you'd like me to perform. Could you try rephrasing?",
          status: "no_task_detected",
        };
      }

      // Check permission
      const permissionResult = await this.permissionTool.checkPermission(
        user,
        modelDecision.task_name,
        modelDecision.parameters
      );

      if (!permissionResult.allowed) {
        await this.auditTool.logEvent({
          event_type: 'permission_denied',
          user_id: userId,
          task_name: modelDecision.task_name,
          status: 'denied',
          result: permissionResult.message,
        });
        return {
          reply: permissionResult.message,
          status: 'permission_denied',
        };
      }

      // Execute the task
      const executionResult = await this.executionRouter.execute(
        modelDecision.task_name,
        modelDecision.parameters,
        user
      );

      const latencyMs = Date.now() - startTime;

      await this.auditTool.logEvent({
        event_type: 'task_execution',
        user_id: userId,
        task_name: modelDecision.task_name,
        status: 'success',
        result: executionResult.message,
        latency_ms: latencyMs,
      });

      if (executionResult.notify) {
        await this.notificationTool.sendNotifications(
          modelDecision.task_name,
          executionResult,
          user
        );
      }

      return {
        reply: executionResult.reply || 'Task completed successfully.',
        status: 'success',
        data: executionResult.data,
      };

    } catch (error: any) {
      console.error('Error in processMessage:', error);
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

  /**
   * Call Ollama to let the model decide which task to perform
   */
  private async callOllamaForTaskSelection(
    message: string,
    tasks: any[],
    user: any | null
  ): Promise<ModelDecision> {
    const taskList = tasks.map(t => ({
      task_name: t.task_name,
      description: t.description,
    }));

    const prompt = `
You are a precise home assistant. Your ONLY job is to map the user's request to exactly one task and extract the required parameters.

Available tasks:
${JSON.stringify(taskList, null, 2)}

User message: "${message}"

CRITICAL RULES:
- For "store_fact": always return "parameters" with BOTH "key" and "value"
  - "key" should be a short, lowercase label (e.g. "mikes_chipotle_order")
  - "value" should be the full details the user wants remembered
- For "retrieve_fact": "parameters" should have "key" with the thing to recall
- Never return empty parameters if the task requires them

Respond with **valid JSON only** — no explanation, no extra text:

{
  "task_name": "exact_task_name_from_list",
  "parameters": {
    "key": "short_label",
    "value": "full details here"
  }
}

If you cannot map it, return:
{ "task_name": null, "parameters": {} }
`;

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5:7b',        // Use this better model
          prompt: prompt,
          stream: false,
          temperature: 0.0,           // Very deterministic
          format: 'json'
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data: OllamaResponse = await response.json() as any;
      const rawOutput = data.response || '{}';

      let parsed: ModelDecision = { task_name: null, parameters: {} };

      try {
        parsed = JSON.parse(rawOutput);
      } catch (e) {
        console.error('Failed to parse JSON from Ollama:', rawOutput);
      }

      // Strong fallback for store_fact
      if (parsed.task_name === 'store_fact' && (!parsed.parameters.key || !parsed.parameters.value)) {
        parsed.parameters = {
          key: 'user_fact_' + Date.now(),
          value: message
        };
      }

      return parsed;

    } catch (error) {
      console.error('Ollama call failed:', error);
      return { task_name: null, parameters: {} };
    }
  }
}