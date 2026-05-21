import type { DashboardQuery } from '@home-ai/shared/admin/dashboard/dashboard';

export const adminDashboardKeys = {
  all: ['admin', 'dashboard'] as const,
  query: (query: DashboardQuery) => [...adminDashboardKeys.all, query] as const,
} as const;
