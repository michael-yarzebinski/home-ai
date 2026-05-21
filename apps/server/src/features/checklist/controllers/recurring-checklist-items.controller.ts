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
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import type { AuthUser } from "../../../core/auth/jwt.strategy";
import type { RecurringChecklistItem } from "@home-ai/shared/domain/checklist/recurring-checklist-item";
import {
  InsertableRecurringChecklistItemSchema,
  type InsertableRecurringChecklistItem,
  UpdatableRecurringChecklistItemSchema,
  type UpdatableRecurringChecklistItem,
} from "@home-ai/shared/domain/checklist/recurring-checklist-item";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import { ChecklistStore } from "../stores/checklist.store";
import { RecurringChecklistItemStore } from "../stores/recurring-checklist-item.store";

@Controller("v1/recurring-checklist-items")
export class RecurringChecklistItemsController {
  constructor(
    private readonly checklistStore: ChecklistStore,
    private readonly recurringChecklistItemStore: RecurringChecklistItemStore,
  ) {}

  private async getRecurringChecklistItemWrapper(
    recurringItemId: string,
    authUser: AuthUser,
  ): Promise<RecurringChecklistItem> {
    const recurring = await this.recurringChecklistItemStore.getById(
      recurringItemId,
      authUser,
    );
    if (!recurring) {
      throw new NotFoundException("Recurring checklist item not found");
    }
    return recurring;
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
      checklistId,
      authUser,
    );
    if (!checklist) {
      throw new NotFoundException("Checklist not found");
    }
  }

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.recurringChecklistItemStore.search(
      { ...dto, includeInactive: false },
      authUser,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(InsertableRecurringChecklistItemSchema))
    dto: InsertableRecurringChecklistItem,
    @CurrentUser() authUser: AuthUser,
  ) {
    await this.ensureChecklistWritableForUser(dto.checklistId, authUser);
    return this.recurringChecklistItemStore.create(dto, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const recurringChecklistItem = await this.getRecurringChecklistItemWrapper(
      id,
      authUser,
    );
    await this.ensureChecklistReadableForUser(
      recurringChecklistItem.checklistId,
      authUser,
    );
    return recurringChecklistItem;
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatableRecurringChecklistItemSchema))
    dto: UpdatableRecurringChecklistItem,
    @CurrentUser() authUser: AuthUser,
  ) {
    const recurringChecklistItem = await this.getRecurringChecklistItemWrapper(
      id,
      authUser,
    );
    await this.ensureChecklistWritableForUser(
      recurringChecklistItem.checklistId,
      authUser,
    );
    return this.recurringChecklistItemStore.update(id, dto, authUser);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const recurringChecklistItem = await this.getRecurringChecklistItemWrapper(
      id,
      authUser,
    );
    await this.ensureChecklistWritableForUser(
      recurringChecklistItem.checklistId,
      authUser,
    );
    await this.recurringChecklistItemStore.softDelete(id, authUser);
  }
}
