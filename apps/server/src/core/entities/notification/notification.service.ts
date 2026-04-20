// src/notifications/notification.service.ts
import { Injectable } from '@nestjs/common';
import { NotificationDto, SearchRequestDto, SearchResponseDto, SearchUtils } from '@home-ai/shared';
import { NotificationStore } from './notification.store';
import { Notification } from './notification.domain'
import { v4 } from 'uuid';
import { toNotificationDto } from './notification.mapper';

@Injectable()
export class NotificationService {
  constructor(private readonly notificationStore: NotificationStore) {}

  reader(): Pick<NotificationStore, 'getAll' | 'getById'> {
    return this.notificationStore;
  }

  async createNotification(data: {
    recipientUserId?: string;
    taskRequestId?: string;
    messageText: string;
    status?: string;
    scheduledSendAfter?: Date;
    notes?: string;
  }): Promise<Notification> {
    return this.notificationStore.create({
      id: v4(),
      recipientUserId: data.recipientUserId,
      taskRequestId: data.taskRequestId,
      messageText: data.messageText,
      status: data.status ?? 'pending',
      scheduledSendAfter: data.scheduledSendAfter,
      notes: data.notes,
    });
  }

  async markSent(id: string): Promise<Notification> {
    return this.notificationStore.update(id, { status: 'sent', sentAt: new Date() });
  }

  async search(
    criteria: SearchRequestDto,
  ): Promise<SearchResponseDto<NotificationDto>> {
    const { skip, take } = SearchUtils.toSkipTake(criteria);
    const result = await this.notificationStore.search(
      criteria.search,
      skip,
      take,
      criteria.includeInactive,
    );
    const notificationDtos = result.data.map((n) => toNotificationDto(n));
    return SearchUtils.toSearchResponseDto(criteria, notificationDtos, result.total);
  }
}