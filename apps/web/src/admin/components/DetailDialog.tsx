import { useEffect, useId, useRef, type ReactNode } from 'react';

type DetailDialogProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function DetailDialog({ open, title, subtitle, onClose, children, footer }: DetailDialogProps) {
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
      className="max-w-2xl w-[calc(100%-2rem)] rounded-xl border p-0 shadow-xl backdrop:bg-black/40"
      style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--fg)' }}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[min(90vh,760px)] flex-col">
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
        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t px-5 py-3" style={{ borderColor: 'var(--border)' }}>
          {footer}
        </div>
      </div>
    </dialog>
  );
}
