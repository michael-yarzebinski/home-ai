import type { ButtonHTMLAttributes } from 'react';

const base =
  'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50 disabled:pointer-events-none';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
};

export function AdminButton({ variant = 'primary', className = '', type = 'button', ...rest }: ButtonProps) {
  const styles =
    variant === 'primary'
      ? 'text-white shadow-sm hover:opacity-95'
      : variant === 'danger'
        ? 'bg-red-600 text-white hover:bg-red-700'
        : 'border border-transparent hover:bg-black/5 dark:hover:bg-white/10';

  const bg =
    variant === 'primary'
      ? { background: 'var(--accent)' }
      : variant === 'danger'
        ? undefined
        : { color: 'var(--fg)' };

  return <button type={type} className={`${base} ${styles} ${className}`.trim()} style={bg} {...rest} />;
}
