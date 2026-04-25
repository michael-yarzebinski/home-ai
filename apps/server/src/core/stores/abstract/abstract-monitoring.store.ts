// core/stores/abstract/abstract-monitoring.store.ts
import type { Knex } from 'knex';
import type { SearchCriteria, SearchCriteriaBase } from '@home-ai/shared/search/search';
import { Insertable } from '@home-ai/shared/domain/helper/crud.helper';
import { Paginated } from '@home-ai/shared/search/pagination';
import { Inject } from '@nestjs/common';

export type Id = {id: string };

export abstract class AbstractMonitoringStore<
  TDomain extends Id,
  TRecord extends Id,
  TInsertable = Insertable<TDomain>,
  TSearchCriteria extends SearchCriteriaBase = SearchCriteriaBase
> {
  private readonly tableName: string;
  private readonly knex: Knex;

  protected constructor(@Inject('KNEX_CONNECTION') knex: Knex, options: { tableName: string}) {
    this.knex = knex;
    this.tableName = options.tableName
  }

  abstract search(criteria: SearchCriteria<TSearchCriteria>): Promise<Paginated<TDomain>>;
  protected abstract recordToDomain(record: TRecord): TDomain;
  protected abstract domainToRecord(domain: TDomain): TRecord;

  protected get table(): Knex.QueryBuilder<TRecord, TRecord[]> {
    return this.knex(this.tableName);
  }

  async create(data: TInsertable): Promise<TDomain> {
    const record = this.domainToRecord(data as any);
    const [inserted] = (await this.table.insert(record as any).returning('*')) as TRecord[];

    return this.recordToDomain(inserted);
  }

  async getById(id: string): Promise<TDomain | null> {
    const record = (await this.table.where({ id }).first()) as TRecord;
    return record ? this.recordToDomain(record) : null;
  }

  async getByIds(ids: string[]): Promise<TDomain[]> {
    const records = await this.knex(this.tableName).whereIn('id', ids);
    return records.map(r => this.recordToDomain(r));
  }

}