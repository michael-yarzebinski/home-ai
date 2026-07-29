import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChromaService } from './chroma.service';
import { AppConfigService } from '../../core/services/app-config.service';
import { LogStore } from '../../core/stores/monitoring/log/log.store';
import { LLMProviderService, LLMModelTypes } from '../llm/llm.provider.sevice';
import { LLMQueryParams } from '../types/llm-query-params';
import { v4 as uuidv4, v4 } from 'uuid';
import { z } from 'zod';
import { ConversationStore } from '../../core/stores/conversation/conversation.store';
import { ChatMessage, Conversation } from '@home-ai/shared/domain/conversation/conversation';

const AbstractionResponseSchema = z.object({
    newAbstractions: z.array(
        z.object({
            text: z.string().min(1),
            category: z.enum(['fact', 'observation']),
            targetEntityId: z.string().nullable().optional(),
        })
    ),
});

@Injectable()
export class MemoryService {
    private readonly automationUserId: string;
    private readonly conversationDays = 7;

    constructor(
        private readonly chromaService: ChromaService,
        private readonly llmProviderService: LLMProviderService,
        private readonly conversationStore: ConversationStore,
        private readonly appConfigService: AppConfigService,
        private readonly logStore: LogStore,
    ) {
        this.automationUserId = this.appConfigService.getFromEnv<string>("AUTOMATION_USER_ID");
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleMemoryConsolidation() {
        await this.logStore.create({
            severity: "info",
            message: "Starting daily rolling 7-day memory compaction cycle",
            metadata: {}
        });

        try {
            // 1. Target conversations modified within the last rolling 7-day window
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - this.conversationDays);

            const activeConversations = await this.conversationStore.findInTimeFrame(targetDate);
            if (activeConversations.length === 0) {
                return;
            }

            // 2. Group conversations by target user, skipping background system automation noise
            const userBatches = this.groupByUser(activeConversations);

            for (const [userId, conversations] of Object.entries(userBatches)) {
                await this.analyzeUserWindow(userId, conversations);
            }

        } catch (error) {
            await this.logStore.create({
                severity: "error",
                message: "Failed executing daily rolling window memory compaction",
                metadata: { error: error instanceof Error ? error.message : error },
            });
        }
    }

    private async analyzeUserWindow(userId: string, conversations: Conversation[]) {
        try {
            // 3. Fetch current database facts to pass as baseline knowledge
            const rawExisting = await this.chromaService.getForUser(userId);

            const existingProfileText = rawExisting.length > 0
                ? rawExisting.map(m => `- [${m.metadata.category.toUpperCase()}] ${m.document}`).join('\n')
                : 'None (User profile is currently blank)';

            // 4. Compact messages into a lean chronological transcript block
            const structuredTranscripts = conversations
                .map((c, idx) => `--- Conversation #${idx + 1} (ID: ${c.id}) ---\n${this.formatTranscript(c.messages)}`)
                .join('\n\n');

            const systemPrompt = `You are the long-term cognitive abstraction service for a family home automation hub. 
Your task is to review a rolling window of recent conversations for a specific user, compare them against their current known profile, and extract new insights.

CRITICAL RULES FOR ROLLING WINDOWS:
- **Idempotency (No Duplicates):** Because this window slides, you will see conversations evaluated in previous runs. If a fact or observation is already accurately captured in the "CURRENT KNOWN PROFILE", you MUST ignore it. Do not output it again.
- **Trend Detection:** Look for multi-day patterns, emerging habits, or explicit household changes. Ignore transient requests (like single calendar additions, one-off questions, or immediate device commands).
- **Refinement:** Only output an abstraction if it provides genuine new utility or updates a shifting preference.

Return EXCLUSIVELY a JSON object matching this structure:
{
  "newAbstractions": [
    {
      "text": "Clear, third-person statement of the NEW fact or behavioral pattern.",
      "category": "fact" | "observation",
      "targetEntityId": "Home Assistant entity/room ID if applicable, otherwise null"
    }
  ]
}
If there are no new insights to add beyond what is already known, return: { "newAbstractions": [] }`;

            const userContextPayload = `TARGET USER ID: ${userId}\n\nCURRENT KNOWN PROFILE (ALREADY RECORDED):\n${existingProfileText}\n\nROLLING 7-DAY CONVERSATION HISTORY:\n${structuredTranscripts}`;

            // 5. Query the LLM using the Automation User ID for internal attribution
            const queryParams: LLMQueryParams = {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userContextPayload }
                ],
                jsonMode: true,
                context: {
                    userId: this.automationUserId,
                    originalPrompt: `Automated rolling daily memory extraction task for target user: ${userId}`,
                    chatSessionId: v4(),
                }
            };

            const llmResponse = await this.llmProviderService.query(queryParams, LLMModelTypes.SOON);

            // 6. Safely parse and validate response structure using Zod
            const parsedContent = typeof llmResponse.content === 'string'
                ? JSON.parse(llmResponse.content)
                : llmResponse.content;

            const validationResult = AbstractionResponseSchema.safeParse(parsedContent);

            if (!validationResult.success) {
                await this.logStore.create({
                    severity: "error",
                    message: `LLM response failed schema validation for target user ${userId}`,
                    metadata: { validationErrors: validationResult.error.format(), rawContent: llmResponse.content },
                });
                return;
            }

            const { newAbstractions } = validationResult.data;

            // 7. Direct write to ChromaDB — allowing Chroma to compute the embedding vector internally
            for (const abstraction of newAbstractions) {
                const memoryId = `mem_${uuidv4()}`;

                await this.chromaService.addRecord({
                    id: memoryId,
                    text: abstraction.text,
                    metadata: {
                        category: abstraction.category,
                        userId, // Correlate long term facts back to the actual human target user
                        targetEntityId: abstraction.targetEntityId || undefined,
                    }
                });

                await this.logStore.create({
                    severity: "info",
                    message: `Captured new long-term ${abstraction.category} for user ${userId}`,
                    metadata: { text: abstraction.text },
                });
            }

        } catch (error) {
            await this.logStore.create({
                severity: "error",
                message: `Error evaluating rolling memory window for user ${userId}`,
                metadata: { error: error instanceof Error ? error.message : error },
            });
        }
    }

    private groupByUser(conversations: Conversation[]): Record<string, Conversation[]> {
        return conversations.reduce((acc, conv) => {
            // Discard conversations generated by your internal system automated tasks
            if (conv.userId === this.automationUserId) {
                return acc;
            }

            if (!acc[conv.userId]) {
                acc[conv.userId] = [];
            }
            acc[conv.userId].push(conv);
            return acc;
        }, {} as Record<string, Conversation[]>);
    }

    private formatTranscript(messages: ChatMessage[]): string {
        return messages
            .filter(msg => msg.role === 'user' || msg.role === 'assistant')
            .map(msg => `[${msg.role.toUpperCase()}]: ${msg.content}`)
            .join('\n');
    }
}