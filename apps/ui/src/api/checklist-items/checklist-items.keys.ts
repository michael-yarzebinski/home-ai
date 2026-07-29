export const checklistItemKeys = {
  all: ['checklist-items'] as const,
  details: () => [...checklistItemKeys.all, 'detail'] as const,
  detail: (id: string) => [...checklistItemKeys.details(), id] as const,
} as const;
