import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { DeviceStore } from "../../../stores/device/device.store";
import { Roles } from "../../../../common/decorators/roles.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";

import { AuthUser } from "../../../auth/jwt.strategy";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator";

@Controller("v1/admin/devices")
@Roles(Role.ADMIN)
export class DevicesAdminController {
  constructor(private readonly deviceStore: DeviceStore) { }

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.deviceStore.search(dto, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const device = await this.deviceStore.getById(id, authUser, true);
    if (!device) throw new NotFoundException(`Device ${id} not found`);
    return device;
  }

  @Post(":id/restore")
  async restore(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    await this.deviceStore.restore(id, authUser);
    return this.deviceStore.getById(id, authUser);
  }
}
