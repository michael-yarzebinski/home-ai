import { useInfiniteQuery, QueryKey } from '@tanstack/react-query';
import { SearchCriteriaBase } from '@home-ai/shared/search/search';
import { Paginated } from '@home-ai/shared/search/pagination';

export function useApiInfinite<T>(
    queryKey: QueryKey,
    fetchFn: (criteria: any) => Promise<Paginated<T>>,
    criteria: Omit<SearchCriteriaBase, 'page'>
) {
    return useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam = 1 }) => fetchFn({ ...criteria, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            // Logic: If the items we have are less than total, get next page
            const loadedSoFar = allPages.flatMap(p => p.items).length;
            return loadedSoFar < lastPage.total ? allPages.length + 1 : undefined;
        },
    });
}