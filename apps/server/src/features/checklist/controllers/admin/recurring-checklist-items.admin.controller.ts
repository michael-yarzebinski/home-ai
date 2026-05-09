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

import { RecurringChecklistItemStore } from "../../stores/recurring-checklist-item.store";
import { AuthUser } from "../../../../core/auth/jwt.strategy";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator";

@Controller("v1/admin/recurring-checklist-items")
@Roles(Role.ADMIN)
export class RecurringChecklistItemsAdminController {
  constructor(
    private readonly recurringChecklistItemStore: RecurringChecklistItemStore,
  ) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.recurringChecklistItemStore.search(dto, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const recurringChecklistItem =
      await this.recurringChecklistItemStore.getById(id, authUser);
    if (!recurringChecklistItem) {
      throw new NotFoundException(`Recurring checklist item ${id} not found`);
    }
    return recurringChecklistItem;
  }

  @Post(":id/restore")
  async restore(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    await this.recurringChecklistItemStore.restore(id, authUser);
    const recurringChecklistItem =
      await this.recurringChecklistItemStore.getById(id, authUser);
    if (!recurringChecklistItem) {
      throw new NotFoundException(`Recurring checklist item ${id} not found`);
    }
    return recurringChecklistItem;
  }
}
