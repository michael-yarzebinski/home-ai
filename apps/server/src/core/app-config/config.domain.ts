/**
 * Domain model for Config entity.
 * Uses camelCase for business logic, consistent with TypeScript conventions.
 * Only includes fields that exist in the DB schema (from initial_schema.ts).
 */
export interface Config {
  key: string;
  value: string | null;
  description?: string | null;
  updatedAt?: Date;
}

/**
 * Helper type for partial updates (all fields optional).
 */
export type ConfigUpdate = Partial<Config>;
