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
import { CalendarStore } from "../stores/calendar.store";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import {
  UpdatableCalendarSchema,
  type UpdatableCalendar,
} from "@home-ai/shared/domain/calendar/calendar";
import type { AuthUser } from "../../../core/auth/jwt.strategy";

@Controller("v1/calendars")
export class CalendarsController {
  constructor(private readonly calendarStore: CalendarStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() user: AuthUser,
  ) {
    return this.calendarStore.search({ ...dto, includeInactive: false }, user);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const item = await this.calendarStore.getById(id, false, user);
    if (!item) throw new NotFoundException(`Calendar ${id} not found`);
    return item;
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatableCalendarSchema))
    dto: UpdatableCalendar,
    @CurrentUser() user: AuthUser,
  ) {
    return this.calendarStore.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.calendarStore.softDelete(id, user);
  }
}
