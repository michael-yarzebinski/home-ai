import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import type { AuthUser } from "../../../core/auth/jwt.strategy";
import type { ChecklistItem } from "@home-ai/shared/domain/checklist/checklist-item";
import {
  AssignChecklistItemBodySchema,
  type AssignChecklistItemBody,
  InsertableChecklistItemSchema,
  type InsertableChecklistItem,
  UpdatableChecklistItemSchema,
  type UpdatableChecklistItem,
} from "@home-ai/shared/domain/checklist/checklist-item";
import { ChecklistManagerService } from "../services/checklist-manager.service";
import { ChecklistStore } from "../stores/checklist.store";
import { ChecklistItemStore } from "../stores/checklist-item.store";

@Controller("v1/checklist-items")
export class ChecklistItemsController {
  constructor(
    private readonly checklistStore: ChecklistStore,
    private readonly checklistItemStore: ChecklistItemStore,
    private readonly checklistManagerService: ChecklistManagerService,
  ) {}

  private async getChecklistItemWrapper(
    itemId: string,
    authUser: AuthUser,
  ): Promise<ChecklistItem> {
    const item = await this.checklistItemStore.getById(itemId, authUser);
    if (!item) {
      throw new NotFoundException("Checklist item not found");
    }
    return item;
  }

  private async ensureChecklistReadableForUser(
    checklistId: string,
    authUser: AuthUser,
  ): Promise<void> {
    const checklist = await this.checklistStore.getById(checklistId, authUser);
    if (!checklist) {
      throw new NotFoundException("Checklist not found");
    }
  }

  private async ensureChecklistWritableForUser(
    checklistId: string,
    authUser: AuthUser,
  ): Promise<void> {
    const checklist = await this.checklistStore.getByIdForWrite(
      checklistId, authUser,
    );
    if (!checklist) {
      throw new NotFoundException("Checklist not found");
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(InsertableChecklistItemSchema))
    dto: InsertableChecklistItem,
    @CurrentUser() authUser: AuthUser,
  ) {
    await this.ensureChecklistWritableForUser(dto.checklistId, authUser);
    return this.checklistItemStore.create(dto, authUser);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatableChecklistItemSchema))
    dto: UpdatableChecklistItem,
    @CurrentUser() authUser: AuthUser,
  ) {
    const item = await this.getChecklistItemWrapper(id, authUser);
    await this.ensureChecklistWritableForUser(item.checklistId, authUser);
    return this.checklistItemStore.update(id, dto, authUser);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const item = await this.getChecklistItemWrapper(id, authUser);
    await this.ensureChecklistWritableForUser(item.checklistId, authUser);
    await this.checklistItemStore.softDelete(id, authUser);
  }

  @Post(":id/check")
  async check(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const item = await this.getChecklistItemWrapper(id, authUser);
    await this.ensureChecklistReadableForUser(item.checklistId, authUser);
    return this.checklistManagerService.checkItem(item.checklistId, id, authUser);
  }

  @Post(":id/uncheck")
  async uncheck(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const item = await this.getChecklistItemWrapper(id, authUser);
    await this.ensureChecklistReadableForUser(item.checklistId, authUser);
    return this.checklistManagerService.uncheckItem(item.checklistId, id, authUser);
  }

  @Post(":id/assign")
  async assign(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(AssignChecklistItemBodySchema))
    dto: AssignChecklistItemBody,
    @CurrentUser() authUser: AuthUser,
  ) {
    const item = await this.getChecklistItemWrapper(id, authUser);
    // Allow users to assign to themselves without requiring write access to the checklist
    if (dto.assigneeId === authUser.id) {
      await this.ensureChecklistReadableForUser(item.checklistId, authUser);
    } else {
      await this.ensureChecklistWritableForUser(item.checklistId, authUser);
    }

    return this.checklistItemStore.update(
      id,
      { assigneeId: dto.assigneeId }, authUser,
    );
  }

  @Post(":id/unassign")
  async unassign(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const item = await this.getChecklistItemWrapper(id, authUser);
    await this.ensureChecklistWritableForUser(item.checklistId, authUser);
    return this.checklistItemStore.update(id, { assigneeId: undefined }, authUser);
  }
}
