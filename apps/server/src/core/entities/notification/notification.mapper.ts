import { NotificationDto } from '@home-ai/shared';
import { Notification } from './notification.domain';

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function toNotificationDto(n: Notification): NotificationDto {
  const dto = new NotificationDto();
  dto.id = n.id;
  dto.recipientUserId = n.recipientUserId ?? null;
  dto.taskRequestId = n.taskRequestId ?? null;
  dto.messageText = n.messageText;
  dto.status = n.status;
  dto.scheduledSendAfter = toIso(n.scheduledSendAfter);
  dto.sentAt = toIso(n.sentAt);
  dto.notes = n.notes ?? null;
  dto.createdAt = n.createdAt.toISOString();
  dto.updatedAt = n.updatedAt.toISOString();
  return dto;
}
