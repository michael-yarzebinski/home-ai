// src/tools/registry/tool.registry.ts
import { Injectable, OnModuleInit } from "@nestjs/common";
import { DiscoveryService } from "@nestjs/core";
import { TOOL_METADATA } from "../decorators/tool.decorator";
import type { ToolHandler } from "../abstract/tool-handler";
import type { RegisteredTool } from "../types/registered-tool";
import { ToolStore } from "../../core/stores/tool/tool.store";
import { Tool } from "@home-ai/shared/domain/tool/tool";
import { Role } from "@home-ai/shared/domain/role/role";
import type { AuthUser } from "../../core/auth/jwt.strategy";

@Injectable()
export class ToolRegistry implements OnModuleInit {
  private readonly handlers = new Map<string, ToolHandler>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly toolStore: ToolStore,
  ) {}

  onModuleInit() {
    // Discover all @Tool() handlers once at startup
    const handlers = this.discoveryService
      .getProviders()
      .filter(
        (provider) =>
          provider.metatype &&
          Reflect.getMetadata(TOOL_METADATA, provider.metatype),
      )
      .map((provider) => provider.instance as ToolHandler);

    for (const handler of handlers) {
      this.handlers.set(handler.name, handler);
    }
  }

  async getAvailableTools(
    requestUser?: AuthUser,
  ): Promise<RegisteredTool[]> {
    const tools = await this.toolStore.getAll(requestUser);
    const result: RegisteredTool[] = [];

    for (const tool of tools) {
      const handler = this.handlers.get(tool.name);
      if (!handler) {
        continue;
      }

      result.push({
        ...tool,
        handler,
      });
    }

    return result;
  }

  /**
   * Returns all tools the given user role is allowed to request.
   * Queries the database every time so changes are reflected instantly.
   */
  async getAvailableToolsForUser(
    requestUser: AuthUser,
  ): Promise<RegisteredTool[]> {
    const dbTools = await this.toolStore.getAll(requestUser, false);
    const result: RegisteredTool[] = [];

    for (const dbTool of dbTools) {
      if (!dbTool.active) continue;

      const handler = this.handlers.get(dbTool.name);
      if (!handler) continue;

      const canRequest = dbTool.requestRoles.includes(requestUser.role);
      const canWrite = dbTool.writeRoles.includes(requestUser.role);

      if (canRequest || canWrite) {
        result.push({
          ...dbTool,
          handler,
          canRequest,
          canWrite,
        });
      }
    }

    return result.filter((t) => t.name !== "propose-action");
  }

  /**
   * Get a single registered tool by name (used by the agent loop).
   */
  async getRegisteredTool(
    name: string,
    requestUser: AuthUser,
  ): Promise<RegisteredTool | undefined> {
    const tool = await this.toolStore.getByName(name, requestUser);
    if (!tool) return undefined;

    const handler = this.handlers.get(name);
    if (!handler) return undefined;

    const registeredTool = this.buildRegisteredTool(
      tool,
      handler,
      requestUser.role,
    );

    if (!registeredTool.canRequest && !registeredTool.canWrite)
      return undefined;

    return registeredTool;
  }

  async getRegisteredToolById(
    id: string,
    requestUser: AuthUser,
  ): Promise<RegisteredTool | undefined> {
    const tool = await this.toolStore.getById(id, requestUser, false);
    if (!tool) return undefined;

    const handler = this.handlers.get(tool.name);
    if (!handler) return undefined;

    const registeredTool = this.buildRegisteredTool(
      tool,
      handler,
      requestUser.role,
    );

    if (!registeredTool.canRequest && !registeredTool.canWrite)
      return undefined;

    return registeredTool;
  }

  private buildRegisteredTool(
    tool: Tool,
    handler: ToolHandler,
    userRole: Role,
  ): RegisteredTool {
    const canRequest = tool.requestRoles.includes(userRole);
    const canWrite = tool.writeRoles.includes(userRole);

    return {
      ...tool,
      handler,
      canRequest,
      canWrite,
    };
  }
}
