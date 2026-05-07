import { Injectable, NotFoundException } from "@nestjs/common";
import { ChecklistStore } from "src/features/checklist/stores/checklist.store";
import { RecurringChecklistItemStore } from "src/features/checklist/stores/recurring-checklist-item.store";
import { ChecklistItemStore } from "src/features/checklist/stores/checklist-item.store";
import { RequestUser } from "src/core/stores/abstract/abstract-entity.store";
import {
  ChecklistItem,
  ChecklistItemStatus,
} from "@home-ai/shared/domain/checklist/checklist-item";
import { RecurringChecklistItem } from "@home-ai/shared/domain/checklist/recurring-checklist-item";

@Injectable()
export class ChecklistManagerService {
  constructor(
    private readonly checklistStore: ChecklistStore,
    private readonly recurringChecklistItemStore: RecurringChecklistItemStore,
    private readonly checklistItemStore: ChecklistItemStore,
  ) {}

  checklistReader(): Pick<
    ChecklistStore,
    "search" | "getById" | "getByIds" | "getAll"
  > {
    return this.checklistStore;
  }

  recurringChecklistItemReader(): Pick<
    RecurringChecklistItemStore,
    | "search"
    | "getById"
    | "getByIds"
    | "getAll"
    | "getByChecklistId"
    | "getByDependsOnMany"
    | "getByTags"
  > {
    return this.recurringChecklistItemStore;
  }

  checklistItemReader(): Pick<
    ChecklistItemStore,
    | "search"
    | "getById"
    | "getByIds"
    | "getAll"
    | "getByChecklistId"
    | "getByDependsOn"
  > {
    return this.checklistItemStore;
  }

  async checkItem(
    checklistId: string,
    checklistItemId: string,
    user: RequestUser,
  ): Promise<ChecklistItem> {
    const checklist = await this.checklistStore.getById(
      checklistId,
      false,
      user,
    );
    if (!checklist) {
      throw new NotFoundException("Checklist not found");
    }

    const checkedItem = this.checklistItemStore.update(
      checklistItemId,
      {
        status: ChecklistItemStatus.COMPLETED,
        completedAt: new Date(),
        completedBy: user.id,
      },
      user,
    );

    const dependentItems = await this.checklistItemStore.getByDependsOn(
      checklistItemId,
      false,
      user,
    );
    for (const item of dependentItems) {
      const remainingDependsOn = item.dependsOn?.filter(
        (id) => id !== checklistItemId,
      );

      if (
        item.status === ChecklistItemStatus.BLOCKED &&
        remainingDependsOn?.length === 0
      ) {
        await this.checklistItemStore.update(
          item.id,
          {
            dependsOn: [],
            status: ChecklistItemStatus.PENDING,
          },
          user,
        );
      }
    }

    return checkedItem;
  }

  async uncheckItem(
    checklistId: string,
    checklistItemId: string,
    user: RequestUser,
  ): Promise<ChecklistItem> {
    const checklist = await this.checklistStore.getById(
      checklistId,
      false,
      user,
    );
    if (!checklist) {
      throw new NotFoundException("Checklist not found");
    }

    return this.checklistItemStore.update(
      checklistItemId,
      {
        completedAt: undefined,
        completedBy: undefined,
      },
      user,
    );
  }

  async generateChecklistItemsFromRecurringItems(
    recurringItems: RecurringChecklistItem[],
    user: RequestUser,
  ): Promise<ChecklistItem[]> {
    const recurringById = new Map<string, RecurringChecklistItem>(
      recurringItems.map((item) => [item.id, item]),
    );

    const unresolvedDependencyIds = new Set(
      recurringItems.flatMap((item) => item.dependsOnRecurringIds ?? []),
    );

    while (unresolvedDependencyIds.size > 0) {
      const missingDependencyIds = Array.from(unresolvedDependencyIds).filter(
        (dependencyId) => !recurringById.has(dependencyId),
      );

      if (missingDependencyIds.length === 0) {
        break;
      }

      const foundDependencies = await this.recurringChecklistItemStore.getByIds(
        missingDependencyIds,
        false,
        user,
      );

      if (!foundDependencies.length) {
        break;
      }

      for (const dependency of foundDependencies) {
        recurringById.set(dependency.id, dependency);

        for (const nextDependencyId of dependency.dependsOnRecurringIds ?? []) {
          unresolvedDependencyIds.add(nextDependencyId);
        }

        unresolvedDependencyIds.delete(dependency.id);
      }
    }

    const allRecurringItems = Array.from(recurringById.values());
    const recurringToChecklistItemId = new Map<string, string>();
    const createdChecklistItems: ChecklistItem[] = [];

    for (const recurringItem of allRecurringItems) {
      const checklistItem = await this.checklistItemStore.create(
        {
          checklistId: recurringItem.checklistId,
          recurringItemId: recurringItem.id,
          title: recurringItem.title,
          description: recurringItem.description,
          assigneeId: recurringItem.defaultAssigneeId,
          priority: recurringItem.priority,
          dueDate: this.calculateDueDate(recurringItem.triggerConfig),
          status: ChecklistItemStatus.PENDING,
          tags: recurringItem.tags,
          metadata: recurringItem.metadata,
          completedAt: undefined,
          completedBy: undefined,
        },
        user,
      );

      recurringToChecklistItemId.set(recurringItem.id, checklistItem.id);
      createdChecklistItems.push(checklistItem);
    }

    const finalizedChecklistItems: ChecklistItem[] = [];
    for (const createdItem of createdChecklistItems) {
      const recurringItem = recurringById.get(
        createdItem.recurringItemId ?? "",
      );
      const dependsOnChecklistItemIds = (
        recurringItem?.dependsOnRecurringIds ?? []
      )
        .map((dependencyRecurringId) =>
          recurringToChecklistItemId.get(dependencyRecurringId),
        )
        .filter(
          (dependencyChecklistItemId): dependencyChecklistItemId is string =>
            Boolean(dependencyChecklistItemId),
        );

      if (!dependsOnChecklistItemIds.length) {
        finalizedChecklistItems.push(createdItem);
        continue;
      }

      const updatedChecklistItem = await this.checklistItemStore.update(
        createdItem.id,
        {
          dependsOn: dependsOnChecklistItemIds,
          status: ChecklistItemStatus.BLOCKED,
        },
        user,
      );
      finalizedChecklistItems.push(updatedChecklistItem);
    }

    return finalizedChecklistItems;
  }

  private calculateDueDate(
    triggerConfig: RecurringChecklistItem["triggerConfig"],
  ): Date | undefined {
    if (triggerConfig.dueInDays) {
      return new Date(
        Date.now() + triggerConfig.dueInDays * 24 * 60 * 60 * 1000,
      );
    }
    return undefined;
  }
}
