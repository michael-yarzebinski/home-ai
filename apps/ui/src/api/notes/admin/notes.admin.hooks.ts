import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import { notesAdminApi } from '@/api/notes/admin/notes.admin.api';
import { adminNoteKeys } from '@/api/notes/admin/notes.admin.keys';
import { noteKeys } from '@/api/notes/notes.keys';

export function useAdminNoteSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: adminNoteKeys.list(criteria),
    queryFn: () => notesAdminApi.search(criteria),
  });
}

export function useAdminNoteById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: adminNoteKeys.detail(id ?? ''),
    queryFn: () => notesAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminNoteRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesAdminApi.restore(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminNoteKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminNoteKeys.lists() });
      void qc.invalidateQueries({ queryKey: noteKeys.lists() });
      void qc.invalidateQueries({ queryKey: noteKeys.detail(id) });
    },
  });
}
