/** Read-only admin listing for entity audit rows. */
export class AuditDto {
  id!: string;
  timestamp!: string;
  entityType!: string;
  entityId!: string;
  action!: string;
  userId?: string | null;
  changes?: { old?: unknown; new?: unknown } | null;
  metadata!: Record<string, unknown>;
  notes?: string | null;
}
