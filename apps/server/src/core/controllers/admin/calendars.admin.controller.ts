import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  NotFoundException, Param, Post, Put,
} from '@nestjs/common';
import { CalendarStore } from '../../stores/calendar/calendar.store';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@home-ai/shared/domain/role/role';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { SearchCriteriaSchema, type SearchCriteriaBase } from '@home-ai/shared/search/search';
import {
  InsertableCalendarSchema, UpdatableCalendarSchema,
  type InsertableCalendar, type UpdatableCalendar,
} from '@home-ai/shared/domain/calendar/calendar';

@Controller('v1/admin/calendars')
@Roles(Role.ADMIN)
export class CalendarsAdminController {
  constructor(private readonly calendarStore: CalendarStore) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  search(@Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase) {
    return this.calendarStore.search(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const item = await this.calendarStore.getById(id, true);
    if (!item) throw new NotFoundException(`Calendar ${id} not found`);
    return item;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ZodValidationPipe(InsertableCalendarSchema)) dto: InsertableCalendar) {
    return this.calendarStore.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdatableCalendarSchema)) dto: UpdatableCalendar) {
    return this.calendarStore.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param('id') id: string) {
    return this.calendarStore.softDelete(id);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    await this.calendarStore.restore(id);
    return this.calendarStore.getById(id, true);
  }
}
