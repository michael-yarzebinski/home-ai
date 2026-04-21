import { useEffect, useRef, type ReactNode } from 'react';

export type Column<T> = {
  id: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyMessage: string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
};

/**
 * Opinionated table layout for admin lists — reuse for devices, facts, etc.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage,
  isLoading,
  onRowClick,
  hasMore = false,
  isFetchingMore = false,
  onLoadMore,
}: DataTableProps<T>) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onLoadMore || !hasMore || isFetchingMore || rows.length === 0) {
      return;
    }
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, onLoadMore, rows.length]);

  if (isLoading) {
    return (
      <div
        className="rounded-xl border overflow-hidden animate-pulse"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <div className="h-10 border-b" style={{ borderColor: 'var(--border)' }} />
        <div className="h-12 border-b" style={{ borderColor: 'var(--border)' }} />
        <div className="h-12 border-b" style={{ borderColor: 'var(--border)' }} />
        <div className="h-12" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div
        className="rounded-xl border px-6 py-12 text-center text-sm"
        style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--muted)' }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border overflow-x-auto shadow-sm"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
            {columns.map((col) => (
              <th
                key={col.id}
                scope="col"
                className={`px-4 py-3 font-semibold text-xs uppercase tracking-wide ${col.className ?? ''}`.trim()}
                style={{ color: 'var(--muted)' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className={`border-b last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
              style={{ borderColor: 'var(--border)' }}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.id} className={`px-4 py-3 align-middle ${col.className ?? ''}`.trim()}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 0 && (
        <div ref={sentinelRef} className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>
          {isFetchingMore ? 'Loading more…' : hasMore ? 'Scroll to load more' : 'End of results'}
        </div>
      )}
    </div>
  );
}
