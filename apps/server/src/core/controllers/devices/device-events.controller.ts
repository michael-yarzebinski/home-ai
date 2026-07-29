import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { DeviceEventStore } from "../../stores/device/device-event.store";
import { DeviceStore } from "../../stores/device/device.store";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import type { AuthUser } from "../../auth/jwt.strategy";

@Controller("v1/device-events")
export class DeviceEventsController {
  constructor(
    private readonly deviceEventStore: DeviceEventStore,
    private readonly deviceStore: DeviceStore,
  ) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.deviceEventStore.search(
      { ...dto, includeInactive: false },
      authUser,
    );
  }

  @Get("device/:deviceId")
  async getByDeviceId(
    @Param("deviceId") deviceId: string,
    @Query(new ZodValidationPipe(SearchCriteriaSchema))
    criteria: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    const device = await this.deviceStore.getById(deviceId, authUser);
    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    return this.deviceEventStore.getByDeviceId(
      deviceId,
      { ...criteria, includeInactive: false },
      authUser,
    );
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const event = await this.deviceEventStore.getById(id, authUser);
    if (!event) {
      throw new NotFoundException(`Device event ${id} not found`);
    }
    return event;
  }
}
