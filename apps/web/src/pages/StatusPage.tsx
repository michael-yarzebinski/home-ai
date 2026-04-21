import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api';

export function StatusPage() {
  const q = useQuery({
    queryKey: ['status', 'summary'],
    queryFn: async () => {
      const res = await apiFetch('/api/status/summary');
      if (!res.ok) {
        throw new Error(await res.text());
      }
      return res.json() as Promise<{
        status: string;
        serverTime: string;
        uptimeSeconds: number;
        services: Record<string, string>;
        facts: { key: string; value: string }[];
      }>;
    },
    refetchInterval: 15_000,
  });

  if (q.isPending) {
    return <p style={{ color: 'var(--muted)' }}>Loading status…</p>;
  }
  if (q.isError) {
    return (
      <p className="text-red-600 dark:text-red-400">
        {q.error instanceof Error ? q.error.message : 'Failed to load'}
      </p>
    );
  }

  const d = q.data!;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">System status</h1>
      <div
        className="grid gap-4 sm:grid-cols-2 rounded-xl border p-4"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            Overall
          </div>
          <div className="text-xl font-medium">{d.status}</div>
        </div>
        <div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            Server time
          </div>
          <div className="font-mono text-sm">{d.serverTime}</div>
        </div>
        <div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            Uptime (s)
          </div>
          <div>{d.uptimeSeconds}</div>
        </div>
        <div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            Database
          </div>
          <div>{d.services.database}</div>
        </div>
      </div>
      <section>
        <h2 className="text-lg font-medium mb-2">Public facts</h2>
        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
          Set env <code className="font-mono">STATUS_PUBLIC_FACT_KEYS</code> on the server (comma-separated
          fact keys) to show curated rows here.
        </p>
        {d.facts.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No facts in the public allowlist.</p>
        ) : (
          <ul className="space-y-2">
            {d.facts.map((f) => (
              <li
                key={f.key}
                className="rounded-lg border px-3 py-2"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="font-mono text-sm" style={{ color: 'var(--accent)' }}>
                  {f.key}
                </span>
                <div className="mt-1">{f.value}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
