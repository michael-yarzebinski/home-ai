/**
 * Domain model for User entity (camelCase business shape).
 * Only includes columns used in users.service.ts queries and the schema.
 * No invented fields. All methods in Store/Service return this type.
 */
export interface User {
  id: string;
  name: string;
  role: string;
  messagingId?: string;
  quietStart?: string | null;
  quietEnd?: string | null;
  createdAt?: Date;
}
