import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, GitBranch, Loader2, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { DEFAULT_PAGE_SIZE, type Paginated } from '@/types/api';
import type { TurnTraceSummary } from '@home-ai/shared/domain/monitoring/trace/trace';

export function TracesList() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<TurnTraceSummary> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async (q: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.post<Paginated<TurnTraceSummary>>(
        '/v1/admin/traces/search',
        { query: q, page: p, pageSize: DEFAULT_PAGE_SIZE },
      );
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchData(query, page);
    }, query ? 350 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, page, fetchData]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / DEFAULT_PAGE_SIZE)) : 1;
  const rows = result?.items ?? [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
            <GitBranch className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">Traces</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Logs and LLM audits grouped by orchestrator turn
            </p>
          </div>
        </div>
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search prompt or paste a trace UUID…"
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-2 flex-shrink-0 min-h-[32px]">
        <span className="text-xs text-muted-foreground/60">
          {loading && !result ? (
            <span className="flex items-center gap-1.5">
              <Loader2 size={11} className="animate-spin" />
              Loading…
            </span>
          ) : error ? (
            <span className="text-destructive">Error: {error}</span>
          ) : result?.total === 0 ? (
            query ? `No traces matching “${query}”` : 'No traces yet'
          ) : result ? (
            `${result.total} trace${result.total === 1 ? '' : 's'}${query ? ' matching' : ''}`
          ) : null}
        </span>
        {result && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!result.hasPrevious}
              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-muted-foreground px-1">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!result.hasNext}
              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto relative">
        {loading && result && (
          <div className="absolute top-2 right-4 z-20">
            <Loader2 size={13} className="animate-spin text-muted-foreground/60" />
          </div>
        )}

        {loading && !result ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b border-border">
                {['When', 'Prompt', 'Logs', 'LLM', 'Errors', 'Trace'].map((header) => (
                  <th
                    key={header}
                    className="px-4 first:px-6 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {error && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    Failed to load. Please try again.
                  </td>
                </tr>
              ) : rows.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    {query
                      ? `No traces matching “${query}”`
                      : 'No traces yet. They appear after a chat or automation turn.'}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.traceId}
                    className="border-b border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/traces/${row.traceId}`)}
                  >
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(row.startedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      {row.prompt ? (
                        truncate(row.prompt, 80)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums">{row.logCount}</td>
                    <td className="px-4 py-3 text-xs tabular-nums">{row.auditCount}</td>
                    <td className="px-4 py-3 text-xs tabular-nums">
                      {row.errorCount > 0 ? (
                        <span className="text-destructive font-medium">{row.errorCount}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {row.traceId.slice(0, 8)}…
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function truncate(s: string, max: number) {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}
