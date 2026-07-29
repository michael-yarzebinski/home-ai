import { User } from "@home-ai/shared/domain/user/user";
import { Injectable } from "@nestjs/common";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";
import { ClsService } from "nestjs-cls";
import { LogStore } from "../../core/stores/monitoring/log/log.store";
import { McpService } from "../mcp/mcp.service";
import { ToolRegistry } from "../../tools/registry/tool.registry";
import { UnifiedMessage } from "../types/llm-query-params";
import { AppConfigService } from "../../core/services/app-config.service";
import {
  ChatMessage,
  LLMRole,
} from "@home-ai/shared/domain/conversation/conversation";
import { ConversationStore } from "../../core/stores/conversation/conversation.store";
import { LLMModelTypes, LLMProviderService } from "../llm/llm.provider.sevice";
import {
  TOOL_EXECUTION_EVENT_CHANNEL,
  type ToolExecutionEvent,
} from "../../events/contracts/tool-execution.event";
import { ChromaService } from "../memory/chroma.service";

export type OrchestratorHandleEventOptions = {
  /** When true, do not emit tool-execution pub/sub messages (e.g. orchestrator requery). */
  suppressToolEvents: boolean;
};

@Injectable()
export class OrchestratorService {
  constructor(
    private readonly cls: ClsService,
    private readonly mcp: McpService,
    private readonly llmProviderService: LLMProviderService,
    private readonly logStore: LogStore,
    private readonly toolRegistry: ToolRegistry,
    private readonly appConfigService: AppConfigService,
    private readonly conversationStore: ConversationStore,
    private readonly chromaService: ChromaService,
    @InjectRedis() private readonly redis: Redis,
  ) { }

