import { z } from "zod";
import { ToolHandler } from "../../../tools/abstract/tool-handler";
import { CalendarStore } from "../stores/calendar.store";
import type { ToolContext } from "../../../tools/types/tool-context";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";

const RegisterCalendarToolSchema = z.object({
  name: z
    .string()
    .min(1)
    .describe('Exact calendar name from Apple Calendar (e.g. "Family")'),
  friendlyName: z
    .string()
    .optional()
    .describe("Friendly display name (optional)"),
  readRoles: z
    .preprocess(ToolParameterUtils.toRoleArray, z.array(z.nativeEnum(Role)))
    .optional()
    .describe('Roles that can read this calendar (supports "all")'),
  writeRoles: z
    .preprocess(ToolParameterUtils.toRoleArray, z.array(z.nativeEnum(Role)))
    .optional()
    .describe('Roles that can write to this calendar (supports "all")'),
  color: z.string().optional().describe("Optional color for the calendar"),
});

export interface RegisterCalendarResult {
  success: boolean;
  message: string;
  calendarName: string;
}

@Tool()
@Injectable()
export class RegisterCalendarTool extends ToolHandler<
  typeof RegisterCalendarToolSchema,
  RegisterCalendarResult
> {
  readonly name = "register-calendar";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Register an Apple Calendar in Home AI so it can be listed and used by tools. " +
    "Admin-only tool. If read/write roles are not provided, they default to the current user's role.";

  readonly parameters = RegisterCalendarToolSchema;

  constructor(private readonly calendarStore: CalendarStore) {
    super();
  }

  async execute(
    params: z.infer<typeof RegisterCalendarToolSchema>,
    context: ToolContext,
  ): Promise<RegisterCalendarResult> {
    const readRoles = params.readRoles?.length
      ? params.readRoles
      : [context.userRole];
    const writeRoles = params.writeRoles?.length
      ? params.writeRoles
      : [context.userRole];

    const calendar = await this.calendarStore.create({
      name: params.name,
      friendlyName: params.friendlyName || params.name,
      readRoles,
      writeRoles,
      color: params.color,
      aliases: [],
    });

    return {
      success: true,
      message: `✅ Calendar "${params.name}" has been registered successfully.`,
      calendarName: calendar.name,
    };
  }
}
