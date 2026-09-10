import { Injectable } from "@nestjs/common";
import type { User } from "@home-ai/shared/domain/user/user";
import { isInQuietHours } from "@home-ai/shared/common/quiet-hours";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ToolStore } from "../../core/stores/tool/tool.store";
import { UserStore } from "../../core/stores/user/user.store";
import { AppConfigService } from "../../core/services/app-config.service";
import { NotificationQueueStore } from "../../core/stores/notification-queue/notification-queue.store";
import { LogStore } from "../../core/stores/monitoring/log/log.store";
import { NotificationLogStore } from "../../core/stores/monitoring/notification-log/notification-log.store";
import { Trace } from "src/common/decorators/trace.decorator";
import { BlueBubblesService } from "../blue-bubbles/blue-bubbles.service";

export type NotifyUserOptions = {
  skipQuietHours?: boolean;
};

@Injectable()
export class NotificationService {
  constructor(
    private readonly toolStore: ToolStore,
    private readonly userStore: UserStore,
    private readonly notificationQueueStore: NotificationQueueStore,
    private readonly appConfigService: AppConfigService,
    private readonly logStore: LogStore,
    private readonly notificationLogStore: NotificationLogStore,
    private readonly blueBubblesService: BlueBubblesService,
  ) {}

  /**
   * Whether at least one user would receive a notification for this tool,
   * using the same role resolution as {@link notifyUsersByTool}.
   */
  @Trace()
  async hasUsersToNotifyByTool(toolName: string): Promise<boolean> {
    const usersToNotify = await this.getUsersMatchingToolNotifyRoles(toolName);
    return usersToNotify.length > 0;
  }

  /**
   * Dispatches notifications to authorized users based on the tool's notifyRoles configuration.
   */
  @Trace()
  async notifyUsersByTool(message: string, toolName: string): Promise<void> {
    try {
      const usersToNotify = await this.getUsersMatchingToolNotifyRoles(toolName);

      if (usersToNotify.length === 0) {
        return;
      }

      for (const toNotify of usersToNotify) {
        await this.notifyUser(message, toNotify.id);
      }

      await this.logStore.create({
        severity: "info",
        message: `Dispatched ${usersToNotify.length} notifications for tool: ${toolName}`,
        metadata: { toolName, recipientCount: usersToNotify.length },
      });
    } catch (error: any) {
      await this.logStore.create({
        severity: "error",
        message: `Failed to dispatch notifications: ${error.message}`,
        metadata: { toolName, error: error.message },
      });
    }
  }

  @Trace()
  async notifyUser(
    message: string,
    toNotifyUserId: string,
    options: NotifyUserOptions = {},
  ): Promise<void> {
    const user = await this.userStore.getById(toNotifyUserId);
    if (!user?.active) {
      throw new Error(`Notification recipient ${toNotifyUserId} was not found`);
    }

    const now = new Date();
    const timeZone = await this.appConfigService.getTimezone();
    const deferForQuietHours =
      !options.skipQuietHours &&
      isInQuietHours(
        now,
        user.quietHoursStart,
        user.quietHoursEnd,
        timeZone,
      );

    if (deferForQuietHours) {
      await this.notificationQueueStore.create({
        userId: toNotifyUserId,
        message,
      });
      await this.logStore.create({
        userId: user.id,
        severity: "info",
        message: `Deferred notification for quiet hours`,
        metadata: { timezone: timeZone },
      });
      return;
    }

    await this.send(user, message);
  }

  /** Sends pending queue rows. Still-quiet rows stay pending and are checked again next hour. */
  @Cron(CronExpression.EVERY_HOUR)
  @Trace()
  async processDueQueue() {
    const start = Date.now();
    const pendingNotifications =
      await this.notificationQueueStore.getPendingNotifications();

    if (pendingNotifications.length === 0) {
      return;
    }

    const timeZone = await this.appConfigService.getTimezone();

    let sent = 0;
    let held = 0;

    for (const notification of pendingNotifications) {
      try {
        const user = await this.userStore.getById(notification.userId);
        if (!user) {
          await this.notificationQueueStore.markAsSent(notification.id);
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

        if (
          isInQuietHours(
            new Date(),
            user.quietHoursStart,
            user.quietHoursEnd,
            timeZone,
          )
        ) {
          held += 1;
          continue;
        }

        await this.send(user, notification.message);
        await this.notificationQueueStore.markAsSent(notification.id);
        sent += 1;

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
      }
    }

    await this.logStore.create({
      severity: "debug",
      message: `Notification queue processor completed`,
      metadata: {
        processedCount: pendingNotifications.length,
        sent,
        held,
        durationMs: Date.now() - start,
      },
    });
  }

  private async getUsersMatchingToolNotifyRoles(
    toolName: string,
  ): Promise<User[]> {
    const tool = await this.toolStore.getByName(toolName);
    if (!tool || !tool.notifyRoles || tool.notifyRoles.length === 0) {
      await this.logStore.create({
        severity: "debug",
        message: `No notification roles configured for tool: ${toolName}`,
        metadata: { toolName },
      });
      return [];
    }

    const usersToNotify = await this.userStore.getUsersByRoles(tool.notifyRoles);

    if (usersToNotify.length === 0) {
      await this.logStore.create({
        severity: "debug",
        message: `No target users found for roles: ${tool.notifyRoles.join(", ")}`,
        metadata: { toolName, roles: tool.notifyRoles },
      });
    }

    return usersToNotify;
  }

  /** iMessage now, then record it in the notification log. */
  private async send(user: User, message: string): Promise<void> {
    if (!user.phoneNumber) {
      throw new Error(`User ${user.id} has no phone number`);
    }

    await this.blueBubblesService.sendMessage(user.phoneNumber, message);
    await this.notificationLogStore.create({
      userId: user.id,
      message,
    });
  }
}
