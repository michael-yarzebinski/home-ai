import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { DeviceStore } from "../../stores/device/device.store";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import {
  UpdatableDeviceSchema,
  type UpdatableDevice,
} from "@home-ai/shared/domain/device/device";
import type { AuthUser } from "../../auth/jwt.strategy";

@Controller("v1/devices")
export class DevicesController {
  constructor(private readonly deviceStore: DeviceStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() user: AuthUser,
  ) {
    return this.deviceStore.search({ ...dto, includeInactive: false }, user);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const device = await this.deviceStore.getById(id, false, user);
    if (!device) throw new NotFoundException(`Device ${id} not found`);
    return device;
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatableDeviceSchema)) dto: UpdatableDevice,
    @CurrentUser() user: AuthUser,
  ) {
    return this.deviceStore.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.deviceStore.softDelete(id, user);
  }
}
