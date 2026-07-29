import { z } from 'zod';

export enum ChecklistItemPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export enum ChecklistItemStatus {
    PENDING = 'pending',
    BLOCKED = 'blocked',
    COMPLETED = 'completed',
}

export const ChecklistItemMetadataSchema = z.object({
    videoLinks: z.array(z.string()).optional(),
    requiredItems: z.array(z.string()).optional(),
    manualUrl: z.string().optional(),
});

export const ChecklistItemSchema = z.object({
    id: z.string(),
    checklistId: z.string(),
    recurringItemId: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    assigneeId: z.string().optional(),
    priority: z.enum(ChecklistItemPriority),
    dueDate: z.date().optional(),
    status: z.enum(ChecklistItemStatus),
    dependsOn: z.array(z.string()).optional(),
    tags: z.array(z.string()),
    metadata: ChecklistItemMetadataSchema,
    completedAt: z.date().optional(),
    completedBy: z.string().optional(),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const InsertableChecklistItemSchema = ChecklistItemSchema.omit({
    id: true,
    active: true,
    createdAt: true,
    updatedAt: true,
});
export const UpdatableChecklistItemSchema = InsertableChecklistItemSchema.partial();

export type InsertableChecklistItem = z.infer<typeof InsertableChecklistItemSchema>;
export type UpdatableChecklistItem = z.infer<typeof UpdatableChecklistItemSchema>;

export const AssignChecklistItemBodySchema = z.object({
    assigneeId: z.string().uuid(),
});
export type AssignChecklistItemBody = z.infer<typeof AssignChecklistItemBodySchema>;
