import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  DeviceCreateDto,
  DeviceUpdateDto,
  SearchRequestDto,
  SetActiveDto,
} from '@home-ai/shared';
import { DeviceService } from './device.service';
import { Roles } from '../../../auth/decorators/roles.decorator';
import {
  toDeviceDto,
  fromDeviceCreateDto,
  fromDeviceUpdateDto,
} from './device.mapper';
import { ValidationService } from '../../validation/validation.service';

@Controller('admin/devices')
@Roles('admin')
export class DeviceAdminController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly deviceService: DeviceService,
  ) {}

  @Post('search')
  async search(@Body() body: SearchRequestDto) {
    const searchRequest = await this.validationService.validateAndTransform(body, SearchRequestDto);
    return await this.deviceService.search(searchRequest);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const row = await this.deviceService.reader().getById(id, true);
    return toDeviceDto(row);
  }

  @Post()
  async create(@Body() body: DeviceCreateDto) {
    const payload = fromDeviceCreateDto(body);
    if (payload.haEntityId) {
      const all = await this.deviceService.reader().getAll();
      const dup = all.find((d) => d.haEntityId === payload.haEntityId);
      if (dup) {
        throw new BadRequestException(
          `A device with haEntityId "${payload.haEntityId}" already exists`,
        );
      }
    }
    const row = await this.deviceService.createDevice({
      ...payload,
      notificationGuidance: payload.notificationGuidance as Record<string, any> | undefined,
      metadata: payload.metadata as Record<string, any> | undefined,
    });
    return toDeviceDto(row);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: DeviceUpdateDto) {
    const updates = fromDeviceUpdateDto(body);
    const row = await this.deviceService.updateDevice(id, {
      ...updates,
      notificationGuidance: updates.notificationGuidance as Record<string, any> | undefined,
      metadata: updates.metadata as Record<string, any> | undefined,
    });
    return toDeviceDto(row);
  }

  @Patch(':id/active')
  async setActive(@Param('id') id: string, @Body() body: SetActiveDto) {
    const row = await this.deviceService.setDeviceActive(id, body.active);
    return toDeviceDto(row);
  }

}
