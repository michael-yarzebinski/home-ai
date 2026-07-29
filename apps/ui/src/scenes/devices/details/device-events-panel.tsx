import { useEffect } from 'react';
import type { DeviceEvent } from '@home-ai/shared/domain/device/device-event';
import { useInView } from 'react-intersection-observer';
import { Activity, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/date.utils';
import { cn } from '@/lib/utils';

interface DeviceEventsPanelProps {
  events: DeviceEvent[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function DeviceEventsPanel({
  events,
  total,
  isLoading,
  isError,
  error,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: DeviceEventsPanelProps) {
  const { ref, inView } = useInView({ threshold: 0.1 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isLoading) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  return (
    <Card className="flex h-full max-h-[min(32rem,70vh)] flex-col lg:max-h-none">
      <CardHeader className="shrink-0 space-y-2 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 shrink-0 text-muted-foreground" />
          <CardTitle className="text-sm font-bold uppercase tracking-widest">Events</CardTitle>
        </div>
        <div className="flex items-center justify-between gap-2">
          <CardDescription className="text-xs">Recent state changes</CardDescription>
          {!isLoading && total > 0 && (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {events.length}/{total}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading events…
          </div>
        ) : isError ? (
          <p className="py-4 text-sm text-destructive">{error?.message ?? 'Failed to load events.'}</p>
        ) : events.length === 0 ? (
          <p className="py-4 text-xs italic text-muted-foreground">No events recorded yet.</p>
        ) : (
          <>
            {events.map((event) => (
              <div
                key={event.id}
                className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2"
              >
                <span className="block break-all font-mono text-[10px] leading-snug text-foreground">
                  {event.entityId}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {formatDate(event.createdAt, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {event.oldState != null && event.oldState !== '' ? (
                    <>
                      <Badge variant="outline" className="px-1.5 py-0 font-mono text-[10px] font-normal">
                        {event.oldState}
                      </Badge>
                      <span className="text-xs text-muted-foreground">→</span>
                    </>
                  ) : null}
                  <Badge variant="secondary" className="px-1.5 py-0 font-mono text-[10px] font-normal">
                    {event.newState}
                  </Badge>
                </div>
                {event.metadata != null &&
                  typeof event.metadata === 'object' &&
                  Object.keys(event.metadata as object).length > 0 && (
                    <pre
                      className={cn(
                        'max-h-16 overflow-x-auto rounded border border-border/30 bg-background/50 p-1.5',
                        'font-mono text-[9px] text-muted-foreground',
                      )}
                    >
                      {JSON.stringify(event.metadata, null, 2)}
                    </pre>
                  )}
              </div>
            ))}

            <div ref={ref} className="flex justify-center py-3">
              {isFetchingNextPage && (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
