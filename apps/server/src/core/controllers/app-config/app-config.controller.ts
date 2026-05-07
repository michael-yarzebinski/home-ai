import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { AppConfigStore } from "../../stores/app-config/app-config.store";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import type { AuthUser } from "../../auth/jwt.strategy";

@Controller("v1/app-config")
export class AppConfigController {
  constructor(private readonly appConfigStore: AppConfigStore) {}

  @Get()
  getAll(@CurrentUser() user: AuthUser) {
    return this.appConfigStore.getAll(false, user);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const item = await this.appConfigStore.getById(id, false, user);
    if (!item) throw new NotFoundException(`AppConfig ${id} not found`);
    return item;
  }
}
