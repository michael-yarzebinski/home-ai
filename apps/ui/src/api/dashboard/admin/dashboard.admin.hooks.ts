import { useQuery } from '@tanstack/react-query';
import type { DashboardQuery } from '@home-ai/shared/admin/dashboard/dashboard';
import { dashboardAdminApi } from '@/api/dashboard/admin/dashboard.admin.api';
import { adminDashboardKeys } from '@/api/dashboard/admin/dashboard.admin.keys';

export function useAdminDashboard(query: DashboardQuery) {
  return useQuery({
    queryKey: adminDashboardKeys.query(query),
    queryFn: () => dashboardAdminApi.get(query),
  });
}
