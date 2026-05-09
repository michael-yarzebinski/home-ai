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
import { CalendarStore } from "../../stores/calendar.store";
import { Roles } from "../../../../common/decorators/roles.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";

import { CurrentUser } from "../../../../common/decorators/current-user.decorator";
import { AuthUser } from "../../../../core/auth/jwt.strategy";

@Controller("v1/admin/calendars")
@Roles(Role.ADMIN)
export class CalendarsAdminController {
  constructor(private readonly calendarStore: CalendarStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.calendarStore.search(dto, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const item = await this.calendarStore.getById(id, authUser);
    if (!item) throw new NotFoundException(`Calendar ${id} not found`);
    return item;
  }

  @Post(":id/restore")
  async restore(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    await this.calendarStore.restore(id, authUser);
    return this.calendarStore.getById(id, authUser);
  }
}
