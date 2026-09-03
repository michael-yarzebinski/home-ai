import { z } from 'zod';

export enum Role {
    ADMIN = 'admin',
    PARENT = 'parent',
    CHILD = 'child',
    GUEST = 'guest',
    READONLY = 'readonly',
    AUTOMATION = 'automation',
}
export const RoleSchema = z.nativeEnum(Role);
export const ChatSessionSchema = z.object({
    id: z.string(),
    userId: z.string(),
    summary: z.string().optional(),
    lastActivity: z.date(),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const DeviceLastTriggeredServiceSchema = z.object({
    entityId: z.string(),
    service: z.string(),
    triggeredBy: z.string(),
    timestamp: z.date(),
    metadata: z.unknown().optional(),
});
export const DeviceSchema = z.object({
    id: z.string(),
    slug: z.string(),
    friendlyName: z.string(),
    aliases: z.array(z.string()),
    room: z.string().optional(),
    category: z.string().optional(),
    readRoles: z.array(RoleSchema),
    writeRoles: z.array(RoleSchema),
    extraMetadata: z.unknown(),
    llmModelType: z.enum(['soon', 'immediate']).default('soon'),
    lastTriggeredService: DeviceLastTriggeredServiceSchema.optional(),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export enum TriggerType {
    DEVICE = 'DEVICE',
    TIME = 'TIME',
    SYSTEM = 'SYSTEM',
}
export const TriggerConfigDeviceSchema = z.object({
    type: z.literal(TriggerType.DEVICE),
    deviceId: z.string(),
    intent: z.string(),
});
export const TriggerConfigTimeSchema = z.object({
    type: z.literal(TriggerType.TIME),
    cron: z.string(),
    timezone: z.string(),
});
export const TriggerConfigSystemSchema = z.object({
    type: z.literal(TriggerType.SYSTEM),
    eventName: z.string(),
    intent: z.string().optional(),
});
export const TriggerConfigSchema = z.discriminatedUnion('type', [
    TriggerConfigDeviceSchema,
    TriggerConfigTimeSchema,
    TriggerConfigSystemSchema,
]);
export enum ActionType {
    NOTIFICATION = 'NOTIFICATION',
    TASK = 'TASK',
    HA_SERVICE = 'HA_SERVICE',
    SCRIPT = 'SCRIPT',
}
export const AutomationActionSchema = z.object({
    id: z.string(),
    type: z.nativeEnum(ActionType),
    instruction: z.string(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    conditionOverride: z.string().optional(),
});
export const AutomationRuleSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    description: z.string().optional(),
    trigger: TriggerConfigSchema,
    actions: z.array(AutomationActionSchema),
    cooldownMinutes: z.number(),
    lastRun: z.date().optional(),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const NoteSchema = z.object({
    id: z.string(),
    name: z.string(),
    friendlyName: z.string(),
    aliases: z.array(z.string()),
    readRoles: z.array(RoleSchema),
    writeRoles: z.array(RoleSchema),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const FactSchema = z.object({
    id: z.string(),
    key: z.string(),
    value: z.string(),
    tags: z.array(z.string()),
    readRoles: z.array(RoleSchema),
    writeRoles: z.array(RoleSchema),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const CalendarSchema = z.object({
    id: z.string(),
    name: z.string(),
    friendlyName: z.string(),
    aliases: z.array(z.string()),
    readRoles: z.array(RoleSchema),
    writeRoles: z.array(RoleSchema),
    color: z.string().optional(),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const UserSchema = z.object({
    id: z.string(),
    role: RoleSchema,
    name: z.string(),
    phoneNumber: z.string().optional(),
    accessCodeHash: z.string(),
    timezone: z.string(),
    quietHoursStart: z.string().optional(),
    quietHoursEnd: z.string().optional(),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const ToolSchema = z.object({
    id: z.string(),
    name: z.string(),
    friendlyName: z.string(),
    hints: z.string().optional(),
    requestRoles: z.array(RoleSchema),
    writeRoles: z.array(RoleSchema),
    notifyRoles: z.array(RoleSchema),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const LogSchema = z.object({
    id: z.string(),
    userId: z.string().optional(),
    severity: z.string(),
    message: z.string(),
    metadata: z.unknown(),
    createdAt: z.date(),
});
export const AuditSchema = z.object({
    id: z.string(),
    entityType: z.string(),
    entityId: z.string(),
    action: z.string(),
    userId: z.string().optional(),
    changes: z.unknown(),
    notes: z.string().optional(),
    createdAt: z.date(),
});
export const NotificationQueueSchema = z.object({
    id: z.string(),
    userId: z.string(),
    message: z.string(),
    importance: z.string(),
    scheduledFor: z.date(),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const AppConfigSchema = z.object({
    id: z.string(),
    key: z.string(),
    value: z.unknown(),
    description: z.string().optional(),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const IngredientSchema = z.object({
    id: z.string(),
    recipeId: z.string(),
    name: z.string(),
    quantity: z.number().optional(),
    unit: z.string().optional(),
    notes: z.string().optional(),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const NotificationLogSchema = z.object({
    id: z.string(),
    userId: z.string(),
    message: z.string(),
    createdAt: z.date(),
});
export enum LLMRole {
    USER = 'user',
    ASSISTANT = 'assistant',
    SYSTEM = 'system',
    TOOL = 'tool',
}
export const ChatMessageSchema = z.object({
    role: z.nativeEnum(LLMRole),
    content: z.string(),
    timestamp: z.date(),
    toolCallId: z.string().optional(),
    thoughtSignature: z.string().optional(),
});
export const ConversationSchema = z.object({
    id: z.string(),
    externalId: z.string(),
    userId: z.string(),
    messages: z.array(ChatMessageSchema),
    lastActivity: z.date(),
    isActive: z.boolean(),
    summary: z.string().optional(),
});
export const PendingActionSchema = z.object({
    id: z.string(),
    readableId: z.number(),
    toolId: z.string(),
    requesterId: z.string(),
    proposedArgs: z.unknown(),
    status: z.enum(['pending', 'approved', 'rejected']),
    reason: z.string().optional(),
    executedBy: z.string().optional(),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const RecipeSchema = z.object({
    id: z.string(),
    readableId: z.number(),
    url: z.string().optional(),
    title: z.string(),
    servings: z.number().optional(),
    prepTimeMinutes: z.number().optional(),
    cookTimeMinutes: z.number().optional(),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const AIAuditSchema = z.object({
    id: z.string(),
    userId: z.string(),
    chatSessionId: z.string().optional(),
    userMessage: z.string(),
    toolCalls: z.unknown().optional(),
    finalResponse: z.string().optional(),
    durationMs: z.number().optional(),
    success: z.boolean(),
    createdAt: z.date(),
});