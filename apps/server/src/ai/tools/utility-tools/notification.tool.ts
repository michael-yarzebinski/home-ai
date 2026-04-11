import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Knex } from 'knex';

@Injectable()
export class NotificationTool {
  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send notifications based on task configuration and quiet hours
   */
  async sendNotifications(
    taskName: string,
    executionResult: any,
    triggeringUser: any | null
  ): Promise<void> {
    try {
      // Get the task to know who to notify
      const task = await this.knex('tasks')
        .where('task_name', taskName)
        .first();

      if (!task || !task.notify_roles) {
        return; // No notifications configured
      }

      const notifyRoles = task.notify_roles.split(',').map(r => r.trim());

      // Get all users who should be notified
      const recipients = await this.knex('users')
        .whereIn('role', notifyRoles)
        .select('user_id', 'name', 'messaging_id', 'quiet_start', 'quiet_end');

      for (const recipient of recipients) {
        const message = this.buildNotificationMessage(taskName, executionResult, triggeringUser);

        // Check quiet hours
        const isInQuietHours = this.isInQuietHours(recipient);

        if (isInQuietHours) {
          // Queue for later
          await this.knex('notifications').insert({
            recipient_user_id: recipient.user_id,
            message_text: message,
            task_request_id: executionResult.taskRequestId || null,
            status: 'queued_quiet_hours',
            scheduled_send_after: this.getQuietHoursEndTime(recipient),
          });
        } else {
          // Send immediately (placeholder - integrate with BlueBubbles later)
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
      console.error('Notification error:', error);
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

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Simple quiet hours check (assumes quiet_start < quiet_end for same day)
    // This can be improved for overnight quiet hours later
    return false; // Placeholder - implement real logic based on your needs
  }

  private getQuietHoursEndTime(user: any): Date {
    const endTime = new Date();
    // Placeholder - set to quiet_end time
    return endTime;
  }

  private async sendImmediateNotification(messagingId: string, message: string): Promise<void> {
    // TODO: Integrate with BlueBubbles API here
    console.log(`[Notification] Would send to ${messagingId}: ${message}`);
    // Real implementation will call BlueBubbles REST API
  }
}