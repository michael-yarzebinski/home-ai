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
import { PendingActionStore } from "../../../stores/pending-action/pending-action.store";
import { Roles } from "../../../../common/decorators/roles.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import {
  InsertablePendingActionSchema,
  UpdatablePendingActionSchema,
  type InsertablePendingAction,
  type UpdatablePendingAction,
} from "@home-ai/shared/domain/pending-action/pending-action";

@Controller("v1/admin/pending-actions")
@Roles(Role.ADMIN)
export class PendingActionsAdminController {
  constructor(private readonly pendingActionStore: PendingActionStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
  ) {
    return this.pendingActionStore.search(dto);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const item = await this.pendingActionStore.getById(id, true);
    if (!item) throw new NotFoundException(`PendingAction ${id} not found`);
    return item;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(InsertablePendingActionSchema))
    dto: InsertablePendingAction,
  ) {
    return this.pendingActionStore.create(dto);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatablePendingActionSchema))
    dto: UpdatablePendingAction,
  ) {
    return this.pendingActionStore.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param("id") id: string) {
    return this.pendingActionStore.softDelete(id);
  }

  @Post(":id/restore")
  async restore(@Param("id") id: string) {
    await this.pendingActionStore.restore(id);
    return this.pendingActionStore.getById(id, true);
  }
}
