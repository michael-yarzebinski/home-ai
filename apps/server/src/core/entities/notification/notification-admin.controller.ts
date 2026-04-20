import { Body, Controller, Post } from '@nestjs/common';
import { SearchRequestDto } from '@home-ai/shared';
import { NotificationService } from './notification.service';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { ValidationService } from '../../validation/validation.service';

@Controller('admin/notifications')
@Roles('admin')
export class NotificationAdminController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly notificationsService: NotificationService,
  ) {}

  @Post('search')
  async search(@Body() body: SearchRequestDto) {
    const searchRequest = await this.validationService.validateAndTransform(body, SearchRequestDto);
    return await this.notificationsService.search(searchRequest);
  }
}
