import { Body, Controller, DefaultValuePipe, Post } from '@nestjs/common';
import { SearchRequestDto } from '@home-ai/shared';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { toLogDto } from './log.mapper';
import { LogService } from './log.serice';
import { ValidationService } from '../../../validation/validation.service';

@Controller('admin/logs')
@Roles('admin')
export class LogAdminController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly logService: LogService,
  ) {}

  @Post('search')
  async search(@Body(new DefaultValuePipe({})) body: SearchRequestDto) {
    const searchRequest = await this.validationService.validateAndTransform(body, SearchRequestDto);
    const { logs, total, page, pageSize } = await this.logService.search(searchRequest);
    return {
      items: logs.map((l) => toLogDto(l)),
      total,
      ...(page != null ? { pageNumber: page, pageSize } : {}),
    };
  }
}