  async handleEvent(
    user: User,
    input: string,
    externalId: string,
    modelType: LLMModelTypes = LLMModelTypes.SOON,
    config: OrchestratorHandleEventOptions = {
      suppressToolEvents: false,
    },
  ): Promise<any> {
    return this.cls.run(async () => {
      const session = await this.conversationStore.getOrCreateSession(
        externalId,
        user,
      );
      const chatSessionId = session.id;

      this.initializeClsContext(user, input, chatSessionId);

      const userMessage: ChatMessage = {
        role: LLMRole.USER,
        content: input,
        timestamp: new Date(),
      };
      await this.conversationStore.addMessage(chatSessionId, userMessage, user);

      await this.logStore.create({
        userId: user.id,
        severity: "info",
        message: `Processing event for session: ${chatSessionId}`,
        metadata: { input, chatSessionId, externalId },
      });

      const systemPrompt = await this.generateSystemPrompt(user, input);
      const messages = this.assembleMessageContext(
        systemPrompt,
        session.messages,
        input,
      );

      let loopCount = 0;
      const MAX_STEPS =
        (await this.appConfigService.getFromDb("LLM_MAX_TURNS")) || 10;

      while (loopCount < MAX_STEPS) {
        const authorizedTools =
          await this.toolRegistry.getAvailableToolsForUser(user);
        const llmTools = authorizedTools.map((t) => ({
          name: t.name,
          description: t.handler.description,
          inputSchema: t.handler.parameters.shape,
        }));

        const response = await this.llmProviderService.query(
          {
            messages,
            tools: llmTools,
            context: { userId: user.id, chatSessionId, originalPrompt: input },
          },
          modelType,
        );

        await this.logStore.create({
          userId: user.id,
          severity: "debug",
          message: `LLM response received (turn ${loopCount + 1})`,
          metadata: {
            hasToolCalls: !!response.toolCalls?.length,
            toolCount: response.toolCalls?.length || 0,
            latency: response.latencyMs,
          },
        });

        messages.push({
          role: LLMRole.ASSISTANT,
          content: response.content,
          toolCalls: response.toolCalls,
          metadata: response.metadata,
        });

        if (!response.toolCalls || response.toolCalls.length === 0) {
          const finalContent =
            typeof response.content === "string"
              ? response.content
              : JSON.stringify(response.content);
          await this.conversationStore.addMessage(
            chatSessionId,
            {
              role: LLMRole.ASSISTANT,
              content: finalContent,
              timestamp: new Date(),
            },
            user,
          );

          await this.logStore.create({
            userId: user.id,
            severity: "info",
            message: `Completed conversation turn for session: ${chatSessionId}`,
            metadata: { loopCount },
          });

          return { sessionId: chatSessionId, response: finalContent };
        }

        for (const toolCall of response.toolCalls) {
          const tool = await this.toolRegistry.getRegisteredTool(
            toolCall.name,
            user,
          );

          if (!tool) {
            await this.logStore.create({
              userId: user.id,
              severity: "warn",
              message: `Tool not found or unauthorized: ${toolCall.name}`,
              metadata: { toolCall, userRole: user.role },
            });

            messages.push({
              role: "tool",
              name: toolCall.name,
              toolCallId: toolCall.id,
              content: `Error: Tool ${toolCall.name} not found.`,
              isError: true,
            });
            continue;
          }

          // PERMISSION CHECKING
          if (!tool.canWrite && !tool.canRequest) {
            await this.logStore.create({
              userId: user.id,
              severity: "warn",
              message: `Access denied for tool: ${toolCall.name}`,
              metadata: { toolCall, userRole: user.role },
            });

            messages.push({
              role: "tool",
              name: toolCall.name,
              toolCallId: toolCall.id,
              content: `Error: Access denied for ${toolCall.name}.`,
              isError: true,
            });
            continue;
          }

          if (!tool.canWrite && tool.canRequest) {
            const validatedArgs = tool.handler.parameters.parse(toolCall.args);
            const toolResult = await this.escalateToPendingAction(
              user,
              toolCall,
            );

            if (!config.suppressToolEvents) {
              try {
                const readableId = JSON.parse(toolResult).readableId;
                await this.publishToolExecutionEvent({
                  eventType: "tool-executed",
                  userId: user.id,
                  toolName: toolCall.name,
                  argsSummary: validatedArgs,
                  resultSummary: toolResult,
                  approval: {
                    pendingActionReadableId: readableId,
                    action: "requested",
                  },
                });
              } catch (err: any) {
                await this.logStore.create({
                  userId: user.id,
                  severity: "warn",
                  message: `Failed to emit approval-requested tool event: ${err?.message ?? err}`,
                  metadata: { toolCall, userRole: user.role },
                });
              }
            }

            messages.push({
              role: "tool",
              name: toolCall.name,
              toolCallId: toolCall.id,
              content: toolResult,
            });
            continue;
          }

          // Normal execution
          try {
            await this.logStore.create({
              userId: user.id,
              severity: "info",
              message: `Executing tool: ${toolCall.name}`,
              metadata: { args: toolCall.args },
            });

            const validatedArgs = tool.handler.parameters.parse(toolCall.args);
            const toolResult = await this.mcp.execute(
              toolCall.name,
              validatedArgs,
            );
            const contentString =
              toolResult?.content?.[0]?.text || JSON.stringify(toolResult);

            if (!config.suppressToolEvents) {
              await this.publishToolExecutionEvent({
                eventType: "tool-executed",
                userId: user.id,
                toolName: toolCall.name,
                argsSummary: validatedArgs,
                resultSummary: toolResult,
              });
            }

            messages.push({
              role: "tool",
              name: toolCall.name,
              toolCallId: toolCall.id,
              content: contentString,
            });
          } catch (error: any) {
            await this.logStore.create({
              userId: user.id,
              severity: "error",
              message: `Tool execution failed: ${toolCall.name}`,
              metadata: { error: error.message, toolCall },
            });

            messages.push({
              role: "tool",
              name: toolCall.name,
              toolCallId: toolCall.id,
              content: JSON.stringify({ errorMessage: error.message }),
              isError: true,
            });
          }
        }
        loopCount++;
      }

      return this.handleTimeout(user, chatSessionId, loopCount);
    });
  }

  /**
   * Queues a deferred tool via propose-action MCP. Returns assistant-facing text and raw MCP payload for auditing / pub-sub.
   */
  private async escalateToPendingAction(
    user: User,
    toolCall: any,
  ): Promise<string> {
    try {
      await this.logStore.create({
        userId: user.id,
        severity: "info",
        message: `Escalating requested tool call to PendingAction: ${toolCall.name}`,
        metadata: { originalTool: toolCall.name, userId: user.id },
      });

      // Aligning with ProposeActionToolSchema: toolName, description, proposedArgs, reason
      const result = await this.mcp.execute("propose-action", {
        toolName: toolCall.name,
        description: `Execute ${toolCall.name} with requested parameters`,
        proposedArgs: toolCall.args || {},
        reason: `User ${user.name} (${user.role}) is not authorized to execute this directly.`,
      });

      // Return the stringified result so the LLM can explain it to the user
      return result?.content?.[0]?.text || JSON.stringify(result);
    } catch (error: any) {
      return `Failed to queue action for approval: ${error.message}`;
    }
  }

