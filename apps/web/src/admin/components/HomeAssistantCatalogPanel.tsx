import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminPanel } from './AdminPanel';
import { AdminButton } from './buttons';
import { TextField } from './fields';
import { DataTable, type Column } from './DataTable';
import { apiFetch } from '../../api';
import { parseApiError } from '../lib/parseApiError';

type HaEntityRow = {
  entityId: string;
  friendlyName?: string;
  state?: string;
  deviceClass?: string;
};

type HaEntitiesResponse = {
  entities: HaEntityRow[];
  total?: number;
};

type HaWebUiResponse = {
  url: string | null;
};

async function fetchJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) {
    throw new Error(await parseApiError(res));
  }
  return (await res.json()) as T;
}

export function HomeAssistantCatalogPanel() {
  const [filter, setFilter] = useState('');

  const webUiQuery = useQuery({
    queryKey: ['admin-ha-web-ui'],
    queryFn: () => fetchJson<HaWebUiResponse>('/api/admin/home-assistant/web-ui'),
    staleTime: 60_000,
  });

  const entitiesQuery = useQuery({
    queryKey: ['admin-ha-entities'],
    queryFn: () => fetchJson<HaEntitiesResponse>('/api/admin/home-assistant/entities'),
    staleTime: 15_000,
  });

  const rows = useMemo(() => {
    const list = entitiesQuery.data?.entities ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) {
      return list;
    }
    return list.filter(
      (r) =>
        r.entityId.toLowerCase().includes(q) ||
        (r.friendlyName?.toLowerCase().includes(q) ?? false) ||
        (r.state?.toLowerCase().includes(q) ?? false),
    );
  }, [entitiesQuery.data?.entities, filter]);

  const columns: Column<HaEntityRow>[] = useMemo(
    () => [
      {
        id: 'entityId',
        header: 'Entity ID',
        cell: (r) => <span className="font-mono text-xs">{r.entityId}</span>,
      },
      {
        id: 'name',
        header: 'Friendly name',
        cell: (r) => r.friendlyName ?? '—',
      },
      {
        id: 'state',
        header: 'State',
        cell: (r) => <span className="font-mono text-xs">{r.state ?? '—'}</span>,
      },
      {
        id: 'deviceClass',
        header: 'Device class',
        cell: (r) => r.deviceClass ?? '—',
      },
    ],
    [],
  );

  const haUrl = webUiQuery.data?.url ?? null;

  return (
    <AdminPanel
      title="Home Assistant"
      description="Live entity catalog from your Home Assistant connection (read-only). Use it to pick entity IDs when you register devices below."
      actions={
        <>
          {haUrl ? (
            <a
              href={haUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
            >
              Open Home Assistant
            </a>
          ) : (
            <span className="text-sm" style={{ color: 'var(--muted)' }}>
              Set HOME_ASSISTANT_URL in the server environment to enable the link.
            </span>
          )}
          <TextField
            id="ha-entity-filter"
            label="Filter entities"
            placeholder="Filter by id, name, or state"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <AdminButton type="button" variant="ghost" disabled={entitiesQuery.isFetching} onClick={() => void entitiesQuery.refetch()}>
            {entitiesQuery.isFetching ? 'Refreshing…' : 'Refresh'}
          </AdminButton>
        </>
      }
    >
      {entitiesQuery.isError ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {entitiesQuery.error instanceof Error ? entitiesQuery.error.message : 'Failed to load Home Assistant entities'}
        </div>
      ) : null}
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        Showing {rows.length} of {entitiesQuery.data?.entities?.length ?? 0} loaded entities.
        {entitiesQuery.data?.entities?.length === 0 && !entitiesQuery.isPending ? (
          <span> If the list is empty, confirm the server can reach Home Assistant and that the WebSocket connection succeeded.</span>
        ) : null}
      </p>
      <DataTable<HaEntityRow>
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.entityId}
        emptyMessage="No entities match the filter (or Home Assistant has not sent any yet)."
        isLoading={entitiesQuery.isPending}
      />
    </AdminPanel>
  );
}
