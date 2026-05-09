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
import { NotificationQueueStore } from "../../../stores/notification-queue/notification-queue.store";
import { Roles } from "../../../../common/decorators/roles.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import {
  InsertableNotificationQueueSchema,
  UpdatableNotificationQueueSchema,
  type InsertableNotificationQueue,
  type UpdatableNotificationQueue,
} from "@home-ai/shared/domain/notification-queue/notification-queue";
import { AuthUser } from "../../../auth/jwt.strategy";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator";

@Controller("v1/admin/notification-queue")
@Roles(Role.ADMIN)
export class NotificationQueueAdminController {
  constructor(
    private readonly notificationQueueStore: NotificationQueueStore,
  ) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.notificationQueueStore.search(dto, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const item = await this.notificationQueueStore.getById(id, authUser, true);
    if (!item) throw new NotFoundException(`NotificationQueue ${id} not found`);
    return item;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(InsertableNotificationQueueSchema))
    dto: InsertableNotificationQueue,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.notificationQueueStore.create(dto, authUser);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatableNotificationQueueSchema))
    dto: UpdatableNotificationQueue,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.notificationQueueStore.update(id, dto, authUser);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    return this.notificationQueueStore.softDelete(id, authUser);
  }

  @Post(":id/restore")
  async restore(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    await this.notificationQueueStore.restore(id, authUser);
    return this.notificationQueueStore.getById(id, authUser, true);
  }
}
