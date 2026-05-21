import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Monitor,
  Send,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardResult } from '@home-ai/shared/domain/admin/dashboard/dashboard';

const ERRORS_PER_PAGE = 3;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SystemOperationsProps {
  data: DashboardResult['system'] | null;
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export function SystemOperations({ data, loading }: SystemOperationsProps) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 flex-shrink-0">
          <Monitor className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground leading-tight">System Operations</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Errors, notification queue, and pending action domains
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <ErrorFeed errors={data?.recentErrors ?? []} loading={loading} />
        </div>
        <div className="flex flex-col gap-4">
          <OutboundQueueCard data={data?.notificationQueue ?? null} loading={loading} />
          <PendingActionsCard data={data?.pendingActions ?? null} loading={loading} />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RecentError = DashboardResult['system']['recentErrors'][number];

// ---------------------------------------------------------------------------
// Critical error feed
// ---------------------------------------------------------------------------

function ErrorFeed({ errors, loading }: { errors: RecentError[]; loading: boolean }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(errors.length / ERRORS_PER_PAGE));
  const visible = errors.slice(page * ERRORS_PER_PAGE, (page + 1) * ERRORS_PER_PAGE);

  return (
    <div className="rounded-lg border border-border bg-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={13} className="text-red-500" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Critical Error Feed
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/60">
            Page {page + 1}/{totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-border flex-1">
        {loading ? (
          Array.from({ length: ERRORS_PER_PAGE }).map((_, i) => (
            <div key={i} className="py-3 first:pt-0 last:pb-0">
              <div className="h-4 rounded bg-border/50 animate-pulse mb-1.5" />
              <div className="h-3 w-1/2 rounded bg-border/40 animate-pulse" />
            </div>
          ))
        ) : visible.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground/50">No recent errors</p>
          </div>
        ) : (
          visible.map((log) => {
            const meta = log.metadata as { errorCode?: string; domain?: string; severity?: string } | null;
            const severity = meta?.severity ?? 'ERROR';
            return (
              <div key={log.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className={cn(
                    'mt-1 h-2 w-2 rounded-full flex-shrink-0',
                    severity === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-500',
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{log.message}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {meta?.errorCode && (
                      <span
                        className={cn(
                          'inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase',
                          severity === 'CRITICAL'
                            ? 'bg-red-500/15 text-red-400'
                            : 'bg-orange-500/15 text-orange-400',
                        )}
                      >
                        {meta.errorCode}
                      </span>
                    )}
                    {meta?.domain && (
                      <span className="text-[10px] text-muted-foreground/60 font-medium">
                        DOMAIN: {meta.domain}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground/50 flex-shrink-0 mt-0.5">
                  {timeAgo(new Date(log.createdAt))}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Outbound notification queue card
// ---------------------------------------------------------------------------

function OutboundQueueCard({
  data,
  loading,
}: {
  data: DashboardResult['system']['notificationQueue'] | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Send size={13} className="text-primary" />
          <span className="text-sm font-medium text-foreground">Outbound Queue</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-md bg-background border border-border p-3 flex flex-col gap-0.5">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60">Total</span>
          {loading ? (
            <div className="h-7 w-10 rounded bg-border/50 animate-pulse" />
          ) : (
            <span className="text-xl font-bold text-foreground tabular-nums">{data?.total ?? '—'}</span>
          )}
        </div>
        <div className="rounded-md bg-background border border-border p-3 flex flex-col gap-0.5">
          <span className="text-[9px] uppercase tracking-widest text-amber-500/80">Pending</span>
          {loading ? (
            <div className="h-7 w-10 rounded bg-border/50 animate-pulse" />
          ) : (
            <span className="text-xl font-bold text-amber-500 tabular-nums">{data?.pending ?? '—'}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pending actions card
// ---------------------------------------------------------------------------

function PendingActionsCard({
  data,
  loading,
}: {
  data: DashboardResult['system']['pendingActions'] | null;
  loading: boolean;
}) {
  const count = data?.pending ?? 0;

  return (
    <div className={cn('rounded-lg border p-4 relative overflow-hidden', 'bg-primary/10 border-primary/20')}>
      <div className="absolute right-3 top-3 opacity-10 pointer-events-none">
        <Zap size={52} className="text-primary" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-3">
          <ClipboardList size={13} className="text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/80">
            Pending Actions
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            {loading ? (
              <div className="h-10 w-12 rounded bg-primary/20 animate-pulse mb-1" />
            ) : (
              <>
                <p className="text-4xl font-bold text-foreground tabular-nums leading-none">{count}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {count === 1 ? 'action awaiting' : 'actions awaiting'} approval
                </p>
              </>
            )}
          </div>
          <CheckCircle size={28} className="text-primary/30 mb-1" />
        </div>

        <button
          className={cn(
            'mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary',
            'hover:text-primary/80 transition-colors',
          )}
        >
          Resolve Now
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
