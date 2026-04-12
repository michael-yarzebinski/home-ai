import { Knex } from 'knex';

/**
 * Constants for database injection tokens and entity store configuration.
 * This ensures consistent token usage across the application.
 */
export const KNEX_CONNECTION = 'KNEX_CONNECTION' as const;

export interface EntityStoreOptions {
  /** Database table name (e.g. 'config', 'tasks') */
  tableName: string;
  /** Identifier for audit logs (e.g. 'Config', 'Task') */
  auditEntityType: string;
  /** Primary key column name. Defaults to 'id'. Use 'key' for config, 'task_name' for tasks. */
  primaryKey?: string;
  /** Whether to automatically set updated_at timestamp on updates (for tables that have it) */
  hasUpdatedAt?: boolean;
}

/**
 * Audit log entry for entity changes.
 * Used by AbstractEntityStore to ensure consistent auditing.
 */
export interface EntityAuditLog {
  entityType: string;
  entityId: string | number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  changes?: {
    old?: any;
    new?: any;
  };
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Read-only interface exposed via .reader
 * Prevents accidental mutations from services that should only read data.
 * Services expose this as public readonly reader.
 */
export interface StoreReader<RecordType = any, DomainType = any> {
  findAll(): Promise<DomainType[]>;
  findById(id: string | number): Promise<DomainType | null>;
  findOneBy(criteria: Partial<DomainType | RecordType>): Promise<DomainType | null>;
  /** Alias to support this.service.reader.getById(...) exactly as specified */
  getById(id: string | number): Promise<DomainType | null>;
}
