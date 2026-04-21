import { useEffect, useId, useRef, type ReactNode } from 'react';

export type CrudDialogProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  /** Main body (typically a `<form id={formId}>`). */
  children: ReactNode;
  /** Actions row (Cancel / Save). Use `form={formId}` on submit buttons when the form wraps only fields. */
  footer: ReactNode;
  /** Shared `id` between `<form id>` and submit button `form` attribute. */
  formId: string;
  /** When true, dialog cannot be dismissed and footer should show loading. */
  busy?: boolean;
  /** Tailwind max-width token for wide forms (e.g. `max-w-2xl`). Defaults to `max-w-lg`. */
  maxWidthClass?: string;
};

/**
 * Modal shell for create/edit flows. Uses native `<dialog>` for focus handling and a11y.
 * Pattern: reuse for other entities with the same header + body + footer layout.
 */
export function CrudDialog({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  formId,
  busy = false,
  maxWidthClass = 'max-w-lg',
}: CrudDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (open) {
      if (!el.open) {
        el.showModal();
      }
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      data-form-target={formId}
      className={`admin-crud-dialog ${maxWidthClass} w-[calc(100%-2rem)] rounded-xl border p-0 shadow-xl backdrop:bg-black/40`}
      style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--fg)' }}
      aria-labelledby={titleId}
      onCancel={(e) => {
        if (busy) {
          e.preventDefault();
          return;
        }
        onClose();
      }}
      onClick={(e) => {
        if (busy) {
          return;
        }
        if (e.target === ref.current) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[min(90vh,720px)] flex-col">
        <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
          <h3 id={titleId} className="text-lg font-semibold leading-tight">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        <div
          className="flex shrink-0 flex-wrap justify-end gap-2 border-t px-5 py-3"
          style={{ borderColor: 'var(--border)' }}
        >
          {footer}
        </div>
      </div>
    </dialog>
  );
}
