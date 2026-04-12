import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Knex } from 'knex';
import { AuditService } from './audit/audit.service';
import { KNEX_CONNECTION, EntityStoreOptions, StoreReader, EntityAuditLog } from './database/knex.constants';

/**
 * Generic Abstract Entity Store providing type-safe CRUD operations with built-in:
 * - Auditing on all mutating operations (CREATE/UPDATE/DELETE) via AuditService
 * - Structured logging via NestJS Logger
 * - Standard NestJS exceptions (NotFoundException, BadRequestException)
 * - Read-only .reader property exposing ONLY query methods
 * - Conversion between DB Record (snake_case) and Domain (camelCase) shapes
 *
 * Concrete stores extend this and implement:
 * - domainToRecord() - business object -> DB record
 * - recordToDomain() - DB record -> business object
 *
 * All services inject their concrete Store and expose public readonly reader = this.store.reader;
 * This enables this.taskService.reader.getById(...) exactly as specified.
 */
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

  /** Public read-only facade. Consumers use service.reader.getById(...) etc. */
  public readonly reader: StoreReader<RecordType, DomainType>;

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

    // Read-only facade exposing ONLY query methods (findAll, findById, findOneBy, getById).
    // This enforces security by preventing write operations through the reader.
    this.reader = {
      findAll: this.findAll.bind(this),
      findById: this.findById.bind(this),
      findOneBy: this.findOneBy.bind(this),
      getById: this.findById.bind(this), // Exact match for this.taskService.reader.getById(...)
    } as StoreReader<RecordType, DomainType>;

    this.logger.log(`Initialized ${this.auditEntityType}Store for table '${this.tableName}' (PK: ${this.primaryKey})`);
  }

  /**
   * Convert business domain object (camelCase) to DB record (snake_case + DB types).
   * Must be implemented by concrete stores. Only map fields that exist in schema.
   */
  protected abstract domainToRecord(domain: Partial<DomainType>): Partial<RecordType>;

  /**
   * Convert DB record (snake_case) to business domain object (camelCase).
   * Must be implemented by concrete stores. Only include fields from schema.
   */
  protected abstract recordToDomain(record: RecordType): DomainType;

  /**
   * Get entity identifier from a record (handles custom PKs like task_name, key)
   */
  protected getEntityId(record: RecordType | DomainType): string | number {
    if (!record) return 'unknown';
    return (record as any)[this.primaryKey] ?? (record as any).id ?? 'unknown';
  }

  /**
   * Log an entity change to audit with consistent structure.
   * Automatically called by create/update/delete.
   */
  protected async logAudit(action: 'CREATE' | 'UPDATE' | 'DELETE', entityId: string | number, changes?: { old?: any; new?: any }): Promise<void> {
    try {
      const logEntry: EntityAuditLog = {
        entityType: this.auditEntityType,
        entityId,
        action,
        changes,
        metadata: {
          table: this.tableName,
          timestamp: new Date().toISOString(),
        },
      };

      await this.auditService.log(logEntry);
      this.logger.debug(`${action} ${this.auditEntityType} ${entityId}`);
    } catch (error) {
      // Audit failures must never break business logic
      this.logger.error(`Failed to audit ${action} for ${this.auditEntityType}:${entityId}`, error);
    }
  }

  /**
   * Find all records, converted to domain objects.
   * Ordered by primary key for deterministic results.
   */
  async findAll(): Promise<DomainType[]> {
    try {
      const records = await this.knex(this.tableName)
        .select('*')
        .orderBy(this.primaryKey) as RecordType[];

      const domains = records.map((record) => this.recordToDomain(record));
      this.logger.debug(`Retrieved ${domains.length} ${this.auditEntityType.toLowerCase()}s`);
      return domains;
    } catch (error) {
      this.logger.error(`Failed to findAll ${this.tableName}`, error);
      throw new BadRequestException(`Failed to retrieve ${this.auditEntityType}s`);
    }
  }

  /**
   * Find by primary key. Throws NotFoundException if not found.
   */
  async findById(id: string | number): Promise<DomainType> {
    if (!id) {
      throw new BadRequestException('ID is required');
    }

    try {
      const record = await this.knex(this.tableName)
        .where(this.primaryKey, id)
        .first() as RecordType | undefined;

      if (!record) {
        throw new NotFoundException(`${this.auditEntityType} with ${this.primaryKey}=${id} not found`);
      }

      return this.recordToDomain(record);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to findById ${this.tableName}:${id}`, error);
      throw new BadRequestException(`Failed to retrieve ${this.auditEntityType}`);
    }
  }

  /**
   * Find one record by flexible criteria. Returns null if not found (no exception).
   * Criteria can use either domain or record field names (mapping is basic).
   */
  async findOneBy(criteria: Partial<DomainType | RecordType> = {}): Promise<DomainType | null> {
    if (Object.keys(criteria).length === 0) {
      return null;
    }

    try {
      // For simplicity, pass criteria directly. Concrete stores can override if complex mapping needed.
      const record = await this.knex(this.tableName)
        .where(criteria as any)
        .first() as RecordType | undefined;

      return record ? this.recordToDomain(record) : null;
    } catch (error) {
      this.logger.error(`Failed to findOneBy ${this.tableName}`, error);
      throw new BadRequestException(`Failed to query ${this.auditEntityType}`);
    }
  }

  /**
   * Create a new entity. Automatically audits the creation.
   * Returns the created domain object with any DB-generated fields.
   */
  async create(domain: Partial<DomainType>): Promise<DomainType> {
    if (!domain) {
      throw new BadRequestException('Domain data is required for create');
    }

    try {
      const record = this.domainToRecord(domain);
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
      if (error.code === '23505') { // Unique violation
        throw new BadRequestException(`A ${this.auditEntityType} with that identifier already exists`);
      }
      throw new BadRequestException(`Failed to create ${this.auditEntityType}`);
    }
  }

  /**
   * Update an existing entity. Automatically audits old vs new state.
   * Uses upsert semantics for tables with updated_at.
   */
  async update(id: string | number, updates: Partial<DomainType>): Promise<DomainType> {
    if (!id) {
      throw new BadRequestException('ID is required for update');
    }
    if (!updates || Object.keys(updates).length === 0) {
      throw new BadRequestException('Update data is required');
    }

    try {
      // Get current state for audit
      const oldDomain = await this.findById(id).catch(() => null);
      const recordUpdates = this.domainToRecord(updates);

      // Add updated_at if the table supports it
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
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update ${this.auditEntityType}:${id}`, error);
      throw new BadRequestException(`Failed to update ${this.auditEntityType}`);
    }
  }

  /**
   * Delete an entity by ID. Automatically audits the deletion.
   * Returns the number of deleted rows.
   */
  async delete(id: string | number): Promise<number> {
    if (!id) {
      throw new BadRequestException('ID is required for delete');
    }

    try {
      const oldDomain = await this.findById(id).catch(() => null);

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
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to delete ${this.auditEntityType}:${id}`, error);
      throw new BadRequestException(`Failed to delete ${this.auditEntityType}`);
    }
  }
}
