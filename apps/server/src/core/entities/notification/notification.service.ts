// src/notifications/notification.service.ts
import { Injectable } from '@nestjs/common';
import { NotificationStore } from './notification.store';
import { Notification } from './notification.domain'
import { v4 } from 'uuid';

@Injectable()
export class NotificationService {
  constructor(private readonly notificationStore: NotificationStore) {}

  reader(): Pick<NotificationStore, 'getAll' | 'getAllActive' | 'getById'> {
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
}