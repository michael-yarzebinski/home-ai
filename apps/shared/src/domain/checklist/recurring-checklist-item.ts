import { z } from 'zod';
import { ChecklistItemPriority } from './checklist-item';

export enum RecurringChecklistItemTriggerType {
    CRON = 'CRON',
    EVENT = 'EVENT',
}

export const RecurringChecklistItemTriggerConfigSchema = z.object({
    cron: z.string().optional(),
    eventTag: z.string().optional(),
    dueInDays: z.number().optional(),
});

export const RecurringChecklistItemMetadataSchema = z.object({
    videoLinks: z.array(z.string()).optional(),
    requiredItems: z.array(z.string()).optional(),
});

/** Blueprint rows in `recurring_checklist_items` (file name keeps legacy spelling). */
export const RecurringChecklistItemSchema = z.object({
    id: z.string(),
    checklistId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    defaultAssigneeId: z.string().optional(),
    priority: z.enum(ChecklistItemPriority),
    tags: z.array(z.string()),
    triggerType: z.enum(RecurringChecklistItemTriggerType),
    triggerConfig: RecurringChecklistItemTriggerConfigSchema,
    dependsOnRecurringIds: z.array(z.string()).optional(),
    metadata: RecurringChecklistItemMetadataSchema,
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type RecurringChecklistItem = z.infer<typeof RecurringChecklistItemSchema>;

export const InsertableRecurringChecklistItemSchema = RecurringChecklistItemSchema.omit({
    id: true,
    active: true,
    createdAt: true,
    updatedAt: true,
});
export const UpdatableRecurringChecklistItemSchema = InsertableRecurringChecklistItemSchema.partial();

export type InsertableRecurringChecklistItem = z.infer<typeof InsertableRecurringChecklistItemSchema>;
export type UpdatableRecurringChecklistItem = z.infer<typeof UpdatableRecurringChecklistItemSchema>;
