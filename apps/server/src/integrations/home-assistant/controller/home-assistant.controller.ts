import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { DeviceStore } from "../../../core/stores/device/device.store";
import { HomeAssistantService } from "../services/home-assistant.service";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { AuthUser } from "../../../core/auth/jwt.strategy";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import {
  CallServiceSchema,
  CallService,
} from "@home-ai/shared/domain/device/call-service";

@Controller("v1/home-assistant")
export class HomeAssistantController {
  constructor(
    private readonly deviceStore: DeviceStore,
    private readonly homeAssistantService: HomeAssistantService,
  ) {}

  @Get("device-status/:id")
  async getDeviceStatus(
    @Param("id") deviceId: string,
    @CurrentUser() authUser: AuthUser,
  ) {
    const device = await this.deviceStore.getById(deviceId, authUser, false);
    if (!device) {
      throw new NotFoundException("Device not found");
    }
    return this.homeAssistantService.getDeviceStateAndServices(device.slug);
  }

  @Post("call-service")
  async callService(
    @Body(new ZodValidationPipe(CallServiceSchema)) payload: CallService,
    @CurrentUser() authUser: AuthUser,
  ) {
    const device = await this.deviceStore.getById(
      payload.deviceId,
      authUser,
      false,
    );
    if (!device) {
      throw new NotFoundException("Device not found");
    }

    const deviceState =
      await this.homeAssistantService.getDeviceStateAndServices(device.slug);
    const entity = deviceState.entities.find(
      (e) => e.entityId === payload.entityId,
    );
    const service = entity?.services[payload.service];
    if (!entity || !service) {
      throw new NotFoundException("Entity or service not found");
    }

    return this.homeAssistantService.callService(
      entity.entityId,
      payload.service,
      payload.data,
    );
  }
}
