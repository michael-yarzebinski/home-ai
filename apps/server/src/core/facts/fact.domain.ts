/**
 * Domain model for Fact entity (camelCase).
 * Only fields used in facts.service.ts and schema (key is primary identifier).
 */
export interface Fact {
  id: string;
  key: string;
  value: string;
  ownerUserId?: string | null;
  visibilityRoles?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
