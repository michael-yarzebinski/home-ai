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
import { AppConfigStore } from "../../../stores/app-config/app-config.store";
import { Roles } from "../../../../common/decorators/roles.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import {
  InsertableAppConfigSchema,
  UpdatableAppConfigSchema,
  type InsertableAppConfig,
  type UpdatableAppConfig,
} from "@home-ai/shared/domain/app-config/app-config";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator";
import { AuthUser } from "../../../auth/jwt.strategy";

@Controller("v1/admin/app-config")
@Roles(Role.ADMIN)
export class AppConfigAdminController {
  constructor(private readonly appConfigStore: AppConfigStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.appConfigStore.search(dto, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const item = await this.appConfigStore.getById(id, authUser, true);
    if (!item) throw new NotFoundException(`AppConfig ${id} not found`);
    return item;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(InsertableAppConfigSchema))
    dto: InsertableAppConfig,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.appConfigStore.create(dto, authUser);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatableAppConfigSchema))
    dto: UpdatableAppConfig,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.appConfigStore.update(id, dto, authUser);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    return this.appConfigStore.softDelete(id, authUser);
  }

  @Post(":id/restore")
  async restore(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    await this.appConfigStore.restore(id, authUser);
    return this.appConfigStore.getById(id, authUser);
  }
}
