export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function toPaginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  const offset = (page - 1) * pageSize;
  return {
    items,
    total,
    page,
    pageSize,
    hasNext: offset + items.length < total,
    hasPrevious: page > 1,
  };
}