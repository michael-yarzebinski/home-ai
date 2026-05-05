import { z } from 'zod';

export const SearchCriteriaSchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  includeInactive: z.boolean().optional(),
});

export type SearchCriteriaBase = z.infer<typeof SearchCriteriaSchema>;

export type SearchCriteria<T extends SearchCriteriaBase = SearchCriteriaBase> = T;
