import { Injectable, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { RecurringChecklistItemTriggerType } from "@home-ai/shared/domain/checklist/recurring-checklist-item";
import type { AuthUser } from "src/core/auth/jwt.strategy";
import { AppConfigService } from "src/core/services/app-config.service";
import { UserStore } from "src/core/stores/user/user.store";
import { LogStore } from "src/core/stores/monitoring/log/log.store";
import { ChecklistItemStore } from "../stores/checklist-item.store";
import { RecurringChecklistItemStore } from "../stores/recurring-checklist-item.store";
import { ChecklistManagerService } from "./checklist-manager.service";
import { isCronTriggerDue } from "./cron-occurrence";
import { Trace } from "src/common/decorators/trace.decorator";
import { currentTraceId } from "../../../common/trace-id";

export interface RecurringGenerationSummary {
  evaluated: number;
  due: number;
  created: number;
  skippedInvalidCron: number;
}

@Injectable()
export class ChecklistRecurringGenerationService implements OnModuleInit {
  private automationActor!: AuthUser;

  constructor(
    private readonly recurringItemStore: RecurringChecklistItemStore,
    private readonly checklistItemStore: ChecklistItemStore,
    private readonly checklistManagerService: ChecklistManagerService,
    private readonly appConfigService: AppConfigService,
    private readonly userStore: UserStore,
    private readonly logStore: LogStore,
  ) {}

  async onModuleInit() {
    const automationUserId =
      this.appConfigService.getFromEnv<string>("AUTOMATION_USER_ID");
    const user = await this.userStore.getById(automationUserId);
    if (!user) {
      throw new Error(
        `ChecklistRecurringGenerationService: AUTOMATION_USER_ID "${automationUserId}" does not match any user`,
      );
    }
    this.automationActor = { id: user.id, role: user.role };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  @Trace()
  async processRecurringChecklistItems() {
    const start = Date.now();
    const summary = await this.generateDueRecurringItems();
    const durationMs = Date.now() - start;

    await this.logStore.create({
      traceId: currentTraceId(),
      severity: "debug",
      message: `Recurring checklist generation completed in ${durationMs}ms`,
      metadata: {
        durationMs,
        evaluated: summary.evaluated,
        due: summary.due,
        created: summary.created,
        skippedInvalidCron: summary.skippedInvalidCron,
      },
    });
  }

  @Trace()
  async generateDueRecurringItems(): Promise<RecurringGenerationSummary> {
    const recurringItems = await this.recurringItemStore.getByTriggerType(
      RecurringChecklistItemTriggerType.CRON,
    );
    if (!recurringItems.length) {
      return {
        evaluated: 0,
        due: 0,
        created: 0,
        skippedInvalidCron: 0,
      };
    }

    const latestByRecurringId =
      await this.checklistItemStore.getLatestByRecurringItemIds(
        recurringItems.map((item) => item.id),
        true,
      );

    const now = new Date();
    const dueItems = [];
    let skippedInvalidCron = 0;

    for (const recurringItem of recurringItems) {
      const cronExpression = recurringItem.triggerConfig?.cron;
      if (!cronExpression) {
        skippedInvalidCron += 1;
        continue;
      }

      const latestGeneratedItem = latestByRecurringId.get(recurringItem.id);
      const dueCheck = isCronTriggerDue({
        cron: cronExpression,
        now,
        createdAt: recurringItem.createdAt,
        lastGeneratedAt: latestGeneratedItem?.createdAt,
        interval: recurringItem.triggerConfig?.interval,
        startDate: recurringItem.triggerConfig?.startDate,
      });

      if (!dueCheck.ok) {
        skippedInvalidCron += 1;
        continue;
      }

      if (dueCheck.due) {
        dueItems.push(recurringItem);
      }
    }

    if (!dueItems.length) {
      return {
        evaluated: recurringItems.length,
        due: 0,
        created: 0,
        skippedInvalidCron,
      };
    }

    const createdItems =
      await this.checklistManagerService.generateChecklistItemsFromRecurringItems(
        dueItems,
        this.automationActor,
      );

    return {
      evaluated: recurringItems.length,
      due: dueItems.length,
      created: createdItems.length,
      skippedInvalidCron,
    };
  }
}
