import { Controller, Get } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('admin/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getAll() {
    return this.notificationsService.getNotificationHistory();
  }

  @Get('pending')
  async getPending() {
    return this.notificationsService.getPendingNotifications();
  }
}