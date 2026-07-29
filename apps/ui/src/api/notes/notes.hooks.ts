import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { UpdatableNote } from '@home-ai/shared/domain/note/note';
import { notesApi } from '@/api/notes/notes.api';
import { noteKeys } from '@/api/notes/notes.keys';
import { adminNoteKeys } from '@/api/notes/admin/notes.admin.keys';

export function useNoteSearch(criteria: SearchCriteriaBase) {
  return useQuery({
    queryKey: noteKeys.list(criteria),
    queryFn: () => notesApi.search(criteria),
  });
}

export function useNoteById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: noteKeys.detail(id ?? ''),
    queryFn: () => notesApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatableNote }) =>
      notesApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: noteKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: noteKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminNoteKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminNoteKeys.detail(id) });
    },
  });
}

export function useSoftDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesApi.softDelete(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: noteKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: noteKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminNoteKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminNoteKeys.detail(id) });
    },
  });
}
