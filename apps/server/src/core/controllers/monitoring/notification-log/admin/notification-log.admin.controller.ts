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
import { NotificationLogStore } from "../../../../stores/monitoring/notification-log/notification-log.store";
import { Roles } from "../../../../../common/decorators/roles.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ZodValidationPipe } from "../../../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";

@Controller("v1/admin/notification-log")
@Roles(Role.ADMIN)
export class NotificationLogAdminController {
  constructor(private readonly notificationLogStore: NotificationLogStore) { }

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
  ) {
    return this.notificationLogStore.search(dto);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const item = await this.notificationLogStore.getById(id);
    if (!item) throw new NotFoundException(`Notification log ${id} not found`);
    return item;
  }
}
