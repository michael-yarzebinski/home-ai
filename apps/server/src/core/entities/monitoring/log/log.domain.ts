export interface Log {
  id: string;
  severity?: string; // info, warn, error
  message?: string;
  data?: Record<string, any>;
  userId?: string | null;
  createdAt: Date;
}