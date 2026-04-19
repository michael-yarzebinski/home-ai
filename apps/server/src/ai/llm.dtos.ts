import { ChatMessage } from "src/core/entities/conversation-state/conversation-state.service";

export enum LLMAction {
    EXECUTE = 'execute',
    CLARIFY = 'clarify',
    UNSUPPORTED = 'unsupported',
}

export enum LLMEventType {
    TASK_OR_APPROVAL = 'task-or-approval',
    TASK_CATEGORIZATION = 'task-categorization',
    TASK_FOLLOWUP = 'task-followup',
    NOTIFICATION_MESSAGE = 'notification-message',
}

export interface LLMQueryParams {
    prompt: string;
    userId: string;
    eventType: LLMEventType;
    chatHistory?: ChatMessage[];
}


export interface LLMResponseBase {
    action: LLMAction;
}
