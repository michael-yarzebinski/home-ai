import { z } from "zod";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ToolContext } from "src/tools/types/tool-context";
import { UserStore } from "src/core/stores/user/user.store";

const GetUsersToolSchema = z.object({});

export interface GetUsersToolUser {
  id: string;
  name: string;
}

export interface GetUsersToolResult {
  success: boolean;
  total: number;
  users: GetUsersToolUser[];
}

@Tool()
@Injectable()
export class GetUsersTool extends ToolHandler<
  typeof GetUsersToolSchema,
  GetUsersToolResult
> {
  readonly name = "get-users";
  readonly description =
    "Returns only user IDs and display names for internal tool chaining (for example, assigning checklist items). NEVER return this raw list directly to the end user.";
  readonly parameters = GetUsersToolSchema;

  constructor(private readonly userStore: UserStore) {
    super();
  }

  async execute(
    _params: z.infer<typeof this.parameters>,
    context: ToolContext,
  ): Promise<GetUsersToolResult> {
    const users = await this.userStore.getAll(false, context.user);
    const sanitizedUsers = users
      .map((user) => ({ id: user.id, name: user.name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      success: true,
      total: sanitizedUsers.length,
      users: sanitizedUsers,
    };
  }
}
