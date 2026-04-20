export class NotificationDto {
  id!: string;
  recipientUserId?: string | null;
  taskRequestId?: string | null;
  messageText!: string;
  status!: string;
  scheduledSendAfter?: string | null;
  sentAt?: string | null;
  notes?: string | null;
  createdAt!: string;
  updatedAt!: string;
}
