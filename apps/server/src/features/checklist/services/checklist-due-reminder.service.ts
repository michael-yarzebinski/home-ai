import { Injectable, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  formatDuration,
  subtractDuration,
} from "@home-ai/shared/common/duration";
import { type ChecklistItem } from "@home-ai/shared/domain/checklist/checklist-item";
import { AppConfigService } from "src/core/services/app-config.service";
import { NotificationService } from "src/integrations/notification/notification.service";
import { LogStore } from "src/core/stores/monitoring/log/log.store";
import { UserStore } from "src/core/stores/user/user.store";
import { Trace } from "src/common/decorators/trace.decorator";
import { ChecklistItemStore } from "../stores/checklist-item.store";
import { currentTraceId } from "../../../common/trace-id";

export interface DueReminderSummary {
  evaluated: number;
  notified: number;
  skipped: number;
}

@Injectable()
export class ChecklistDueReminderService implements OnModuleInit {
  private automationUserId!: string;

  constructor(
    private readonly checklistItemStore: ChecklistItemStore,
    private readonly notificationService: NotificationService,
    private readonly appConfigService: AppConfigService,
    private readonly userStore: UserStore,
    private readonly logStore: LogStore,
  ) {}

  async onModuleInit() {
    this.automationUserId =
      this.appConfigService.getFromEnv<string>("AUTOMATION_USER_ID");
    const user = await this.userStore.getById(this.automationUserId);
    if (!user) {
      throw new Error(
        `ChecklistDueReminderService: AUTOMATION_USER_ID "${this.automationUserId}" does not match any user`,
      );
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  @Trace()
  async processDueReminders() {
    const start = Date.now();
    const summary = await this.notifyDueItems();
    const durationMs = Date.now() - start;

    await this.logStore.create({
      traceId: currentTraceId(),
      severity: "debug",
      message: `Checklist due reminders completed in ${durationMs}ms`,
      metadata: {
        durationMs,
        evaluated: summary.evaluated,
        notified: summary.notified,
        skipped: summary.skipped,
      },
    });
  }

  @Trace()
  async notifyDueItems(now: Date = new Date()): Promise<DueReminderSummary> {
    const candidates = await this.checklistItemStore.findDueReminderCandidates();
    const dueItems = candidates.filter((item) => this.isInReminderWindow(item, now));

    let notified = 0;
    let skipped = 0;

    for (const item of dueItems) {
      try {
        if (!item.assigneeId || !item.notifyBefore) {
          skipped += 1;
          continue;
        }

        await this.notificationService.notifyUser(
          `Reminder: "${item.title}" is due in ${formatDuration(item.notifyBefore)}.`,
          item.assigneeId,
        );
        await this.checklistItemStore.markReminderSent(item.id, now);
        notified += 1;
      } catch (error: any) {
        skipped += 1;
        await this.logStore.create({
          traceId: currentTraceId(),
          severity: "error",
          message: `Failed to queue due reminder for checklist item ${item.id}`,
          metadata: {
            itemId: item.id,
            error: error?.message ?? String(error),
          },
        });
      }
    }

    return {
      evaluated: candidates.length,
      notified,
      skipped,
    };
  }

  private isInReminderWindow(item: ChecklistItem, now: Date): boolean {
    if (!item.dueDate || !item.notifyBefore) {
      return false;
    }
    return subtractDuration(new Date(item.dueDate), item.notifyBefore) <= now;
  }
}
