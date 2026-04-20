import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { SearchRequestDto, SetActiveDto } from '@home-ai/shared';
import { AppConfigService } from './app-config.service';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { toAppConfigDto } from './app-config.mapper';
import { ValidationService } from '../../validation/validation.service';

@Controller('admin/app-config')
@Roles('admin')
export class AppConfigAdminController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly appConfigService: AppConfigService,
  ) {}

  @Post('search')
  async search(@Body() body: SearchRequestDto) {
    const searchRequest = await this.validationService.validateAndTransform(body, SearchRequestDto);
    return await this.appConfigService.search(searchRequest);
  }

  @Get(':key')
  async getOne(@Param('key') key: string) {
    const found = await this.appConfigService.reader().getByKey(key);
    if (!found) {
      throw new NotFoundException(`Config key "${key}" not found`);
    }
    return toAppConfigDto(found);
  }

  @Patch(':key/active')
  async setActive(@Param('key') key: string, @Body() body: SetActiveDto) {
    await this.appConfigService.toggleConfig(key, body.active);
    return { key, active: body.active };
  }
}
