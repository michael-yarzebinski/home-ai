import { Inject, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Knex } from 'knex';
import { BlueBubblesService } from 'src/integration/blue-bubbles.service';
import { NotificationStore } from '../core/entities/notification/notification.store';
import { UsersService } from '../core/entities/user/user.service';

@Injectable()
export class BackgroundNotificationService implements OnModuleInit, OnModuleDestroy {
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private userService: UsersService,
    private blueBubblesService: BlueBubblesService,
    private notificationStore: NotificationStore,
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
  ) { }

  onModuleInit() {
    this.startBackgroundJob();
  }

  private startBackgroundJob() {
    this.intervalId = setInterval(async () => {
      await this.processQueuedNotifications();
    }, 60 * 1000); // Check every 60 seconds
  }

  private async processQueuedNotifications() {
    try {
      const now = new Date();

      const queued = await this.notificationStore.findQueuedQuietHoursDue(now);

      for (const notification of queued) {
        try {
          const user = await this.userService.reader().getById(notification.recipientUserId!);
          await this.blueBubblesService.sendIMessage({
            text: notification.messageText,
            handle: user.messagingId,
          });

          await this.notificationStore.update(notification.id, {
            status: 'sent',
            sentAt: new Date(),
          });
        } catch (err) {
          console.error(`Failed to send queued notification ${notification.id}:`, err);
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