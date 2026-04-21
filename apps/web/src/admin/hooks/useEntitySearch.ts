import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api';
import { parseApiError } from '../lib/parseApiError';

type SearchResponse<T> = {
  items: T[];
  total: number;
  pageNumber?: number;
  pageSize?: number;
};

type UseEntitySearchParams = {
  searchPath: string;
  search: string;
  includeInactive: boolean;
  pageSize: number;
  queryKeyRoot: string;
};

export function useEntitySearch<T>({
  searchPath,
  search,
  includeInactive,
  pageSize,
  queryKeyRoot,
}: UseEntitySearchParams) {
  const query = useInfiniteQuery({
    queryKey: ['admin-entity-search', queryKeyRoot, searchPath, search, includeInactive, pageSize],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await apiFetch(searchPath, {
        method: 'POST',
        body: JSON.stringify({
          search: search.trim() || undefined,
          includeInactive,
          pageNumber: pageParam,
          pageSize,
        }),
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res));
      }
      return (await res.json()) as SearchResponse<T>;
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
      if (loaded >= lastPage.total) {
        return undefined;
      }
      const current = lastPage.pageNumber ?? allPages.length;
      return current + 1;
    },
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const hasMore = items.length < total;

  return { ...query, items, total, hasMore };
}
