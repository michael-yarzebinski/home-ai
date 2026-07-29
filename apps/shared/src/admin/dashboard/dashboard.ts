import { z } from 'zod';

export const DashboardPeriodSchema = z.enum(['1h', '24h', '7d', '30d', '90d']);
export type DashboardPeriod = z.infer<typeof DashboardPeriodSchema>;

export const DashboardQuerySchema = z.object({
  period: DashboardPeriodSchema.default('24h'),
});
export type DashboardQuery = z.infer<typeof DashboardQuerySchema>;

export interface TimeBucket {
  timestamp: string;
  aiAudit: number;
  audit: number;
  logs: number;
  notificationLog: number;
}

export interface DashboardResult {
  temporal: {
    period: DashboardPeriod;
    from: Date;
    to: Date;
    buckets: TimeBucket[];
    logsBySeverity: { info: number; warn: number; error: number; total: number };
  };
  system: {
    notificationQueue: { total: number; pending: number };
    pendingActions: { total: number; pending: number; approved: number; rejected: number };
    recentErrors: Array<{ id: string; message: string; createdAt: Date; metadata: unknown }>;
  };
}
