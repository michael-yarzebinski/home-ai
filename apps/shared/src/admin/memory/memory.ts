import { z } from 'zod';
import { SearchCriteriaSchema } from '../../search/search';

export const MemoryCategorySchema = z.enum(['observation', 'fact']);
export type MemoryCategory = z.infer<typeof MemoryCategorySchema>;

export const MemoryMetadataSchema = z.object({
  category: MemoryCategorySchema,
  userId: z.string().optional(),
  targetEntityId: z.string().optional(),
  timestamp: z.string(),
});
export type MemoryMetadata = z.infer<typeof MemoryMetadataSchema>;

export const MemoryRecordSchema = z.object({
  document: z.string(),
  metadata: MemoryMetadataSchema,
  distance: z.number().optional(),
});
export type MemoryRecord = z.infer<typeof MemoryRecordSchema>;

/** Admin semantic search; uses standard search criteria (`query` optional). */
export const MemorySearchCriteriaSchema = SearchCriteriaSchema;
export type MemorySearchCriteria = z.infer<typeof MemorySearchCriteriaSchema>;
