import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { Audit } from './audit.domain';
import { v4 } from 'uuid';

export interface AuditRecord {
    id: string;
    timestamp: Date;
    entity_type: string;
    entity_id: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    user_id?: string;
    changes?: any;                    // jsonb → any is fine for Knex
    metadata?: any;                   // jsonb
    notes?: string;
}

@Injectable()
export class AuditStore {
    private readonly logger = new Logger(AuditStore.name);

    constructor(
        @Inject('KNEX_CONNECTION') private readonly knex: Knex,
    ) { }

    // ── Mapping Methods ─────────────────────────────────────────────────────

    protected domainToRecord(domain: Partial<Audit>): Partial<AuditRecord> {
        return {
            entity_type: domain.entityType,
            entity_id: domain.entityId,
            action: domain.action,
            user_id: domain.userId,
            changes: domain.changes,
            metadata: domain.metadata,
            notes: domain.notes,
        };
    }

    protected recordToDomain(record: AuditRecord): Audit {
        return {
            id: record.id,
            timestamp: record.timestamp,
            entityType: record.entity_type,
            entityId: record.entity_id,
            action: record.action,
            userId: record.user_id,
            changes: record.changes,
            metadata: record.metadata,
            notes: record.notes,
        };
    }

    // ── Core Audit Methods ──────────────────────────────────────────────────

    async log(entry: Partial<Audit>): Promise<void> {
        try {
            const record = this.domainToRecord(entry);

            await this.knex('audit').insert({...record, id: v4()});

            this.logger.debug(`Audited ${entry.action} on ${entry.entityType}:${entry.entityId}`);
        } catch (error) {
            this.logger.error(`Failed to log entity audit for ${entry.entityType}:${entry.entityId}`, error);
        }
    }

    // ── Query Methods ───────────────────────────────────────────────────────

    async findForUser(userId: string, limit = 50): Promise<Audit[]> {
        const records = await this.knex<AuditRecord>('audit')
            .where('user_id', userId)
            .orderBy('timestamp', 'desc')
            .limit(limit);

        return records.map(record => this.recordToDomain(record));
    }

    async findByEntity(entityType: string, entityId: string | number): Promise<Audit[]> {
        const records = await this.knex<AuditRecord>('audit')
            .where('entity_type', entityType)
            .where('entity_id', String(entityId))
            .orderBy('timestamp', 'desc');

        return records.map(record => this.recordToDomain(record));
    }

    async findAll(limit = 100): Promise<Audit[]> {
        const records = await this.knex<AuditRecord>('audit')
            .orderBy('timestamp', 'desc')
            .limit(limit);

        return records.map(record => this.recordToDomain(record));
    }
}