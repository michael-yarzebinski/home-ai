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
} from "@nestjs/common";
import { PendingActionStore } from "../../../stores/pending-action/pending-action.store";
import { Roles } from "../../../../common/decorators/roles.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import { AuthUser } from "../../../auth/jwt.strategy";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator";

@Controller("v1/admin/pending-actions")
@Roles(Role.ADMIN)
export class PendingActionsAdminController {
  constructor(private readonly pendingActionStore: PendingActionStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.pendingActionStore.search(dto, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const item = await this.pendingActionStore.getById(id, authUser, true);
    if (!item) throw new NotFoundException(`PendingAction ${id} not found`);
    return item;
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    return this.pendingActionStore.softDelete(id, authUser);
  }

  @Post(":id/restore")
  async restore(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    await this.pendingActionStore.restore(id, authUser);
    return this.pendingActionStore.getById(id, authUser, true);
  }
}
