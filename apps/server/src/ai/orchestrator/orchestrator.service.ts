import { User } from "@home-ai/shared/domain/user/user";
import { Injectable } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { LogStore } from "../../core/stores/log/log.store";
import { McpService } from "../mcp/mcp.service";
import { ToolRegistry } from "../../tools/registry/tool.registry";
import { UnifiedMessage } from "../types/llm-query-params";
import { AppConfigService } from "../../core/services/app-config.service";
import { ChatMessage } from "@home-ai/shared/domain/conversation/converstation";
import { ConversationStore } from "../../core/stores/conversation/conversation.store";
import { NotificationService } from "../../core/services/notification.service";
import { LLMModelTypes, LLMProviderService } from "../llm/llm.provider.sevice";

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
    private readonly notificationService: NotificationService,
  ) { }

  async handleEvent(
    user: User,
    input: string,
    externalId: string,
    modelType: LLMModelTypes = LLMModelTypes.SOON,
  ): Promise<any> {
    return this.cls.run(async () => {
      const session = await this.conversationStore.getOrCreateSession(
        externalId,
        user.id,
      );
      const chatSessionId = session.id;

      this.initializeClsContext(user, input, chatSessionId);

      const userMessage: ChatMessage = {
        role: "user",
        content: input,
        timestamp: new Date(),
      };
      await this.conversationStore.addMessage(chatSessionId, userMessage);

      await this.logStore.create({
        userId: user.id,
        severity: "info",
        message: `Processing event for session: ${chatSessionId}`,
        metadata: { input, chatSessionId, externalId },
      });

      const systemPrompt = await this.generateSystemPrompt(user);
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
          await this.toolRegistry.getAvailableToolsForUser(user.role);
        const llmTools = authorizedTools.map((t) => ({
          name: t.name,
          description: t.handler.description,
          inputSchema: t.handler.parameters.shape,
        }));

        const response = await this.llmProviderService.query({
          messages,
          tools: llmTools,
          context: { userId: user.id, chatSessionId, originalPrompt: input },
        }, modelType);

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
          role: "assistant",
          content: response.content,
          toolCalls: response.toolCalls,
          metadata: response.metadata,
        });

        if (!response.toolCalls || response.toolCalls.length === 0) {
          const finalContent =
            typeof response.content === "string"
              ? response.content
              : JSON.stringify(response.content);
          await this.conversationStore.addMessage(chatSessionId, {
            role: "assistant",
            content: finalContent,
            timestamp: new Date(),
          });

          await this.logStore.create({
            userId: user.id,
            severity: "info",
            message: `Completed conversation turn for session: ${chatSessionId}`,
            metadata: { loopCount },
          });

          return { sessionId: chatSessionId, response: response.content };
        }

        for (const toolCall of response.toolCalls) {
          const tool = await this.toolRegistry.getRegisteredTool(
            toolCall.name,
            user.role,
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
            const toolResult = await this.escalateToPendingAction(
              user,
              toolCall,
            );

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

            await this.notificationService.notifyUsersByTool(
              `${user.name} executed ${toolCall.name}`,
              toolCall.name,
              user.id,
              {
                isNotifying: true,
                isRequesting: false,
              },
              "low",
            );

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

  private initializeClsContext(
    user: User,
    input: string,
    chatSessionId: string,
  ) {
    this.cls.set("userId", user.id);
    this.cls.set("userRole", user.role);
    this.cls.set("userName", user.name);
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

  private async generateSystemPrompt(user: User): Promise<string> {
    const aiName =
      await this.appConfigService.getFromDb("AI_NAME");
    const date = new Date().toLocaleDateString();

    return `
## Identity
You are ${aiName}. User: ${user.name} (${user.role}). Current Date: ${date}.
Style: Professional, helpful, and extremely concise.

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

## Approval Queue
If an action is queued for approval, inform the user and provide the Request ID immediately.`
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
    await this.conversationStore.addMessage(chatSessionId, {
      role: "assistant",
      content: timeoutError,
      timestamp: new Date(),
    });
    return {
      sessionId: chatSessionId,
      response: timeoutError,
      error: "MAX_STEPS_EXCEEDED",
    };
  }
}
