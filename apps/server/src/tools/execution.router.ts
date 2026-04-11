import { Injectable } from '@nestjs/common';
import { AppleNotesTool } from './apple-notes.tool';
import { CalendarTool } from './calendar.tool';
import { FactsTool } from './facts.tool';
import { SummaryTool } from './summary.tool';
import { DeviceTool } from './device.tool';

@Injectable()
export class ExecutionRouter {
  constructor(
    private readonly appleNotesTool: AppleNotesTool,
    private readonly calendarTool: CalendarTool,
    private readonly factsTool: FactsTool,
    private readonly summaryTool: SummaryTool,
    private readonly deviceTool: DeviceTool,
  ) {}

  /**
   * Route the task to the correct handler based on action_type
   */
  async execute(
    taskName: string,
    parameters: any,
    user: any | null
  ): Promise<{
    success: boolean;
    message: string;
    reply?: string;
    data?: any;
    notify?: boolean;
  }> {
    // Get task definition to know action_type and target
    // (In a real implementation, you'd inject a TasksService here)
    // For now, we hardcode the routing based on taskName for simplicity

    if (taskName.startsWith('add_to_grocery_list')) {
      return this.appleNotesTool.addToNote('Grocery List', parameters, user);
    }

    if (taskName.startsWith('add_to_short_term_list')) {
      return this.appleNotesTool.addToNote('Short Term List', parameters, user);
    }

    if (taskName.startsWith('add_to_long_term_list')) {
      return this.appleNotesTool.addToNote('Long Term List', parameters, user);
    }

    if (taskName === 'add_calendar_event') {
      return this.calendarTool.addEvent(parameters, user);
    }

    if (taskName === 'read_calendar') {
      return this.calendarTool.readEvents(parameters, user);
    }

    if (taskName === 'store_fact') {
      return this.factsTool.storeFact(parameters, user);
    }

    if (taskName === 'retrieve_fact') {
      return this.factsTool.retrieveFact(parameters, user);
    }

    if (taskName === 'daily_summary') {
      return this.summaryTool.dailySummary(parameters, user);
    }

    if (taskName === 'weekly_recap') {
      return this.summaryTool.weeklyRecap(parameters, user);
    }

    if (taskName === 'add_device') {
      return this.deviceTool.addDevice(parameters, user.id);
    }

    // Default fallback
    return {
      success: false,
      message: `No handler found for task: ${taskName}`,
      reply: `Sorry, I don't know how to perform "${taskName}" yet.`,
    };
  }
}