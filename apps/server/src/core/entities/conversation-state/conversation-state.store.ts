import { Injectable, Inject } from "@nestjs/common";
import { Knex } from "knex";
import { AbstractEntityStore } from "../abstract-entity.store";
import { AuditService } from "../monitoring/audit/audit.service";
import { KNEX_CONNECTION } from "../../database/knex.constants";
import { ConversationState } from "./conversation-state.domain";

export interface ConversationStateRecord {
    id: string;
    chat_guid: string;
    user_id: string;
    current_task_name?: string | null;
    pending_parameters: Record<string, any>;
    clarification_question?: string | null;
    last_ai_message?: string | null;
    related_task_request_id?: string | null;
    conversation_summary?: string | null;
    status: string;
    last_activity_at: Date;
    created_at: Date;
    updated_at: Date;
  }

  @Injectable()
  export class ConversationStateStore extends AbstractEntityStore<
    ConversationStateRecord,
    ConversationState
  > {
    constructor(
      @Inject(KNEX_CONNECTION) knex: Knex,
      auditService: AuditService,
    ) {
      super(knex, auditService, {
        tableName: 'conversation_states',
        auditEntityType: 'ConversationState',
        hasUpdatedAt: true,
        hasActiveFlag: false,           // conversation states don't use active flag
      });
    }
  
    protected domainToRecord(domain: Partial<ConversationState>): Partial<ConversationStateRecord> {
      return {
        id: domain.id,
        chat_guid: domain.chatGuid,
        user_id: domain.userId,
        current_task_name: domain.currentTaskName,
        pending_parameters: domain.pendingParameters ?? {},
        clarification_question: domain.clarificationQuestion,
        last_ai_message: domain.lastAIMessage,
        related_task_request_id: domain.relatedTaskRequestId,
        conversation_summary: domain.conversationSummary,
        status: domain.status ?? 'active',
        last_activity_at: domain.lastActivityAt,
      };
    }
  
    protected recordToDomain(record: ConversationStateRecord): ConversationState {
      return {
        id: record.id,
        chatGuid: record.chat_guid,
        userId: record.user_id,
        currentTaskName: record.current_task_name ?? undefined,
        pendingParameters: record.pending_parameters ?? {},
        clarificationQuestion: record.clarification_question ?? undefined,
        lastAIMessage: record.last_ai_message ?? undefined,
        relatedTaskRequestId: record.related_task_request_id ?? undefined,
        conversationSummary: record.conversation_summary ?? undefined,
        status: record.status,
        lastActivityAt: record.last_activity_at,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      };
    }
  
    async findByChatGuid(chatGuid: string): Promise<ConversationState | null> {
      const record = await this.knex<ConversationStateRecord>('conversation_states')
        .where({ chat_guid: chatGuid })
        .first();
  
      return record ? this.recordToDomain(record) : null;
    }
  
    async findActiveByChatGuid(chatGuid: string): Promise<ConversationState | null> {
      const record = await this.knex<ConversationStateRecord>('conversation_states')
        .where({ chat_guid: chatGuid, status: 'active' })
        .first();
  
      return record ? this.recordToDomain(record) : null;
    }
    /**
     * Find or create a conversation state for a given chat
     */
    async findOrCreateByChatGuid(chatGuid: string, userId: string): Promise<ConversationState> {
      let state = await this.findByChatGuid(chatGuid);
  
      if (!state) {
        state = await this.create({
          chatGuid,
          userId,
          pendingParameters: {},
          status: 'active',
          lastActivityAt: new Date(),
        });
      } else {
        // Update last activity timestamp
        await this.touchLastActivity(chatGuid);
      }
  
      return state;
    }
  
    /**
     * Update last activity timestamp
     */
    async touchLastActivity(chatGuid: string): Promise<void> {
      await this.knex('conversation_states')
        .where({ chat_guid: chatGuid })
        .update({ last_activity_at: this.knex.fn.now() });
    }
  
    /**
     * Update state after AI decision / clarification
     */
    async updateFromAIOutput(chatGuid: string, updateData: Partial<ConversationState>): Promise<void> {
      // Use the abstract update by finding the record first
      const state = await this.findByChatGuid(chatGuid);
      if (state) {
        await this.update(state.id, updateData);
      }
    }
  
    /**
     * Link conversation to a completed task request
     */
    async linkToTaskRequest(chatGuid: string, taskRequestId: string): Promise<void> {
      const state = await this.findByChatGuid(chatGuid);
      if (state) {
        await this.update(state.id, {
          relatedTaskRequestId: taskRequestId,
          status: 'completed',
        });
      }
    }
  
    /**
     * Mark conversation as completed
     */
    async markAsCompleted(chatGuid: string): Promise<void> {
      const state = await this.findByChatGuid(chatGuid);
      if (state) {
        await this.update(state.id, { status: 'completed' });
      }
    }
  }