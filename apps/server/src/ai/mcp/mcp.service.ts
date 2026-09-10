import { Injectable, OnModuleInit } from "@nestjs/common";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ToolRegistry } from "src/tools/registry/tool.registry";
import { ClsService } from "nestjs-cls";
import { ToolContext } from "../../tools/types/tool-context";
import { AuthUser } from "../../core/auth/jwt.strategy";
import { LogStore } from "../../core/stores/monitoring/log/log.store";
import { Trace } from "src/common/decorators/trace.decorator";

@Injectable()
export class McpService implements OnModuleInit {
  private mcpServer: McpServer;

  constructor(
    private readonly toolRegistry: ToolRegistry,
    private readonly cls: ClsService,
    private readonly logStore: LogStore,
  ) {
    this.mcpServer = new McpServer({
      name: "Home-AI-Manager",
      version: "1.0.0",
    });
  }

  async onModuleInit() {
    const tools = await this.toolRegistry.getAvailableTools();

    for (const tool of tools) {
      // We "register" your existing NestJS tools with the MCP protocol
      this.mcpServer.registerTool(
        tool.name,
        {
          description: tool.handler.description,
          inputSchema: tool.handler.parameters.shape,
        },
        async (args: any): Promise<any> => this.execute(tool.name, args),
      );
    }
  }

  @Trace()
  async execute(name: string, args: any) {
    // Pull user info from CLS (set by the Orchestrator)
    const authUser = this.cls.get<AuthUser>("authUser");

    // 2. Use the registry's built-in RBAC check
    const registeredTool = await this.toolRegistry.getRegisteredTool(
      name,
      authUser,
    );

    if (!registeredTool) {
      throw new Error(`Unauthorized or unknown tool: ${name}`);
    }
    const context = this.getToolContext();

    const result = await registeredTool.handler.execute(args, context);

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }

  private getToolContext(): ToolContext {
    return {
      authUser: this.cls.get<AuthUser>("authUser"),
      userName: this.cls.get("userName"),
      chatSessionId: this.cls.get("chatSessionId"),
      currentISO: this.cls.get("currentISO"),
      // This connects the specific tool to the broader AI context
      llmContext: {
        originalPrompt: this.cls.get("originalPrompt"),
      },
      // Spread preferences so tools (like recipe standardizers) can see them
      preferences: this.cls.get("preferences"),
      timezone: "Americas/Eastern",
    };
  }
}
