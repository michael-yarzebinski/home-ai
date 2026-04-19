import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Knex } from 'knex';
import { AuditService } from './monitoring/audit/audit.service';
import { KNEX_CONNECTION, EntityStoreOptions } from '../database/knex.constants';
import { Audit } from './monitoring/audit/audit.domain';
import { v4 } from 'uuid';

@Injectable()
export abstract class AbstractEntityStore<
  RecordType extends Record<string, any> = any,
  DomainType extends Record<string, any> = any,
> {
  protected readonly logger = new Logger(AbstractEntityStore.name);
  protected readonly knex: Knex;
  protected readonly auditService: AuditService;

  protected readonly tableName: string;
  protected readonly auditEntityType: string;
  protected readonly primaryKey: string;
  protected readonly hasUpdatedAt: boolean;
  protected readonly hasActiveFlag: boolean;

  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
    auditService: AuditService,
    options: EntityStoreOptions,
  ) {
    this.knex = knex;
    this.auditService = auditService;

    this.tableName = options.tableName;
    this.auditEntityType = options.auditEntityType;
    this.primaryKey = options.primaryKey || 'id';
    this.hasUpdatedAt = options.hasUpdatedAt ?? false;
    this.hasActiveFlag = options.hasActiveFlag ?? false;

    this.logger.log(
      `Initialized ${this.auditEntityType}Store for table '${this.tableName}' ` +
      `(PK: ${this.primaryKey}, activeFlag: ${this.hasActiveFlag})`
    );
  }

  /**
   * Convert business domain object (camelCase) → DB record (snake_case)
   */
  protected abstract domainToRecord(domain: Partial<DomainType>): Partial<RecordType>;

  /**
   * Convert DB record (snake_case) → business domain object (camelCase)
   */
  protected abstract recordToDomain(record: RecordType): DomainType;

  /**
   * Get entity identifier (handles custom PKs like task_name or readable_id)
   */
  protected getEntityId(record: RecordType | DomainType): string | number {
    if (!record) return 'unknown';
    return (record as any)[this.primaryKey] ?? (record as any).id ?? 'unknown';
  }

  /**
   * Base query builder (returns raw Knex query for flexibility)
   */
  protected baseQuery() {
    return this.knex(this.tableName).select('*');
  }

  /**
   * Find ALL records (including inactive ones)
   */
  async getAll(): Promise<DomainType[]> {
    try {
      const records = await this.baseQuery()
        .orderBy(this.primaryKey) as RecordType[];

      const domains = records.map((record) => this.recordToDomain(record));
      this.logger.debug(`Retrieved ${domains.length} ${this.auditEntityType.toLowerCase()}s (including inactive)`);
      return domains;
    } catch (error) {
      this.logger.error(`Failed to getAll ${this.tableName}`, error);
      throw new BadRequestException(`Failed to retrieve ${this.auditEntityType}s`);
    }
  }

  /**
   * Find only ACTIVE records (recommended for normal operations)
   */
  async getAllActive(): Promise<DomainType[]> {
    if (!this.hasActiveFlag) {
      return this.getAll();
    }

    try {
      const records = await this.baseQuery()
        .where('active', true)
        .orderBy(this.primaryKey) as RecordType[];

      const domains = records.map((record) => this.recordToDomain(record));
      this.logger.debug(`Retrieved ${domains.length} active ${this.auditEntityType.toLowerCase()}s`);
      return domains;
    } catch (error) {
      this.logger.error(`Failed to getAllActive ${this.tableName}`, error);
      throw new BadRequestException(`Failed to retrieve active ${this.auditEntityType}s`);
    }
  }

  /**
   * Find by primary key with optional includeInactive flag
   * Default: only returns active records when hasActiveFlag = true
   */
  async getById(id: string | number, includeInactive: boolean = false): Promise<DomainType> {
    if (!id) {
      throw new BadRequestException('ID is required');
    }

    try {
      let query = this.knex(this.tableName)
        .where(this.primaryKey, id)
        .first() as Promise<RecordType | undefined>;

      // Only apply active filter if the table has the flag AND we are NOT including inactive
      if (this.hasActiveFlag && !includeInactive) {
        query = this.knex(this.tableName)
          .where(this.primaryKey, id)
          .andWhere('active', true)
          .first() as Promise<RecordType | undefined>;
      }

      const record = await query;

      if (!record) {
        const status = this.hasActiveFlag && !includeInactive ? 'not found or inactive' : 'not found';
        throw new NotFoundException(`${this.auditEntityType} with ${this.primaryKey}=${id} ${status}`);
      }

      return this.recordToDomain(record);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to getById ${this.tableName}:${id}`, error);
      throw new BadRequestException(`Failed to retrieve ${this.auditEntityType}`);
    }
  }

  /**
   * Create a new entity
   */
  async create(domain: Partial<DomainType>): Promise<DomainType> {
    if (!domain) throw new BadRequestException('Domain data is required');

    try {
      const record = this.domainToRecord(domain);

      if (this.hasActiveFlag && (record as any).active === undefined) {
        (record as any).active = true;
      }

      const [createdRecord] = await this.knex(this.tableName)
        .insert(record)
        .returning('*') as [RecordType];

      const createdDomain = this.recordToDomain(createdRecord);
      const entityId = this.getEntityId(createdRecord);

      await this.logAudit('CREATE', entityId, { new: createdDomain });

      this.logger.log(`Created ${this.auditEntityType} ${entityId}`);
      return createdDomain;
    } catch (error: any) {
      this.logger.error(`Failed to create ${this.auditEntityType}`, error);
      if (error.code === '23505') {
        throw new BadRequestException(`A ${this.auditEntityType} with that identifier already exists`);
      }
      throw new BadRequestException(`Failed to create ${this.auditEntityType}`);
    }
  }

  /**
   * Update an existing entity
   */
  async update(id: string | number, updates: Partial<DomainType>): Promise<DomainType> {
    if (!id) throw new BadRequestException('ID is required');
    if (!updates || Object.keys(updates).length === 0) {
      throw new BadRequestException('Update data is required');
    }

    try {
      const oldDomain = await this.getById(id).catch(() => null);
      const recordUpdates = this.domainToRecord(updates);

      if (this.hasUpdatedAt) {
        (recordUpdates as any).updated_at = this.knex.fn.now();
      }

      const [updatedRecord] = await this.knex(this.tableName)
        .where(this.primaryKey, id)
        .update(recordUpdates)
        .returning('*') as [RecordType];

      if (!updatedRecord) {
        throw new NotFoundException(`${this.auditEntityType} with ${this.primaryKey}=${id} not found`);
      }

      const updatedDomain = this.recordToDomain(updatedRecord);
      await this.logAudit('UPDATE', id, { old: oldDomain, new: updatedDomain });

      this.logger.log(`Updated ${this.auditEntityType} ${id}`);
      return updatedDomain;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to update ${this.auditEntityType}:${id}`, error);
      throw new BadRequestException(`Failed to update ${this.auditEntityType}`);
    }
  }

  /**
   * Hard delete
   */
  async delete(id: string | number): Promise<number> {
    if (!id) throw new BadRequestException('ID is required');

    try {
      const oldDomain = await this.getById(id).catch(() => null);

      const deletedCount = await this.knex(this.tableName)
        .where(this.primaryKey, id)
        .del();

      if (deletedCount === 0) {
        throw new NotFoundException(`${this.auditEntityType} with ${this.primaryKey}=${id} not found`);
      }

      await this.logAudit('DELETE', id, { old: oldDomain });

      this.logger.log(`Deleted ${this.auditEntityType} ${id}`);
      return deletedCount;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to delete ${this.auditEntityType}:${id}`, error);
      throw new BadRequestException(`Failed to delete ${this.auditEntityType}`);
    }
  }

  /**
   * Toggle active status (soft enable/disable)
   */
  async setActive(id: string | number, active: boolean): Promise<DomainType> {
    if (!this.hasActiveFlag) {
      throw new BadRequestException(`Table ${this.tableName} does not support active flag`);
    }

    return this.update(id, { active } as unknown as Partial<DomainType>);
  }

  /**
   * Protected audit logging
   */
  protected async logAudit(action: 'CREATE' | 'UPDATE' | 'DELETE', entityId: string | number, changes?: { old?: any; new?: any }): Promise<void> {
    try {
      const logEntry: Audit = {
        id: v4(),
        entityType: this.auditEntityType,
        entityId: entityId.toString(),
        action,
        changes,
        metadata: { table: this.tableName },
        timestamp: new Date(),
      };

      await this.auditService.log(logEntry);
      this.logger.debug(`${action} ${this.auditEntityType} ${entityId}`);
    } catch (error) {
      this.logger.error(`Failed to audit ${action} for ${this.auditEntityType}:${entityId}`, error);
    }
  }
}