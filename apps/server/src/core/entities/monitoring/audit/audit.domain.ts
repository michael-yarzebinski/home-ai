export interface Audit {
  id: string;
  timestamp: Date;
  entityType: string;
  entityId: string;
  action: string; // CREATE | UPDATE | DELETE | EXECUTE
  userId?: string | null;
  changes?: { old?: any; new?: any } | null;
  metadata: Record<string, any>;
  notes?: string | null;
}
