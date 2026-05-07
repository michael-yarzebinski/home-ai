// src/background/notification-queue.processor.ts
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { NotificationQueueStore } from "../../core/stores/notification-queue/notification-queue.store";
import { NotificationLogStore } from "../../core/stores/monitoring/notification-log/notification-log.store";
import { BlueBubblesService } from "../../integrations/blue-bubbles/blue-bubbles.service";
import { LogStore } from "../../core/stores/monitoring/log/log.store";
import { UserStore } from "../../core/stores/user/user.store";

@Injectable()
export class NotificationQueueProcessor {
  constructor(
    private readonly notificationQueueStore: NotificationQueueStore,
    private readonly notificationLogStore: NotificationLogStore,
    private readonly blueBubblesService: BlueBubblesService,
    private readonly userStore: UserStore,
    private readonly logStore: LogStore,
  ) { }

  /**
   * Runs every minute to process queued notifications.
   * Respects per-user quiet hours.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async processNotificationQueue() {
    const start = Date.now();

    await this.logStore.create({
      severity: "debug",
      message: "Starting notification queue processor",
      metadata: { timestamp: new Date().toISOString() },
    });

    const dueNotifications =
      await this.notificationQueueStore.getDueNotifications();

    if (dueNotifications.length === 0) {
      return;
    }

    for (const notification of dueNotifications) {
      try {
        const user = await this.userStore.getById(notification.userId);
        if (!user) {
          await this.logStore.create({
            severity: "warn",
            message: `Notification in queue for unknown user`,
            metadata: {
              notificationId: notification.id,
              userId: notification.userId,
            },
          });
          continue;
        }

        // Check quiet hours
        const now = new Date();
        const isInQuietHours = this.isInQuietHours(user, now);

        if (isInQuietHours) {
          await this.logStore.create({
            severity: "debug",
            message: `Skipping notification - user ${user.name} is in quiet hours`,
            metadata: { notificationId: notification.id, userId: user.id },
          });
          continue;
        }

        // Send the message
        await this.blueBubblesService.sendMessage(
          user.phoneNumber!,
          notification.message,
        );

        // Move to notification log and delete from queue
        await this.notificationLogStore.create({
          userId: notification.userId,
          message: notification.message,
        });

        await this.notificationQueueStore.softDelete(notification.id);

        await this.logStore.create({
          userId: user.id,
          severity: "info",
          message: `Sent queued notification to user ${user.id}`,
          metadata: { notificationId: notification.id },
        });
      } catch (err: any) {
        await this.logStore.create({
          severity: "error",
          message: `Failed to process queued notification`,
          metadata: { notificationId: notification.id, error: err.message },
        });

        continue;
      }
    }

    const duration = Date.now() - start;
    await this.logStore.create({
      severity: "debug",
      message: `Notification queue processor completed`,
      metadata: {
        processedCount: dueNotifications.length,
        durationMs: duration,
      },
    });
  }

  private isInQuietHours(user: any, now: Date): boolean {
    if (!user.quietHoursStart || !user.quietHoursEnd) return false;

    const currentHour = now.getHours();
    const quietStart = parseInt(user.quietHoursStart.split(":")[0]);
    const quietEnd = parseInt(user.quietHoursEnd.split(":")[0]);

    // Simple logic: if current time is between quiet start and quiet end
    if (quietStart < quietEnd) {
      return currentHour >= quietStart && currentHour < quietEnd;
    } else {
      // Overnight quiet hours (e.g. 22:00 - 07:00)
      return currentHour >= quietStart || currentHour < quietEnd;
    }
  }
}
