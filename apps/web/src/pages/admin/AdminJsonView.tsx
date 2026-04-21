import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api';

type Props = {
  title: string;
  apiPath: string;
  description?: string;
  /** When set, loads via `POST` with this JSON body instead of `GET`. */
  postBody?: Record<string, unknown>;
};

export function AdminJsonView({ title, apiPath, description, postBody }: Props) {
  const q = useQuery({
    queryKey: ['admin', apiPath, postBody ?? '_GET'],
    queryFn: async () => {
      const res =
        postBody !== undefined
          ? await apiFetch(apiPath, {
              method: 'POST',
              body: JSON.stringify(postBody),
            })
          : await apiFetch(apiPath);
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || res.statusText);
      }
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return text;
      }
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <code className="text-xs font-mono opacity-80 break-all">{apiPath}</code>
      </div>
      {description && (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {description}
        </p>
      )}
      {q.isPending && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
      {q.isError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {q.error instanceof Error ? q.error.message : 'Request failed'}
        </p>
      )}
      {q.isSuccess && (
        <pre
          className="rounded-xl border p-3 overflow-auto text-xs font-mono max-h-[calc(100vh-14rem)]"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          {typeof q.data === 'string' ? q.data : JSON.stringify(q.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
