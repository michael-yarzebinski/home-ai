import { Injectable, Logger } from "@nestjs/common";
import type { User } from "@home-ai/shared/domain/user/user";
import { ToolStore } from "../stores/tool/tool.store";
import { UserStore } from "../stores/user/user.store";
import { NotificationQueueStore } from "../stores/notification-queue/notification-queue.store";
import { AppConfigService } from "./app-config.service";

export type NotifyUsersByToolContext =
  | { isRequesting: true; isNotifying: false }
  | { isRequesting: false; isNotifying: true };

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly toolStore: ToolStore,
    private readonly userStore: UserStore,
    private readonly notificationQueueStore: NotificationQueueStore,
    private readonly appConfigService: AppConfigService,
  ) {}

  /**
   * Whether at least one user would receive a notification for this tool and context,
   * using the same role resolution as {@link notifyUsersByTool} and the same recipient
   * skips as {@link notifyUser} (requester and automation user excluded).
   */
  async hasUsersToNotifyByTool(
    toolName: string,
    requestingUserId: string,
    context: NotifyUsersByToolContext,
  ): Promise<boolean> {
    const usersToNotify = await this.getUsersMatchingToolNotifyRoles(
      toolName,
      context,
    );
    if (usersToNotify.length === 0) {
      return false;
    }

    const automationUserId =
      await this.appConfigService.getFromEnv<string>("AUTOMATION_USER_ID");

    return usersToNotify.some(
      (u) => u.id !== requestingUserId && u.id !== automationUserId,
    );
  }

  /**
   * Dispatches notifications to authorized users based on the tool's notifyRoles configuration.
   * * @param message The content of the notification
   * @param toolName The name of the tool associated with the notification
   * @param requesterId The ID of the user who initiated the action
   */
  async notifyUsersByTool(
    message: string,
    toolName: string,
    requestingUserId: string,
    context: NotifyUsersByToolContext,
    importance: string = "low",
  ): Promise<void> {
    try {
      const usersToNotify = await this.getUsersMatchingToolNotifyRoles(
        toolName,
        context,
      );

      if (usersToNotify.length === 0) {
        return;
      }

      for (const toNotify of usersToNotify) {
        await this.notifyUser(
          message,
          toNotify.id,
          requestingUserId,
          importance,
        );
      }

      this.logger.log(
        `Queued ${usersToNotify.length} notifications for tool: ${toolName}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to dispatch notifications: ${error.message}`,
        error.stack,
      );
    }
  }

  private async getUsersMatchingToolNotifyRoles(
    toolName: string,
    context: NotifyUsersByToolContext,
  ): Promise<User[]> {
    const tool = await this.toolStore.getByName(toolName);
    if (!tool || !tool.notifyRoles || tool.notifyRoles.length === 0) {
      this.logger.debug(
        `No notification roles configured for tool: ${toolName}`,
      );
      return [];
    }

    const rolesToNotify = context.isNotifying
      ? tool.notifyRoles
      : tool.writeRoles;

    const usersToNotify = await this.userStore.getUsersByRoles(rolesToNotify);

    if (usersToNotify.length === 0) {
      this.logger.debug(
        `No target users found for roles: ${rolesToNotify.join(", ")}`,
      );
    }

    return usersToNotify;
  }

  async notifyUser(
    message: string,
    toNotifyUserId: string,
    requestingUserId: string,
    importance: string = "low",
  ): Promise<void> {
    const automationUserId =
      await this.appConfigService.getFromEnv<string>("AUTOMATION_USER_ID");
    if (
      toNotifyUserId === requestingUserId ||
      toNotifyUserId === automationUserId
    ) {
      return;
    }

    await this.notificationQueueStore.create({
      userId: toNotifyUserId,
      message,
      importance,
      scheduledFor: new Date(),
    });
  }
}
