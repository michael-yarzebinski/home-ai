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
import { Roles } from "../../../../common/decorators/roles.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";

import { ChecklistItemStore } from "../../stores/checklist-item.store";
import { AuthUser } from "../../../../core/auth/jwt.strategy";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator";

@Controller("v1/admin/checklist-items")
@Roles(Role.ADMIN)
export class ChecklistItemsAdminController {
  constructor(private readonly checklistItemStore: ChecklistItemStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  async search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.checklistItemStore.search(dto, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const checklistItem = await this.checklistItemStore.getById(id, authUser);
    if (!checklistItem) {
      throw new NotFoundException(`Checklist item ${id} not found`);
    }
    return checklistItem;
  }

  @Post(":id/restore")
  async restore(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    await this.checklistItemStore.restore(id, authUser);
    const checklistItem = await this.checklistItemStore.getById(id, authUser);
    if (!checklistItem) {
      throw new NotFoundException(`Checklist item ${id} not found`);
    }
    return checklistItem;
  }
}
