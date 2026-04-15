import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Knex } from 'knex';
import { ToolBase } from '../tool.base';
import type { ToolRequest } from '../../tools/interfaces/tool-request';
import type { ToolResult } from '../../tools/interfaces/tool-result';
import { TaskName } from 'src/core/tasks/task-name';
import { RegisterTool } from 'src/core/tools/decorators/register-tool.decorator';
import { ToolRegistryService } from 'src/core/tools/registry/tool-registry.service';

@Injectable()
export class NotificationTool extends ToolBase {

  private readonly logger = new Logger(NotificationTool.name);

  readonly metadata = {
    taskName: TaskName.DailySummary, // Internal utility tool
    description: 'Send notifications to users based on task completion and quiet hours rules',
    parameterDto: class {} as any, // Internal tool
    hints: ['notify', 'send message', 'alert user'],
    actionType: 'send_notification',
  };

  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
    private readonly configService: ConfigService,
    protected toolRegistryService: ToolRegistryService
  ) {
    super(toolRegistryService);
  }

  async sendNotifications(
    taskName: string,
    executionResult: any,
    triggeringUser: any | null
  ): Promise<void> {
    try {
      const task = await this.knex('tasks')
        .where('task_name', taskName)
        .first();

      if (!task || !task.notify_roles) {
        return;
      }

      const notifyRoles = task.notify_roles.split(',').map((r: string) => r.trim());

      const recipients = await this.knex('users')
        .whereIn('role', notifyRoles)
        .select('user_id', 'name', 'messaging_id', 'quiet_start', 'quiet_end');

      for (const recipient of recipients) {
        const message = this.buildNotificationMessage(taskName, executionResult, triggeringUser);
        const isInQuietHours = this.isInQuietHours(recipient);

        if (isInQuietHours) {
          await this.knex('notifications').insert({
            recipient_user_id: recipient.user_id,
            message_text: message,
            task_request_id: executionResult.taskRequestId || null,
            status: 'queued_quiet_hours',
            scheduled_send_after: this.getQuietHoursEndTime(recipient),
          });
        } else {
          await this.sendImmediateNotification(recipient.messaging_id, message);

          await this.knex('notifications').insert({
            recipient_user_id: recipient.user_id,
            message_text: message,
            task_request_id: executionResult.taskRequestId || null,
            status: 'sent',
            sent_at: this.knex.fn.now(),
          });
        }
      }
    } catch (error) {
      this.logger.error('Notification error:', error);
    }
  }

  private buildNotificationMessage(
    taskName: string,
    executionResult: any,
    triggeringUser: any | null
  ): string {
    const userName = triggeringUser?.name || 'Someone';
    return `${userName} triggered "${taskName}": ${executionResult.message || 'Task completed'}`;
  }

  private isInQuietHours(user: any): boolean {
    if (!user.quiet_start || !user.quiet_end) return false;
    return false; // Placeholder - implement real logic
  }

  private getQuietHoursEndTime(user: any): Date {
    const endTime = new Date();
    return endTime;
  }

  private async sendImmediateNotification(messagingId: string, message: string): Promise<void> {
    console.log(`[Notification] Would send to ${messagingId}: ${message}`);
  }

  async execute(request: ToolRequest): Promise<ToolResult> {
    return {
      success: false,
      reply: 'NotificationTool is an internal utility and should not be called directly.',
    };
  }
}
