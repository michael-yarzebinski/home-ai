import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ToolStore } from "../../stores/tool/tool.store";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import type { AuthUser } from "../../auth/jwt.strategy";

@Controller("v1/tools")
export class ToolsController {
  constructor(private readonly toolStore: ToolStore) {}

  @Get()
  getAll(@CurrentUser() authUser: AuthUser) {
    return this.toolStore.getAll(authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const item = await this.toolStore.getById(id, authUser);
    if (!item) throw new NotFoundException(`Tool ${id} not found`);
    return item;
  }
}
