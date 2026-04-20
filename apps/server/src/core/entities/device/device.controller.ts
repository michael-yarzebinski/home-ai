import { Body, Controller, DefaultValuePipe, Get, Param, Post } from '@nestjs/common';
import { SearchRequestDto } from '@home-ai/shared';
import { DeviceService } from './device.service';
import { toDeviceDto } from './device.mapper';
import { ValidationService } from '../../validation/validation.service';

@Controller('v1/devices')
export class DeviceController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly deviceService: DeviceService,
  ) {}

  @Post('search')
  async search(@Body(new DefaultValuePipe({})) body: SearchRequestDto) {
    const searchRequest = await this.validationService.validateAndTransform(body, SearchRequestDto);
    searchRequest.includeInactive = false;
    return await this.deviceService.search(searchRequest);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const row = await this.deviceService.reader().getById(id);
    return toDeviceDto(row);
  }
}
