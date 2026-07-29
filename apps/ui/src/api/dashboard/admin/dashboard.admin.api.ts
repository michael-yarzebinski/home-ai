import type {
  DashboardQuery,
  DashboardResult,
} from '@home-ai/shared/admin/dashboard/dashboard';
import { apiClient } from '@/api/client';

const ADMIN_BASE = '/v1/admin/dashboard';

export const dashboardAdminApi = {
  get: (query: DashboardQuery) => {
    const q = new URLSearchParams();
    q.set('period', query.period);
    return apiClient.get<DashboardResult>(`${ADMIN_BASE}?${q.toString()}`);
  },
} as const;
