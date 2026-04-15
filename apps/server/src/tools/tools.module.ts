import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { AddCalendarEventTool } from './task-tools/add-calendar-event.tool';
import { AddToGroceryListTool } from './task-tools/add-to-grocery-list.tool';
import { AddToLongTermListTool } from './task-tools/add-to-long-term-list.tool';
import { AddToShortTermListTool } from './task-tools/add-to-short-term-list.tool';
import { DailySummaryTool } from './task-tools/daily-summary.tool';
import { QueryDeviceTool } from './task-tools/query-device.tool';
import { AddDeviceTool } from './task-tools/add-device.tool';
import { ReadCalendarTool } from './task-tools/read-calendar.tool';
import { RetrieveFactTool } from './task-tools/retrieve-fact.tool';
import { StoreFactTool } from './task-tools/store-fact.tool';
import { WeeklyRecapTool } from './task-tools/weekly-recap.tool';
import { AIModule } from 'src/ai/ai.module';
import { RemoteModule } from 'src/remote/remote.module';

@Module({
  imports: [
    CoreModule,
    AIModule,
    RemoteModule,
  ],
  providers: [
    AddCalendarEventTool,
    AddDeviceTool,
    AddToGroceryListTool,
    AddToLongTermListTool,
    AddToShortTermListTool,
    DailySummaryTool,
    QueryDeviceTool,
    ReadCalendarTool,
    RetrieveFactTool,
    StoreFactTool,
    WeeklyRecapTool,
  ],
  exports: [
  ],
})
export class ToolsModule {}