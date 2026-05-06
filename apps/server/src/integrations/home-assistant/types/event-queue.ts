export interface EventQueueItem {
    entityId: string;
    oldState: string;
    newState: string;
    ruleIds: string[];
}

export interface EventQueueBuffer {
    events: EventQueueItem[];
    ruleIds: string[];
}