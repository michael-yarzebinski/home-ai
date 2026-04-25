import { Inject, Injectable } from "@nestjs/common";
import { Knex } from "knex";
import {
  SearchCriteria,
  SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import { Paginated } from "@home-ai/shared/search/pagination";
import { AppConfigService } from "../../services/app-config.service";
import { AbstractEntityStore } from "../abstract/abstract-entity.store";
import { AuditStore } from "../audit/audit.store";
import {
  Conversation,
  ChatMessage,
} from "@home-ai/shared/src/domain/conversation/converstation";

/**
 * Database Record Type
 */
export type ConversationRecord = {
  id: string;
  external_id: string;
  user_id: string;
  messages: string; // JSONB in DB
  last_activity: Date;
  is_active: boolean;
  summary: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class ConversationStore extends AbstractEntityStore<
  Conversation,
  ConversationRecord
> {
  // 2-hour session timeout logic remains consistent
  private readonly conversationSessionTimeoutMs: number;

  constructor(
    @Inject("KNEX_CONNECTION") knex: Knex,
    auditStore: AuditStore,
    private appConfigService: AppConfigService,
  ) {
    super(knex, auditStore, {
      tableName: "conversations",
      entityType: "Conversations",
    });

    this.conversationSessionTimeoutMs =
      this.appConfigService.getFromEnv<number>(
        "CONVERSATION_SESSION_TIMEOUT_MS",
      );
  }

  /**
   * Domain -> Record Mapping
   */
  protected domainToRecord(domain: Partial<Conversation>): ConversationRecord {
    return {
      id: domain.id || crypto.randomUUID(),
      external_id: domain.externalId!,
      user_id: domain.userId!,
      messages: JSON.stringify(domain.messages || []),
      last_activity: domain.lastActivity
        ? new Date(domain.lastActivity)
        : new Date(),
      is_active: domain.isActive ?? true,
      summary: domain.summary || null,
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  /**
   * Record -> Domain Mapping
   */
  protected recordToDomain(record: ConversationRecord): Conversation {
    return {
      id: record.id,
      externalId: record.external_id,
      userId: record.user_id,
      messages:
        typeof record.messages === "string"
          ? JSON.parse(record.messages)
          : record.messages,
      lastActivity: record.last_activity,
      isActive: record.is_active,
      summary: record.summary || undefined,
    };
  }

  /**
   * Implementation of abstract search
   */
  async search(
    criteria: SearchCriteria<SearchCriteriaBase>,
  ): Promise<Paginated<Conversation>> {
    return {
      items: [],
      total: 0,
      page: criteria.page,
      pageSize: criteria.pageSize,
      hasNext: false,
      hasPrevious: false,
    };
  }

  /**
   * Business Logic: Cross-device session resumption
   */
  async getOrCreateSession(
    externalId: string,
    userId: string,
  ): Promise<Conversation> {
    const now = new Date();

    // Find latest session for this externalId (e.g. chat.guid)
    const latestConversationRecord = await this.active
      .where({ external_id: externalId })
      .orderBy("last_activity", "desc")
      .first();

    if (latestConversationRecord) {
      const latestConversation = this.recordToDomain(latestConversationRecord);
      const diff = now.getTime() - latestConversation.lastActivity.getTime();

      if (diff < this.conversationSessionTimeoutMs) {
        // Update activity timestamp in DB
        return await this.update(latestConversation.id, { lastActivity: now });
      }
    }

    // Create a new session if none exists or expired
    return this.create({
      externalId,
      userId,
      messages: [],
      lastActivity: now.getTime(),
      isActive: true,
    } as any);
  }

  /**
   * Appends a message and updates the activity timestamp
   */
  async addMessage(sessionId: string, message: ChatMessage) {
    const session = await this.getById(sessionId);
    if (!session) return;

    session.messages.push(message);

    await this.table.where({ id: sessionId }).update({
      messages: JSON.stringify(session.messages),
      last_activity: new Date(),
      updated_at: new Date(),
    } as any);
  }
}
