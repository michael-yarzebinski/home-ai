import { Insertable, Updatable } from "../helper/crud.helper";
import { z } from 'zod';

export enum TriggerType {
    DEVICE = 'DEVICE',           // Custom internal Device wrapper (e.g., "Fridge")
    TIME = 'TIME',               // CRON-based scheduled tasks
    SYSTEM = 'SYSTEM',           // Internal app events (e.g., "Startup")
}

export const TriggerConfigDeviceSchema = z.object({
  type: z.literal(TriggerType.DEVICE),
  deviceId: z.string(),
  intent: z.string(), // e.g., "When water level is below 20%"
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

export type TriggerConfigDevice = z.infer<typeof TriggerConfigDeviceSchema>;
export type TriggerConfigTime = z.infer<typeof TriggerConfigTimeSchema>;
export type TriggerConfigSystem = z.infer<typeof TriggerConfigSystemSchema>;
export type TriggerConfig = z.infer<typeof TriggerConfigSchema>;

export enum ActionType {
    NOTIFICATION = 'NOTIFICATION',
    TASK = 'TASK', // Linked to your new Task/Job domain
    HA_SERVICE = 'HA_SERVICE',
    SCRIPT = 'SCRIPT'
}

/**
 * The definition of what the AI should actually do when triggered.
 */
export const AutomationActionSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(ActionType),
  /**
   * The core objective for the LLM.
   * e.g., "Add 'Wax the car' to the Todo list and ask about supplies."
   */
  instruction: z.string(),
  /**
   * Context-specific configuration for the action.
   * e.g., { "list": "Shopping", "priority": "high", "requiresApproval": true }
   */
  metadata: z.record(z.string(), z.unknown()).optional(),
  /**
   * If provided, the LLM will only execute this action if this
   * natural language condition is met against current state.
   */
  conditionOverride: z.string().optional(),
});

export type AutomationAction = z.infer<typeof AutomationActionSchema>;

export const AutomationRuleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  trigger: TriggerConfigSchema, // Strictly typed Discriminated Union
  actions: z.array(AutomationActionSchema),
  cooldownMinutes: z.number(),
  lastRun: z.date().optional(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AutomationRule = z.infer<typeof AutomationRuleSchema>;

export type InsertableAutomationRule = Insertable<AutomationRule>;
export type UpdatableAutomationRule = Updatable<AutomationRule>;