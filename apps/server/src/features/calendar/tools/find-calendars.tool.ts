import { z } from "zod";
import { ToolHandler } from "../../../tools/abstract/tool-handler";
import { CalendarStore } from "../stores/calendar.store";
import type { ToolContext } from "../../../tools/types/tool-context";
import type { Calendar } from "@home-ai/shared/domain/calendar/calendar";
import { addPermissionFlags } from "src/common/utils/permissions";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";
import { fuzzyFind } from "src/tools/utils/fuzzy-find.utils";

const FindCalendarsToolSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      'Natural-language or partial calendar name (e.g. "family calendar"). ' +
        "Matched against registered name and friendlyName; typos are OK.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(25)
    .optional()
    .describe("Max matches to return (default 10)."),
});

export interface FindCalendarsResult {
  calendars: Array<
    Calendar & {
      canRead: boolean;
      canWrite: boolean;
      score: number;
    }
  >;
  total: number;
  query: string;
}

@Tool()
@Injectable()
export class FindCalendarsTool extends ToolHandler<
  typeof FindCalendarsToolSchema,
  FindCalendarsResult
> {
  readonly name = "find-calendars";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Fuzzy-search calendars registered in Home AI by name and friendlyName. " +
    "Prefer this over list-calendars when resolving a user phrase to a calendar `name`. " +
    "If 0 or many matches, ask for clarification or call list-calendars. " +
    "Never invent calendar names — only use `name` values returned here or from list-calendars.";

  readonly parameters = FindCalendarsToolSchema;

  constructor(private readonly calendarStore: CalendarStore) {
    super();
  }

  async execute(
    params: z.infer<typeof FindCalendarsToolSchema>,
    context: ToolContext,
  ): Promise<FindCalendarsResult> {
    const calendars = await this.calendarStore.getAll(context.authUser);
    const available = addPermissionFlags(calendars, context.authUser.role);
    const matches = fuzzyFind(
      available,
      params.query,
      (c) => [c.name, c.friendlyName],
      { limit: params.limit },
    );

    return {
      calendars: matches,
      total: matches.length,
      query: params.query,
    };
  }
}
