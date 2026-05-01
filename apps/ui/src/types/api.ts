/** Matches the server's Paginated<T> response envelope */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const DEFAULT_PAGE_SIZE = 10;

/** Mock search helper — filters + paginates in-memory data */
export function mockSearch<T extends Record<string, unknown>>(
  source: T[],
  query: string,
  includeInactive: boolean,
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Paginated<T> {
  let items = [...source];

  if (!includeInactive) {
    items = items.filter((item) => item['active'] !== false);
  }

  if (query.trim()) {
    const q = query.toLowerCase();
    items = items.filter((item) =>
      Object.values(item).some((v) => String(v ?? '').toLowerCase().includes(q)),
    );
  }

  const total = items.length;
  const start = page * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  };
}
