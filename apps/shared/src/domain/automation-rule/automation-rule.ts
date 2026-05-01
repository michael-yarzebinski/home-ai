import { Insertable, Updatable } from "../helper/crud.helper";

export enum TriggerType {
    DEVICE = 'DEVICE',           // Custom internal Device wrapper (e.g., "Fridge")
    TIME = 'TIME',               // CRON-based scheduled tasks
    SYSTEM = 'SYSTEM',           // Internal app events (e.g., "Startup")
}

export type TriggerConfigDevice = {
    type: TriggerType.DEVICE;
    deviceId: string;
    intent: string; // e.g., "When water level is below 20%"
};

export type TriggerConfigTime = {
    type: TriggerType.TIME;
    cron: string;
    timezone: string;
};

export type TriggerConfigSystem = {
    type: TriggerType.SYSTEM;
    eventName: string;
    intent?: string;
};

export type TriggerConfig =
    | TriggerConfigDevice
    | TriggerConfigTime
    | TriggerConfigSystem;

export enum ActionType {
    NOTIFICATION = 'NOTIFICATION',
    TASK = 'TASK', // Linked to your new Task/Job domain
    HA_SERVICE = 'HA_SERVICE',
    SCRIPT = 'SCRIPT'
}

/**
 * The definition of what the AI should actually do when triggered.
 */
export interface AutomationAction {
    id: string;
    type: ActionType;

    /**
     * The core objective for the LLM.
     * e.g., "Add 'Wax the car' to the Todo list and ask about supplies."
     */
    instruction: string;

    /**
     * Context-specific configuration for the action.
     * e.g., { "list": "Shopping", "priority": "high", "requiresApproval": true }
     */
    metadata?: Record<string, any>;

    /**
     * If provided, the LLM will only execute this action if this 
     * natural language condition is met against current state.
     */
    conditionOverride?: string;
}

export interface AutomationRule {
    id: string;
    userId: string;
    name: string;
    description?: string;
    trigger: TriggerConfig; // Strictly typed Discriminated Union
    actions: AutomationAction[];
    cooldownMinutes: number;
    lastRun?: Date;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type InsertableAutomationRule = Insertable<AutomationRule>;
export type UpdatableAutomationRule = Updatable<AutomationRule>;