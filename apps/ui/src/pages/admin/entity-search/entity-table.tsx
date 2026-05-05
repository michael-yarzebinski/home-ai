import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Search, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';
import { DEFAULT_PAGE_SIZE, type Paginated } from '@/types/api';
import type { EntityConfig } from './entity-configs';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EntityTableProps {
  config: EntityConfig;
  onRowClick: (entity: Record<string, unknown>) => void;
  onEdit: (entity: Record<string, unknown>) => void;
  onAdd: () => void;
  /** Override the API base. Defaults to '/v1/admin'. */
  apiBase?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EntityTable({
  config,
  onRowClick,
  onEdit,
  onAdd,
  apiBase = '/v1/admin',
}: EntityTableProps) {
  const [query, setQuery] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Record<string, unknown>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(
    async (q: string, inactive: boolean, p: number) => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.post<Paginated<Record<string, unknown>>>(
          `${apiBase}/${config.apiPath}/search`,
          { query: q, page: p, pageSize: DEFAULT_PAGE_SIZE, includeInactive: inactive },
        );
        setResult(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [config.apiPath, apiBase],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const delay = query ? 350 : 0;
    debounceRef.current = setTimeout(() => {
      void fetchData(query, includeInactive, page);
    }, delay);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, includeInactive, page, fetchData]);

  const handleQueryChange = (q: string) => {
    setQuery(q);
    setPage(1);
  };
  const handleInactiveToggle = (v: boolean) => {
    setIncludeInactive(v);
    setPage(1);
  };

  const totalPages = result ? Math.ceil(result.total / DEFAULT_PAGE_SIZE) : 0;
  const rows = result?.items ?? [];
  const canCreate = !config.isMonitoring && config.canCreate !== false;
  const canEdit = !config.isMonitoring;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap px-4 pt-4 pb-3 border-b border-border flex-shrink-0">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={`Search ${config.pluralLabel.toLowerCase()}…`}
            className="pl-8 h-8 text-xs"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
          <Switch checked={includeInactive} onCheckedChange={handleInactiveToggle} />
          <span className="text-xs text-muted-foreground whitespace-nowrap">Include inactive</span>
        </label>

        {canCreate && (
          <button
            onClick={onAdd}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
              'text-xs font-medium bg-primary text-primary-foreground',
              'hover:bg-primary/90 transition-colors flex-shrink-0',
            )}
          >
            <Plus size={13} />
            Add {config.label}
          </button>
        )}
      </div>

      {/* Count + pagination header */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0 min-h-[32px]">
        <span className="text-xs text-muted-foreground/60">
          {loading && !result ? (
            <span className="flex items-center gap-1.5">
              <Loader2 size={11} className="animate-spin" />
              Loading…
            </span>
          ) : error ? (
            <span className="text-red-400">Error: {error}</span>
          ) : result?.total === 0 ? (
            `No ${config.pluralLabel.toLowerCase()} found`
          ) : result ? (
            `${result.total} ${config.pluralLabel.toLowerCase()}${query ? ' matching' : ''}`
          ) : null}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-muted-foreground px-1">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto relative">
        {loading && result && (
          <div className="absolute top-2 right-4 z-20">
            <Loader2 size={13} className="animate-spin text-muted-foreground/60" />
          </div>
        )}

        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="border-b border-border">
              {config.columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest',
                    'text-muted-foreground/60 whitespace-nowrap',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
              {(canEdit || config.quickAction) && <th className="px-4 py-2.5 w-[80px]" />}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={config.columns.length + 1}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  {error
                    ? 'Failed to load. Please try again.'
                    : `No ${config.pluralLabel.toLowerCase()} found${query ? ` matching "${query}"` : ''}`}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => (
                <tr
                  key={(row['id'] as string) ?? rowIdx}
                  className={cn(
                    'border-b border-border/50 group',
                    'hover:bg-accent/50 transition-colors cursor-pointer',
                  )}
                  onClick={() => onRowClick(row)}
                >
                  {config.columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-sm text-foreground', col.className)}>
                      {col.render
                        ? col.render(row[col.key], row)
                        : <span>{String(row[col.key] ?? '—')}</span>}
                    </td>
                  ))}

                  {(canEdit || config.quickAction) && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {config.quickAction && (
                          <button
                            title={config.quickAction.label}
                            onClick={() => config.quickAction?.onClick?.(row)}
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            <Zap size={13} />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            title={`Edit ${config.label}`}
                            onClick={() => onEdit(row)}
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
