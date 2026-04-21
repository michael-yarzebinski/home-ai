import type { ReactNode } from 'react';

type AdminPanelProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * Shared page chrome for admin entity screens (title, optional description, toolbar).
 */
export function AdminPanel({ title, description, actions, children }: AdminPanelProps) {
  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-balance" style={{ color: 'var(--fg)' }}>
            {title}
          </h2>
          {description ? (
            <p className="text-sm max-w-2xl text-pretty" style={{ color: 'var(--muted)' }}>
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}
