import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import { calendarsAdminApi } from '@/api/calendars/admin/calendars.admin.api';
import { adminCalendarKeys } from '@/api/calendars/admin/calendars.admin.keys';
import { calendarKeys } from '@/api/calendars/calendars.keys';

export function useAdminCalendarSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: adminCalendarKeys.list(criteria),
    queryFn: () => calendarsAdminApi.search(criteria),
  });
}

export function useAdminCalendarById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminCalendarKeys.detail(id ?? ''),
    queryFn: () => calendarsAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminCalendarRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => calendarsAdminApi.restore(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminCalendarKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminCalendarKeys.lists() });
      void qc.invalidateQueries({ queryKey: calendarKeys.lists() });
      void qc.invalidateQueries({ queryKey: calendarKeys.detail(id) });
    },
  });
}
