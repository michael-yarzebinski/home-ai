export interface Notification {
    id: string;
    recipientUserId?: string | null;
    taskRequestId?: string | null;
    messageText: string;
    status: string;
    scheduledSendAfter?: Date | null;
    sentAt?: Date | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }