import { Controller, Get } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('admin/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationService) {}

  @Get()
  async getAll() {
    return this.notificationsService.reader().getAll();
  }
}