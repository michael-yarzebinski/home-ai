import { FormEvent, useMemo, useState } from 'react';
import { TextField, CheckboxRow, FieldGroup, adminInputClass } from '../components/fields';
import { ROLE_OPTIONS } from './userFormConstants';
import type { UserPublic } from './types';
import { toTimeInputValue } from '../lib/timeInput';

const formId = 'admin-user-form';

export type UserFormProps = {
  mode: 'create' | 'edit';
  /** When editing, pass the loaded user (drives defaults). */
  user?: UserPublic | null;
  /** Disable inputs while save request is in flight. */
  disabled?: boolean;
  apiError: string | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
};

export function UserForm({ mode, user, disabled = false, apiError, onSubmit }: UserFormProps) {
  const defaults = useMemo(() => {
    if (mode === 'create') {
      return {
        name: '',
        role: 'parent',
        messagingId: '',
        quietStart: '',
        quietEnd: '',
        accessCode: '',
        active: true,
      };
    }
    return {
      name: user?.name ?? '',
      role: user?.role ?? 'parent',
      messagingId: user?.messagingId ?? '',
      quietStart: toTimeInputValue(user?.quietStart ?? undefined),
      quietEnd: toTimeInputValue(user?.quietEnd ?? undefined),
      accessCode: '',
      active: user?.active ?? true,
    };
  }, [mode, user]);

  const [name, setName] = useState(defaults.name);
  const [role, setRole] = useState(defaults.role);
  const [messagingId, setMessagingId] = useState(defaults.messagingId);
  const [quietStart, setQuietStart] = useState(defaults.quietStart);
  const [quietEnd, setQuietEnd] = useState(defaults.quietEnd);
  const [accessCode, setAccessCode] = useState(defaults.accessCode);
  const [active, setActive] = useState(defaults.active);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    if (mode === 'create') {
      const plain: Record<string, unknown> = {
        name,
        role,
        messagingId,
        quietStart,
        quietEnd,
        accessCode,
      };
      if (!String(name).trim()) {
        setFieldErrors({ name: 'Name is required' });
        return;
      }
      if (!String(role).trim()) {
        setFieldErrors({ role: 'Role is required' });
        return;
      }
      if (String(accessCode).trim().length < 5) {
        setFieldErrors({ accessCode: 'Access code must be at least 5 characters' });
        return;
      }
      const body: Record<string, unknown> = {
        name: String(plain.name ?? ''),
        role: String(plain.role ?? ''),
        messagingId: String(plain.messagingId ?? ''),
        accessCode: String(plain.accessCode ?? ''),
      };
      if (plain.quietStart) {
        body.quietStart = plain.quietStart;
      }
      if (plain.quietEnd) {
        body.quietEnd = plain.quietEnd;
      }
      await onSubmit(body);
    } else {
      const plain: Record<string, unknown> = {
        name,
        role,
        messagingId,
        quietStart,
        quietEnd,
        accessCode,
        active,
      };
      if (!String(name).trim()) {
        setFieldErrors({ name: 'Name is required' });
        return;
      }
      if (!String(role).trim()) {
        setFieldErrors({ role: 'Role is required' });
        return;
      }
      if (String(accessCode).trim() && String(accessCode).trim().length < 5) {
        setFieldErrors({ accessCode: 'New access code must be at least 5 characters' });
        return;
      }
      const body: Record<string, unknown> = {
        name: String(plain.name ?? ''),
        role: String(plain.role ?? ''),
        messagingId: String(plain.messagingId ?? ''),
        active: Boolean(plain.active),
      };
      if (plain.quietStart != null) {
        body.quietStart = plain.quietStart;
      } else {
        body.quietStart = null;
      }
      if (plain.quietEnd != null) {
        body.quietEnd = plain.quietEnd;
      } else {
        body.quietEnd = null;
      }
      const trimmed = String(plain.accessCode ?? '').trim();
      if (trimmed.length > 0) {
        body.accessCode = trimmed;
      }
      await onSubmit(body);
    }
  }

  return (
    <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
      {apiError ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {apiError}
        </div>
      ) : null}

      <TextField
        id="user-name"
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
        disabled={disabled}
        error={fieldErrors.name}
      />

      <FieldRoleInput
        id="user-role"
        value={role}
        onChange={setRole}
        disabled={disabled}
        error={fieldErrors.role}
      />

      <TextField
        id="user-messaging"
        label="Messaging ID"
        value={messagingId}
        onChange={(e) => setMessagingId(e.target.value)}
        disabled={disabled}
        error={fieldErrors.messagingId}
        hint="e.g. phone or handle used for iMessage routing. Leave blank if unused."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="user-quiet-start"
          label="Quiet hours start"
          type="time"
          value={quietStart}
          onChange={(e) => setQuietStart(e.target.value)}
          disabled={disabled}
          error={fieldErrors.quietStart}
        />
        <TextField
          id="user-quiet-end"
          label="Quiet hours end"
          type="time"
          value={quietEnd}
          onChange={(e) => setQuietEnd(e.target.value)}
          disabled={disabled}
          error={fieldErrors.quietEnd}
        />
      </div>

      {mode === 'create' ? (
        <TextField
          id="user-access-create"
          label="Access code"
          type="password"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          disabled={disabled}
          error={fieldErrors.accessCode}
          hint="Minimum 5 characters. Used for web admin / chat sign-in."
          autoComplete="new-password"
        />
      ) : (
        <>
          <CheckboxRow
            id="user-active"
            label="Account active"
            checked={active}
            onChange={setActive}
            disabled={disabled}
            error={fieldErrors.active}
          />
          <TextField
            id="user-access-edit"
            label="New access code (optional)"
            type="password"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            disabled={disabled}
            error={fieldErrors.accessCode}
            hint="Leave blank to keep the current code. Minimum 5 characters when set."
            autoComplete="new-password"
          />
        </>
      )}
    </form>
  );
}

export const USER_FORM_ID = formId;

function FieldRoleInput({
  id,
  value,
  onChange,
  disabled,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const listId = `${id}-roles`;
  return (
    <FieldGroup
      label="Role"
      htmlFor={id}
      hint="Pick a suggestion or type any role string used by tasks (e.g. parent, automation)."
      error={error}
    >
      <input
        id={id}
        list={listId}
        className={adminInputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={!!error}
      />
      <datalist id={listId}>
        {ROLE_OPTIONS.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
    </FieldGroup>
  );
}
