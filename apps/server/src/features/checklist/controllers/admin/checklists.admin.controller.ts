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
import { Roles } from "../../../../common/decorators/roles.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import {
  InsertableChecklistSchema,
  type InsertableChecklist,
  UpdatableChecklistSchema,
  type UpdatableChecklist,
} from "@home-ai/shared/domain/checklist/checklist";
import { ChecklistStore } from "../../stores/checklist.store";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator";
import { AuthUser } from "../../../../core/auth/jwt.strategy";

@Controller("v1/admin/checklists")
@Roles(Role.ADMIN)
export class ChecklistsAdminController {
  constructor(private readonly checklistStore: ChecklistStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.checklistStore.search(dto, authUser);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(InsertableChecklistSchema))
    dto: InsertableChecklist,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.checklistStore.create(dto, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const checklist = await this.checklistStore.getById(id, authUser);
    if (!checklist) {
      throw new NotFoundException(`Checklist ${id} not found`);
    }
    return checklist;
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatableChecklistSchema))
    dto: UpdatableChecklist,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.checklistStore.update(id, dto, authUser);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    return this.checklistStore.softDelete(id, authUser);
  }

  @Post(":id/restore")
  async restore(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    await this.checklistStore.restore(id, authUser);
    const checklist = await this.checklistStore.getById(id, authUser);
    if (!checklist) throw new NotFoundException(`Checklist ${id} not found`);
    return checklist;
  }
}
