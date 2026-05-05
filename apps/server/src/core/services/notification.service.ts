import { Injectable, Logger } from "@nestjs/common";
import { ToolStore } from "../stores/tool/tool.store";
import { UserStore } from "../stores/user/user.store";
import { NotificationQueueStore } from "../stores/notification-queue/notification-queue.store";
import { AppConfigService } from "./app-config.service";

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly toolStore: ToolStore,
    private readonly userStore: UserStore,
    private readonly notificationQueueStore: NotificationQueueStore,
    private readonly appConfigService: AppConfigService,
  ) { }

  /**
   * Dispatches notifications to authorized users based on the tool's notifyRoles configuration.
   * * @param message The content of the notification
   * @param toolName The name of the tool associated with the notification
   * @param requesterId The ID of the user who initiated the action
   */
  async notifyUsersByTool(
    message: string,
    toolName: string,
    requesterId: string,
    context:
      | {
        isRequesting: true;
        isNotifying: false;
      }
      | {
        isRequesting: false;
        isNotifying: true;
      },
    importance: string = "low",
  ): Promise<void> {
    try {
      // 1. Fetch the tool to get notifyRoles
      const tool = await this.toolStore.getByName(toolName);
      if (!tool || !tool.notifyRoles || tool.notifyRoles.length === 0) {
        this.logger.debug(
          `No notification roles configured for tool: ${toolName}`,
        );
        return;
      }

      const rolesToNotify = context.isNotifying
        ? tool.notifyRoles
        : tool.writeRoles;

      // 2. Find all users that match the notification roles
      const usersToNotify = await this.userStore.getUsersByRoles(rolesToNotify);

      if (usersToNotify.length === 0) {
        this.logger.debug(
          `No target users found for roles: ${rolesToNotify.join(", ")}`,
        );
        return;
      }

      for (const toNotify of usersToNotify) {
        await this.notifyUser(message, toNotify.id, requesterId, importance);
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

  async notifyUser(
    message: string,
    toNotifyUserId: string,
    originalRequestUserId?: string,
    importance: string = "low",
  ): Promise<void> {
    const automationUserId = await this.appConfigService.getFromEnv<string>("AUTOMATION_USER_ID");
    if (toNotifyUserId === originalRequestUserId || toNotifyUserId === automationUserId) {
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
