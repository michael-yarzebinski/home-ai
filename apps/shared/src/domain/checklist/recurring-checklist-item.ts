import { z } from 'zod';
import { DurationSchema } from '../../common/duration';
import { ChecklistItemPriority } from './checklist-item';

export enum RecurringChecklistItemTriggerType {
    CRON = 'CRON',
    EVENT = 'EVENT',
}

export const RecurringChecklistItemTriggerConfigSchema = z.object({
    cron: z.string().optional(),
    eventTag: z.string().optional(),
    dueInDays: z.number().optional(),
    /** Every Nth cron match. 1 (or omitted) = every match; 2 = every other Sunday, etc. */
    interval: z.number().int().min(1).optional(),
    /** YYYY-MM-DD; first "on" occurrence is the first cron tick on or after this date. */
    startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
        .optional(),
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
    notifyBefore: DurationSchema.nullish(),
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
