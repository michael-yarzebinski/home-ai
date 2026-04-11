import { Inject, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Knex } from 'knex';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BackgroundNotificationService implements OnModuleInit, OnModuleDestroy {
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.startBackgroundJob();
    console.log('✅ Background notification service started (checks every 60 seconds for queued notifications)');
  }

  private startBackgroundJob() {
    this.intervalId = setInterval(async () => {
      await this.processQueuedNotifications();
    }, 60 * 1000); // Check every 60 seconds
  }

  private async processQueuedNotifications() {
    try {
      const now = new Date();

      const queued = await this.knex('notifications')
        .where('status', 'queued_quiet_hours')
        .andWhere('scheduled_send_after', '<=', now)
        .select('*');

      for (const notif of queued) {
        try {
          // TODO: Replace with real BlueBubbles integration
          console.log(`[Background] Sending queued notification to ${notif.recipient_user_id}: ${notif.message_text}`);

          await this.knex('notifications')
            .where('notification_id', notif.notification_id)
            .update({
              status: 'sent',
              sent_at: this.knex.fn.now(),
            });
        } catch (err) {
          console.error(`Failed to send queued notification ${notif.notification_id}:`, err);
        }
      }
    } catch (error) {
      console.error('Background notification processor error:', error);
    }
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('🛑 Background notification service stopped');
    }
  }
}