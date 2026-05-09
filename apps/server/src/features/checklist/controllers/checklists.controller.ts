import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from "@nestjs/common";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import type { AuthUser } from "../../../core/auth/jwt.strategy";
import { ChecklistStore } from "../stores/checklist.store";
import {
  UpdatableChecklistSchema,
  type UpdatableChecklist,
} from "@home-ai/shared/domain/checklist/checklist";
import { ChecklistManagerService } from "../services/checklist-manager.service";

@Controller("v1/checklists")
export class ChecklistsController {
  constructor(
    private readonly checklistStore: ChecklistStore,
    private readonly checklistManagerService: ChecklistManagerService,
  ) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.checklistStore.search({ ...dto, includeInactive: false }, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    return this.checklistManagerService.getChecklistDetail(id, authUser);
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
}
