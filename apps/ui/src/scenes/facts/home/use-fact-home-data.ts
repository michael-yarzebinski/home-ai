import { useEffect, useMemo } from 'react';
import type { Fact } from '@home-ai/shared/domain/fact/fact';
import { useFactInfinite } from '@/api/facts/facts.hooks';

export type FactsByTag = {
  tag: string;
  facts: Fact[];
};

export function useFactHomeData() {
  const {
    data: factPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useFactInfinite({ query: '', pageSize: 100 });

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const facts = useMemo(
    () => factPages?.pages.flatMap((p) => p.items) ?? [],
    [factPages],
  );

  const groupedByTag = useMemo<FactsByTag[]>(() => {
    const map = new Map<string, Fact[]>();

    for (const fact of facts) {
      if (fact.tags.length === 0) {
        const untagged = map.get('Untagged') ?? [];
        untagged.push(fact);
        map.set('Untagged', untagged);
      } else {
        for (const tag of fact.tags) {
          const group = map.get(tag) ?? [];
          group.push(fact);
          map.set(tag, group);
        }
      }
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => {
        if (a === 'Untagged') return 1;
        if (b === 'Untagged') return -1;
        return a.localeCompare(b);
      })
      .map(([tag, tagFacts]) => ({
        tag,
        facts: [...tagFacts].sort((a, b) => a.key.localeCompare(b.key)),
      }));
  }, [facts]);

  return { groupedByTag, isLoading, totalFacts: facts.length };
}
