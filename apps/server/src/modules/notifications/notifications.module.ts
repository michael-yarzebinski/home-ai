import { Module } from '@nestjs/common';
import { NotificationTool } from '../../ai/tools/utility-tools/notification.tool';
import { KnexModule } from '../../common/database/knex.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { BackgroundNotificationService } from './background-notification.service';

@Module({
  imports: [KnexModule],
  controllers: [NotificationsController],
  providers: [BackgroundNotificationService, NotificationsService, NotificationTool],
  exports: [BackgroundNotificationService, NotificationsService, NotificationTool],
})
export class NotificationsModule {}