import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { UpdatableCalendar } from '@home-ai/shared/domain/calendar/calendar';
import { calendarsApi } from '@/api/calendars/calendars.api';
import { calendarKeys } from '@/api/calendars/calendars.keys';
import { adminCalendarKeys } from '@/api/calendars/admin/calendars.admin.keys';

export function useCalendarSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: calendarKeys.list(criteria),
    queryFn: () => calendarsApi.search(criteria),
  });
}

export function useCalendarById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: calendarKeys.detail(id ?? ''),
    queryFn: () => calendarsApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useUpdateCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatableCalendar }) =>
      calendarsApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: calendarKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: calendarKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminCalendarKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminCalendarKeys.detail(id) });
    },
  });
}

export function useSoftDeleteCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => calendarsApi.softDelete(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: calendarKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: calendarKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminCalendarKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminCalendarKeys.detail(id) });
    },
  });
}
