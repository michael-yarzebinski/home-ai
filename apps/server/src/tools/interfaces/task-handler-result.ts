export enum TaskHandlerStatus {
    SUCCESS = 'success',
    CLARIFICATION_NEEDED = 'clarification-needed',
    ERROR = 'error',
}

export type TaskHandlerResult = {
    status: TaskHandlerStatus.SUCCESS | TaskHandlerStatus.CLARIFICATION_NEEDED;
    reply: string;
    data?: any;
} | {
    status: TaskHandlerStatus.ERROR,
    error: any;
}