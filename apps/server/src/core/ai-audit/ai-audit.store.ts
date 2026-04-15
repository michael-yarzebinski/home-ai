// apps/server/src/core/audit/ai-audit.store.ts
import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { AIAuditDomain } from './ai-audit.domain';
import { v4 } from 'uuid';

export interface AIAuditRecord {
    id: string;
    timestamp: Date;
    event_type: string;
    user_id?: string;
    task_request_id?: string;
    task_name?: string;
    model_input?: string;
    model_output?: string;
    latency_ms?: number;
    metadata?: any;
    notes?: string;
}


@Injectable()
export class AIAuditStore {
    private readonly logger = new Logger(AIAuditStore.name);

    constructor(
        @Inject('KNEX_CONNECTION') private readonly knex: Knex,
    ) { }

    protected domainToRecord(domain: Partial<AIAuditDomain>): Partial<AIAuditRecord> {
        return {
            event_type: domain.eventType,
            user_id: domain.userId,
            task_request_id: domain.taskRequestId,
            task_name: domain.taskName,
            model_input: domain.modelInput,
            model_output: domain.modelOutput,
            latency_ms: domain.latencyMs,
            metadata: domain.metadata,
            notes: domain.notes,
        };
    }

    protected recordToDomain(record: AIAuditRecord): AIAuditDomain {
        return {
            id: record.id,
            timestamp: record.timestamp,
            eventType: record.event_type,
            userId: record.user_id,
            taskRequestId: record.task_request_id,
            taskName: record.task_name,
            modelInput: record.model_input,
            modelOutput: record.model_output,
            latencyMs: record.latency_ms,
            metadata: record.metadata,
            notes: record.notes,
        };
    }

    async log(entry: Partial<AIAuditDomain>): Promise<void> {
        try {
            const record = this.domainToRecord(entry);

            await this.knex('ai_audit').insert(record);
        } catch (error) {
            this.logger.error('Failed to log AI audit', error);
        }
    }

    async findForUser(userId: string, limit = 50): Promise<AIAuditDomain[]> {
        const records = await this.knex<AIAuditRecord>('ai_audit')
            .where('user_id', userId)
            .orderBy('timestamp', 'desc')
            .limit(limit);
        return records.map(r => this.recordToDomain(r));
    }

    async findAll(limit = 100): Promise<AIAuditDomain[]> {
        const records = await this.knex<AIAuditRecord>('ai_audit')
            .orderBy('timestamp', 'desc')
            .limit(limit);
        return records.map(r => this.recordToDomain(r));
    }
}