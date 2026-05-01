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
import {
  MOCK_ERROR_LOGS,
  MOCK_PENDING_ACTIONS,
  NOTIFICATION_QUEUE_STATS,
} from '@/mock/dashboard';

const ERRORS_PER_PAGE = 3;

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export function SystemOperations() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 flex-shrink-0">
          <Monitor className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground leading-tight">
            System Operations
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Errors, notification queue, and pending action domains
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: Error feed — 2/3 width */}
        <div className="md:col-span-2">
          <ErrorFeed />
        </div>

        {/* Right: Queue + Pending — 1/3 width */}
        <div className="flex flex-col gap-4">
          <OutboundQueueCard />
          <PendingActionsCard />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Critical error feed
// ---------------------------------------------------------------------------

function ErrorFeed() {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(MOCK_ERROR_LOGS.length / ERRORS_PER_PAGE);
  const visible = MOCK_ERROR_LOGS.slice(page * ERRORS_PER_PAGE, (page + 1) * ERRORS_PER_PAGE);

  return (
    <div className="rounded-lg border border-border bg-card p-4 h-full flex flex-col">
      {/* Header */}
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
            aria-label="Previous page"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            aria-label="Next page"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Error list */}
      <div className="flex flex-col divide-y divide-border flex-1">
        {visible.map((log) => (
          <div key={log.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            {/* Severity dot */}
            <span
              className={cn(
                'mt-1 h-2 w-2 rounded-full flex-shrink-0',
                log.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-500',
              )}
            />

            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug">{log.message}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {/* Error code chip */}
                <span
                  className={cn(
                    'inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase',
                    log.severity === 'CRITICAL'
                      ? 'bg-red-500/15 text-red-400'
                      : 'bg-orange-500/15 text-orange-400',
                  )}
                >
                  {log.metadata.errorCode}
                </span>
                {/* Domain tag */}
                <span className="text-[10px] text-muted-foreground/60 font-medium">
                  DOMAIN: {log.metadata.domain}
                </span>
              </div>
            </div>

            {/* Time ago */}
            <span className="text-[10px] text-muted-foreground/50 flex-shrink-0 mt-0.5">
              {timeAgo(log.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Outbound notification queue card
// ---------------------------------------------------------------------------

function OutboundQueueCard() {
  const { pending, retry, activeProvider, providerActive } = NOTIFICATION_QUEUE_STATS;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Send size={13} className="text-primary" />
          <span className="text-sm font-medium text-foreground">Outbound Queue</span>
        </div>
        <span
          className={cn(
            'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded',
            providerActive
              ? 'bg-green-500/15 text-green-400'
              : 'bg-red-500/15 text-red-400',
          )}
        >
          {providerActive ? 'Active' : 'Offline'}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-md bg-background border border-border p-3 flex flex-col gap-0.5">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60">
            Pending
          </span>
          <span className="text-xl font-bold text-foreground tabular-nums">{pending}</span>
        </div>
        <div className="rounded-md bg-background border border-border p-3 flex flex-col gap-0.5">
          <span className="text-[9px] uppercase tracking-widest text-amber-500/80">Retry</span>
          <span className="text-xl font-bold text-amber-500 tabular-nums">{retry}</span>
        </div>
      </div>

      {/* Provider */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
          Active Provider
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              providerActive ? 'bg-green-500' : 'bg-red-500',
            )}
          />
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">
            {activeProvider}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pending actions card
// ---------------------------------------------------------------------------

function PendingActionsCard() {
  const count = MOCK_PENDING_ACTIONS.filter((a) => a.status === 'pending').length;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 relative overflow-hidden',
        'bg-primary/10 border-primary/20',
      )}
    >
      {/* Decorative background icon */}
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
            <p className="text-4xl font-bold text-foreground tabular-nums leading-none">
              {count}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {count === 1 ? 'action awaiting' : 'actions awaiting'} approval
            </p>
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