  /**
   * Publishes a tool-execution event to Redis pub/sub. Failures are swallowed so orchestration continues.
   */
  private async publishToolExecutionEvent(
    event: ToolExecutionEvent,
  ): Promise<void> {
    try {
      await this.redis.publish(
        TOOL_EXECUTION_EVENT_CHANNEL,
        JSON.stringify(event),
      );
    } catch (err: any) {
      await this.logStore.create({
        userId: event.userId,
        severity: "warn",
        message: `Tool execution pub/sub publish failed: ${err?.message ?? err}`,
        metadata: { event },
      });
    }
  }

  private initializeClsContext(
    user: User,
    input: string,
    chatSessionId: string,
  ) {
    this.cls.set("userName", user.name);
    this.cls.set("authUser", { id: user.id, role: user.role });
    this.cls.set("originalPrompt", input);
    this.cls.set("chatSessionId", chatSessionId);
    this.cls.set("currentISO", new Date().toISOString());
    this.cls.set("timezone", user.timezone || "UTC");
  }

  private assembleMessageContext(
    systemPrompt: string,
    history: ChatMessage[],
    currentInput: string,
  ): UnifiedMessage[] {
    const formattedHistory: UnifiedMessage[] = history.map((m) => ({
      role: m.role as any,
      content: m.content,
      ...(m.toolCallId ? { toolCallId: m.toolCallId } : {}),
    }));
    return [
      { role: "system", content: systemPrompt },
      ...formattedHistory,
      { role: "user", content: currentInput },
    ];
  }

  private async generateSystemPrompt(user: User, input: string): Promise<string> {
    const aiName = await this.appConfigService.getFromDb("AI_NAME");
    const date = new Date().toLocaleDateString();

    const memory = await this.getMemoryForUser(user, input);

    return `
## Identity
You are ${aiName}. User: ${user.name} (${user.role}). Current Date: ${date}.
Style: Professional, helpful, and extremely concise.

## Long-Term Profile & Behavioral Context
The following historical behaviors, user traits, and automated household observations have been extracted over time. Use these to tailor your tone, defaults, and physical home environment choices without explicitly stating why:
${memory}

## Operational Protocol: Discovery First
You must follow a "Read-Before-Write" workflow for all data domains (Devices, Facts, Calendar, Notes).
1. **Verification:** Before adding or registering any new item, you MUST call the relevant "get" or "discover" tool to check for existing entries.
2. **Analysis:** Review the results for naming collisions or similar entries.

## Conflict Resolution: Add vs. Update
If a user asks to "add" or "save" information (like a Fact or Device) that already exists in the system:
- **Do not create a duplicate.**
- **Do not modify the name/slug** just to force an insertion.
- **Action:** Inform the user that a similar entry exists and suggest UPDATING the existing record instead.
- **Example:** "A fact about 'Dog Diet' already exists. Would you like me to update it with this new information?"

## Return Rules
- Unless the user asks for a specific result, return all of the relevant results.

## Approval Queue
If an action is queued for approval, inform the user and provide the Request ID immediately.`;
  }

  private async handleTimeout(
    user: User,
    chatSessionId: string,
    loopCount: number,
  ) {
    const timeoutError =
      "I've tried too many steps and had to stop. Could you try being more specific?";
    await this.logStore.create({
      userId: user.id,
      severity: "error",
      message: "Orchestration loop timeout - MAX_STEPS reached",
      metadata: { chatSessionId, loopCount },
    });
    await this.conversationStore.addMessage(
      chatSessionId,
      {
        role: LLMRole.ASSISTANT,
        content: timeoutError,
        timestamp: new Date(),
      },
      user,
    );
    return {
      sessionId: chatSessionId,
      response: timeoutError,
      error: "MAX_STEPS_EXCEEDED",
    };
  }

  private async getMemoryForUser(user: User, input: string): Promise<string> {
    try {
      const memory = await this.chromaService.getForUser(user.id, input);
      return memory.map((m) => m.document).join("\n");
    } catch (error: any) {
      await this.logStore.create({
        userId: user.id,
        severity: "warn",
        message: `Failed fetching long term memory context for system prompt assembly`,
        metadata: { error: error?.message ?? error },
      });

      return ''
    }
  }
}
