import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class NotificationsService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async getPendingNotifications() {
    return this.knex('notifications')
      .where('status', 'queued_quiet_hours')
      .orWhere('status', 'pending')
      .orderBy('created_at', 'asc');
  }

  async markAsSent(notification_id: number) {
    return this.knex('notifications')
      .where('notification_id', notification_id)
      .update({
        status: 'sent',
        sent_at: this.knex.fn.now(),
      });
  }

  async getNotificationHistory(limit: number = 50) {
    return this.knex('notifications')
      .orderBy('created_at', 'desc')
      .limit(limit);
  }
}