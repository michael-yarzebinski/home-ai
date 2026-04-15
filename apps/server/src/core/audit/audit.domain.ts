export interface Audit {
    id: string;
    timestamp: Date;
    entityType: string;
    entityId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    userId?: string;
    changes?: {
      old?: Record<string, any>;
      new?: Record<string, any>;
    };
    metadata?: Record<string, any>;
    notes?: string;
  }