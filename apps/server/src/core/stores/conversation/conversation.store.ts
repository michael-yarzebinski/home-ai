import { Inject, Injectable } from "@nestjs/common";
import { Knex } from "knex";
import { AppConfigService } from "../../services/app-config.service";
import { AbstractEntityStore } from "../abstract/abstract-entity.store";
import { AuditStore } from "../monitoring/audit/audit.store";
import {
  Conversation,
  ChatMessage,
} from "@home-ai/shared/domain/conversation/conversation";
import { AuthUser } from "../../auth/jwt.strategy";

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
   *
   * Returning `undefined` for a field causes AbstractEntityStore.update's patch
   * step to strip it, so partial updates (e.g. touching only lastActivity) do
   * NOT overwrite unrelated columns like messages.
   */
  protected domainToRecord(domain: Partial<Conversation>): ConversationRecord {
    return {
      id: domain.id || crypto.randomUUID(),
      external_id: domain.externalId as string,
      user_id: domain.userId as string,
      // Only serialise when explicitly provided — undefined means "don't touch this column"
      messages:
        domain.messages !== undefined
          ? JSON.stringify(domain.messages)
          : (undefined as unknown as string),
      last_activity: domain.lastActivity
        ? new Date(domain.lastActivity)
        : new Date(),
      is_active: domain.isActive ?? true,
      summary:
        domain.summary !== undefined
          ? (domain.summary ?? null)
          : (undefined as unknown as null),
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

  protected validateUserForRead(
    query: Knex.QueryBuilder,
    user: AuthUser,
  ): Knex.QueryBuilder {
    return query.where("user_id", user.id);
  }

  protected validateUserForWrite(
    query: Knex.QueryBuilder,
    user: AuthUser,
  ): Knex.QueryBuilder {
    return query.where("user_id", user.id);
  }

  protected applyTextSearch(
    query: Knex.QueryBuilder,
    search: string,
  ): Knex.QueryBuilder {
    const like = `%${search.toLowerCase()}%`;
    return query.where((b) =>
      b.whereILike("external_id", like).orWhereILike("summary", like),
    );
  }

  /** Show most recently active conversations first. */
  protected override get defaultOrder() {
    return { column: "last_activity", direction: "desc" as const };
  }

  /**
   * Business Logic: Cross-device session resumption
   */
  async getOrCreateSession(
    externalId: string,
    user: AuthUser,
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
        // Touch only the activity timestamp — do NOT go through AbstractEntityStore.update
        // which would run domainToRecord on a partial object and wipe the messages column.
        await this.table
          .where({ id: latestConversation.id })
          .update({ last_activity: now, updated_at: now } as any);
        return { ...latestConversation, lastActivity: now };
      }
    }

    // Create a new session if none exists or expired
    return this.create(
      {
        externalId,
        userId: user.id,
        messages: [],
        lastActivity: now.getTime(),
        isActive: true,
      } as any,
      user,
    );
  }

  /**
   * Appends a message and updates the activity timestamp
   */
  async addMessage(sessionId: string, message: ChatMessage, user: AuthUser) {
    const session = await this.getById(sessionId, user);
    if (!session) return;

    session.messages.push(message);

    await this.table.where({ id: sessionId }).update({
      messages: JSON.stringify(session.messages),
      last_activity: new Date(),
      updated_at: new Date(),
    } as any);
  }
}
