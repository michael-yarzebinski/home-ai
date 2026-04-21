import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type FieldRootProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

/** Exported for composed fields (e.g. role + datalist) outside this file. */
export function FieldGroup({ label, htmlFor, hint, error, children }: FieldRootProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium" style={{ color: 'var(--fg)' }}>
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {hint}
        </p>
      ) : null}
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}

export const adminInputClass =
  'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--card)] bg-transparent';

const inputClass = adminInputClass;

type TextFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ id, label, hint, error, className = '', ...rest }: TextFieldProps) {
  return (
    <FieldGroup label={label} htmlFor={id} hint={hint} error={error}>
      <input id={id} className={`${inputClass} ${className}`.trim()} aria-invalid={!!error} {...rest} />
    </FieldGroup>
  );
}

type TextAreaFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({ id, label, hint, error, className = '', rows = 3, ...rest }: TextAreaFieldProps) {
  return (
    <FieldGroup label={label} htmlFor={id} hint={hint} error={error}>
      <textarea
        id={id}
        rows={rows}
        className={`${inputClass} resize-y min-h-[4.5rem] ${className}`.trim()}
        aria-invalid={!!error}
        {...rest}
      />
    </FieldGroup>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'>;

export function SelectField({ id, label, hint, error, children, className = '', ...rest }: SelectFieldProps) {
  return (
    <FieldGroup label={label} htmlFor={id} hint={hint} error={error}>
      <select id={id} className={`${inputClass} ${className}`.trim()} aria-invalid={!!error} {...rest}>
        {children}
      </select>
    </FieldGroup>
  );
}

type CheckboxRowProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

/** Checkbox with label to the right (single control). */
export function CheckboxRow({ id, label, hint, error, checked, onChange, disabled }: CheckboxRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border accent-[var(--accent)]"
          style={{ borderColor: 'var(--border)' }}
          aria-invalid={!!error}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        <label htmlFor={id} className="text-sm font-medium cursor-pointer select-none" style={{ color: 'var(--fg)' }}>
          {label}
        </label>
      </div>
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs pl-7" style={{ color: 'var(--muted)' }}>
          {hint}
        </p>
      ) : null}
      {error ? <p className="text-xs text-red-600 dark:text-red-400 pl-7">{error}</p> : null}
    </div>
  );
}
