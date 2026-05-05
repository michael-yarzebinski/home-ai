import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  NotFoundException, Param, Post, Put,
} from '@nestjs/common';
import { DeviceStore } from '../../stores/device/device.store';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@home-ai/shared/domain/role/role';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { SearchCriteriaSchema, type SearchCriteriaBase } from '@home-ai/shared/search/search';
import {
  InsertableDeviceSchema, UpdatableDeviceSchema,
  type InsertableDevice, type UpdatableDevice,
} from '@home-ai/shared/domain/device/device';

@Controller('v1/admin/devices')
@Roles(Role.ADMIN)
export class DevicesAdminController {
  constructor(private readonly deviceStore: DeviceStore) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  search(@Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase) {
    return this.deviceStore.search(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const device = await this.deviceStore.getById(id, true);
    if (!device) throw new NotFoundException(`Device ${id} not found`);
    return device;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ZodValidationPipe(InsertableDeviceSchema)) dto: InsertableDevice) {
    return this.deviceStore.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdatableDeviceSchema)) dto: UpdatableDevice) {
    return this.deviceStore.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param('id') id: string) {
    return this.deviceStore.softDelete(id);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    await this.deviceStore.restore(id);
    return this.deviceStore.getById(id, true);
  }
}
