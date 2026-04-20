import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { HomeAssistantService } from './home-assistant.service';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('admin/home-assistant')
@Roles('admin')
export class HomeAssistantAdminController {
  constructor(private readonly homeAssistantService: HomeAssistantService) {}

  @Get('entities/:entityId')
  async entityById(@Param('entityId') entityId: string) {
    const entity = await this.homeAssistantService.getState(entityId);
    if (!entity) {
      throw new NotFoundException(`Entity "${entityId}" not found in Home Assistant cache`);
    }
    return {
      entityId: entity.entity_id,
      state: entity.state,
      friendlyName: entity.attributes?.friendly_name,
      deviceClass: entity.attributes?.device_class,
    };
  }

  @Get('entities')
  async listEntities(@Query('q') q?: string) {
    if (q?.trim()) {
      const entity = await this.homeAssistantService.findEntityByName(q.trim());
      if (!entity) {
        return { entities: [] };
      }
      return {
        entities: [
          {
            entityId: entity.entity_id,
            state: entity.state,
            friendlyName: entity.attributes?.friendly_name,
            deviceClass: entity.attributes?.device_class,
          },
        ],
      };
    }

    const list = await this.homeAssistantService.getAllEntities();
    return { entities: list };
  }
}
