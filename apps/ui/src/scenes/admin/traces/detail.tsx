import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, GitBranch, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { TurnTraceDetail } from '@home-ai/shared/domain/monitoring/trace/trace';
import type { Log } from '@home-ai/shared/domain/monitoring/log/log';
import type { AIAudit } from '@home-ai/shared/domain/monitoring/ai-audit/ai-audit';

type TimelineItem =
  | { kind: 'log'; at: number; log: Log }
  | { kind: 'audit'; at: number; audit: AIAudit };

export function TraceDetail() {
  const { traceId } = useParams<{ traceId: string }>();
  const [detail, setDetail] = useState<TurnTraceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [hideDebug, setHideDebug] = useState(true);
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    if (!traceId) return;
    setLoading(true);
    setError(null);
    void api
      .get<TurnTraceDetail>(`/v1/admin/traces/${encodeURIComponent(traceId)}`)
      .then(setDetail)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [traceId]);

  const timeline = useMemo(() => {
    if (!detail) return [];
    const items: TimelineItem[] = [
      ...detail.logs.map((log) => ({
        kind: 'log' as const,
        at: new Date(log.createdAt).getTime(),
        log,
      })),
      ...detail.audits.map((audit) => ({
        kind: 'audit' as const,
        at: new Date(audit.createdAt).getTime(),
        audit,
      })),
    ];
    return items.sort((a, b) => a.at - b.at);
  }, [detail]);

  const debugCount = useMemo(
    () => timeline.filter((item) => item.kind === 'log' && isDebugLog(item.log)).length,
    [timeline],
  );

  const visibleTimeline = useMemo(
    () =>
      hideDebug
        ? timeline.filter((item) => item.kind !== 'log' || !isDebugLog(item.log))
        : timeline,
    [timeline, hideDebug],
  );

  const copyId = async () => {
    if (!traceId) return;
    await navigator.clipboard.writeText(traceId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
        <Link
          to="/traces"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft size={12} /> All traces
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 flex-shrink-0">
              <GitBranch className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold leading-tight">Turn trace</h1>
              <p className="font-mono text-[11px] text-muted-foreground mt-0.5 break-all">
                {traceId}
              </p>
            </div>
          </div>
          {traceId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs flex-shrink-0"
              onClick={() => void copyId()}
            >
              {copied ? (
                <Check size={12} className="mr-1.5" />
              ) : (
                <Copy size={12} className="mr-1.5" />
              )}
              {copied ? 'Copied' : 'Copy id'}
            </Button>
          )}
        </div>
        {detail && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mt-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span>{formatSpan(detail.startedAt, detail.endedAt)}</span>
                <span>
                  {detail.logCount} log{detail.logCount === 1 ? '' : 's'}
                </span>
                <span>
                  {detail.auditCount} LLM
                </span>
                {detail.errorCount > 0 ? (
                  <span className="text-destructive font-medium">
                    {detail.errorCount} error{detail.errorCount === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span>0 errors</span>
                )}
              </div>
              {debugCount > 0 && (
                <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                  <Switch checked={hideDebug} onCheckedChange={setHideDebug} />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Hide debug ({debugCount})
                  </span>
                </label>
              )}
            </div>
            {detail.prompt ? (
              <div className="mt-3 max-w-3xl">
                <p
                  className={
                    promptOpen
                      ? 'text-sm text-foreground/90 whitespace-pre-wrap break-words'
                      : 'text-sm text-foreground/90 whitespace-pre-wrap break-words line-clamp-3'
                  }
                >
                  {detail.prompt}
                </p>
                {detail.prompt.length > 220 && (
                  <button
                    type="button"
                    className="text-[11px] text-muted-foreground mt-1.5 hover:underline"
                    onClick={() => setPromptOpen((v) => !v)}
                  >
                    {promptOpen ? 'Hide prompt' : 'Show full prompt'}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm mt-3 text-muted-foreground">
                No LLM prompt recorded for this turn.
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events in this turn.</p>
        ) : visibleTimeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events match this filter.</p>
        ) : (
          <ol className="space-y-3 max-w-3xl">
            {visibleTimeline.map((item, i) =>
              item.kind === 'log' ? (
                <LogRow key={`log-${item.log.id}-${i}`} log={item.log} />
              ) : (
                <AuditRow key={`audit-${item.audit.id}-${i}`} audit={item.audit} />
              ),
            )}
          </ol>
        )}
      </div>
    </div>
  );
}

function LogRow({ log }: { log: Log }) {
  const [open, setOpen] = useState(false);
  const metadata = hasContent(log.metadata);
  return (
    <li className="rounded-md border border-border p-3">
      <div className="flex items-center gap-2 mb-1">
        <Badge variant={String(log.severity).toLowerCase().includes('error') ? 'destructive' : 'secondary'}>
          {log.severity}
        </Badge>
        <span className="text-[11px] text-muted-foreground">
          {new Date(log.createdAt).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-sm">{log.message}</p>
      {metadata && (
        <>
          <button
            type="button"
            className="text-[11px] text-muted-foreground mt-2 hover:underline"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Hide metadata' : 'Show metadata'}
          </button>
          {open && (
            <pre className="mt-2 text-[11px] overflow-auto rounded bg-muted p-2">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          )}
        </>
      )}
    </li>
  );
}

function AuditRow({ audit }: { audit: AIAudit }) {
  const [open, setOpen] = useState(false);
  const toolCalls = hasContent(audit.toolCalls);
  return (
    <li className="rounded-md border border-border p-3 bg-card">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <Badge variant={audit.success ? 'default' : 'destructive'}>
          LLM {audit.success ? 'ok' : 'failed'}
        </Badge>
        {audit.durationMs != null && (
          <span className="text-[11px] text-muted-foreground">{audit.durationMs}ms</span>
        )}
        {audit.model && (
          <span className="text-[11px] text-muted-foreground">{audit.model}</span>
        )}
        <span className="text-[11px] text-muted-foreground">
          {new Date(audit.createdAt).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-sm whitespace-pre-wrap">{audit.finalResponse || '—'}</p>
      {toolCalls && (
        <>
          <button
            type="button"
            className="text-[11px] text-muted-foreground mt-2 hover:underline"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Hide tool calls' : 'Show tool calls'}
          </button>
          {open && (
            <pre className="mt-2 text-[11px] overflow-auto rounded bg-muted p-2">
              {JSON.stringify(audit.toolCalls, null, 2)}
            </pre>
          )}
        </>
      )}
    </li>
  );
}

function isDebugLog(log: Log): boolean {
  return String(log.severity).toLowerCase() === 'debug';
}

function hasContent(value: unknown): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

function formatSpan(startedAt: Date | string, endedAt: Date | string): string {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const ms = Math.max(0, end.getTime() - start.getTime());
  const duration =
    ms < 1000 ? `${ms}ms` : ms < 60_000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms / 1000)}s`;
  return `${start.toLocaleTimeString()} · ${duration}`;
}
