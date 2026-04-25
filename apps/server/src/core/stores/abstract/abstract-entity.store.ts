// core/stores/abstract/AbstractEntityStore.ts
import { Knex } from 'knex';
import { BaseStore } from './base.store.interface';
import type { Insertable, Updatable } from '@home-ai/shared/domain/helper/crud.helper';
import type { SearchCriteria, SearchCriteriaBase } from '@home-ai/shared/search/search';
import { AuditStore } from '../audit/audit.store';   // we'll create this next
import { Paginated } from '@home-ai/shared/search/pagination';
import { Id } from './abstract-monitoring.store';
import { EntityNotFoundError } from '../../../common/errors/entity-not-found.error'
import { Inject, Injectable } from '@nestjs/common';

export type AuditableEntity = Id & {
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

@Injectable()
export abstract class AbstractEntityStore<
    TDomain extends Id,
    TRecord extends AuditableEntity,
    TInsertable = Insertable<TDomain>,
    TUpdatable = Updatable<TDomain>,
    TSearchCriteria extends SearchCriteriaBase = SearchCriteriaBase
> implements BaseStore<TDomain, TRecord, TInsertable, TUpdatable, TSearchCriteria> {

    private readonly tableName: string;
    private readonly entityType: string;

    private readonly knex: Knex;
    private readonly auditStore: AuditStore;

    protected constructor(@Inject('KNEX_CONNECTION') knex: Knex, auditStore: AuditStore, options: { tableName: string, entityType: string }) {
        this.knex = knex;
        this.auditStore = auditStore;
        this.tableName = options.tableName;
        this.entityType = options.entityType;
    }

    abstract search(criteria: SearchCriteria<TSearchCriteria>): Promise<Paginated<TDomain>>;
    protected abstract recordToDomain(record: TRecord): TDomain;
    protected abstract domainToRecord(domain: TDomain): TRecord;

    protected get table(): Knex.QueryBuilder<TRecord, TRecord[]> {
        return this.knex(this.tableName);
    }

    protected get active(): Knex.QueryBuilder<TRecord, TRecord[]> {
        return this.table.where({ active : true });
    }

    protected activeOrInactive(includeInactive: boolean): Knex.QueryBuilder<TRecord, TRecord[]>  {
        return includeInactive ? this.table : this.active
    }

    async create(data: TInsertable): Promise<TDomain> {
        const record = this.domainToRecord(data as any);
        const [inserted] = (await this.table.insert(record as any).returning('*')) as TRecord[];

        const domain = this.recordToDomain(inserted);

        await this.auditStore.create({
            entityType: this.entityType,
            entityId: domain.id,
            action: 'create',
            changes: {
                old: null,
                new: inserted,
            },
        });

        return domain;
    }

    async update(id: string, update: TUpdatable): Promise<TDomain> {
        const record = this.domainToRecord(update as any);
        const old = await this.getById(id);
        if (!old) {
            throw new EntityNotFoundError(this.entityType, id);
        }

        const [updated] = (await this.table
            .where({ id })
            .update(record as any)
            .returning('*')) as TRecord[];

        const domain = this.recordToDomain(updated);

        await this.auditStore.create({
            entityType: this.entityType,
            entityId: id,
            action: 'update',
            changes: {
                old,
                new: updated,
            },
        });

        return domain;
    }

    async softDelete(id: string): Promise<void> {
        await this.table.where({ id }).update({ active: false } as any);

        await this.auditStore.create({
            entityType: this.entityType,
            entityId: id,
            action: 'soft_delete',
            changes: {}
        });
    }

    async restore(id: string): Promise<void> {
        await this.table.where({ id }).update({ active: true } as any);

        await this.auditStore.create({
            entityType: this.entityType,
            entityId: id,
            action: 'restore',
            changes: {}
        });
    }

    async getById(id: string, includeInactive: boolean = false): Promise<TDomain | null> {
        const query = this.activeOrInactive(includeInactive);

        const record = (await query.where({ id }).first()) as TRecord | null;
        return record ? this.recordToDomain(record) : record;
    }

    async getByIds(ids: string[], includeInactive: boolean = false): Promise<TDomain[]> {
        const query = this.activeOrInactive(includeInactive);

        const records = await query.whereIn('id', ids) as TRecord[];
        return records.map(r => this.recordToDomain(r));
    }

    async getAll(includeInactive: boolean = false) {
        const records = await this.activeOrInactive(includeInactive) as TRecord[];
        return records.map(r => this.recordToDomain(r));
    }
}