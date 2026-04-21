import { FormEvent, useMemo, useState } from 'react';
import { CheckboxRow, TextAreaField, TextField } from '../components/fields';
import { AdminButton } from '../components/buttons';

type RuleRow = {
  entityPattern: string;
  enabled: boolean;
  instruction: string;
  rolesCsv: string;
};

function splitRoles(csv: string): string[] {
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function rulesFromPayload(raw: unknown): RuleRow[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((r) => {
    const o = r && typeof r === 'object' ? (r as Record<string, unknown>) : {};
    const roles = Array.isArray(o.rolesToNotify) ? (o.rolesToNotify as string[]).join(', ') : '';
    return {
      entityPattern: typeof o.entityPattern === 'string' ? o.entityPattern : '',
      enabled: o.enabled !== false,
      instruction: typeof o.instruction === 'string' ? o.instruction : '',
      rolesCsv: roles,
    };
  });
}

export type DeviceMutationFormProps = {
  formId: string;
  initialPayload: Record<string, unknown>;
  disabled: boolean;
  error: string | null;
  /** When true, show Active toggle and send `active` on submit (PATCH). */
  includeActive: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
};

export function DeviceMutationForm({
  formId,
  initialPayload,
  disabled,
  error,
  includeActive,
  onSubmit,
}: DeviceMutationFormProps) {
  const [deviceIdSlug, setDeviceIdSlug] = useState(() => String(initialPayload.deviceIdSlug ?? ''));
  const [friendlyName, setFriendlyName] = useState(() => String(initialPayload.friendlyName ?? ''));
  const [haEntityId, setHaEntityId] = useState(() => {
    const v = initialPayload.haEntityId;
    return v == null || v === '' ? '' : String(v);
  });
  const [visibleCsv, setVisibleCsv] = useState(() => splitRoles(Array.isArray(initialPayload.visibleToRoles) ? (initialPayload.visibleToRoles as string[]).join(', ') : '').join(', '));
  const [rules, setRules] = useState<RuleRow[]>(() => {
    const fromArray = rulesFromPayload(initialPayload.notificationGuidance);
    if (fromArray.length > 0) {
      return fromArray;
    }
    return [{ entityPattern: '', enabled: true, instruction: '', rolesCsv: '' }];
  });
  const [metadataJson, setMetadataJson] = useState(() =>
    JSON.stringify(initialPayload.metadata && typeof initialPayload.metadata === 'object' ? initialPayload.metadata : {}, null, 2),
  );
  const [active, setActive] = useState(() => initialPayload.active !== false);
  const [localError, setLocalError] = useState<string | null>(null);

  const combinedError = error ?? localError;

  const canEditSlug = useMemo(() => !includeActive || String(initialPayload.deviceIdSlug ?? '') === '', [includeActive, initialPayload.deviceIdSlug]);

  function addRule() {
    setRules((r) => [...r, { entityPattern: '', enabled: true, instruction: '', rolesCsv: '' }]);
  }

  function removeRule(index: number) {
    setRules((r) => (r.length <= 1 ? r : r.filter((_, i) => i !== index)));
  }

  function updateRule(index: number, patch: Partial<RuleRow>) {
    setRules((r) => r.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    let metadata: Record<string, unknown>;
    try {
      metadata = JSON.parse(metadataJson) as Record<string, unknown>;
      if (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata)) {
        throw new Error('Metadata must be a JSON object.');
      }
    } catch {
      setLocalError('Metadata must be valid JSON (an object).');
      return;
    }

    const trimmedSlug = deviceIdSlug.trim();
    const trimmedName = friendlyName.trim();
    if (!trimmedSlug || !trimmedName) {
      setLocalError('Device slug and friendly name are required.');
      return;
    }

    const notificationGuidance = rules.map((row) => {
      const rolesToNotify = splitRoles(row.rolesCsv);
      return {
        ...(row.entityPattern.trim() ? { entityPattern: row.entityPattern.trim() } : {}),
        enabled: row.enabled,
        instruction: row.instruction.trim(),
        ...(rolesToNotify.length ? { rolesToNotify } : {}),
      };
    });

    const payload: Record<string, unknown> = {
      deviceIdSlug: trimmedSlug,
      friendlyName: trimmedName,
      haEntityId: haEntityId.trim() ? haEntityId.trim() : null,
      visibleToRoles: splitRoles(visibleCsv),
      notificationGuidance,
      metadata,
    };
    if (includeActive) {
      payload.active = active;
    }
    onSubmit(payload);
  }

  return (
    <form id={formId} className="space-y-5" onSubmit={handleSubmit}>
      <TextField
        id={`${formId}-slug`}
        label="Device slug"
        hint="Stable id, e.g. litter_robot_4"
        value={deviceIdSlug}
        disabled={disabled || !canEditSlug}
        onChange={(e) => setDeviceIdSlug(e.target.value)}
        required
      />
      <TextField
        id={`${formId}-name`}
        label="Friendly name"
        value={friendlyName}
        disabled={disabled}
        onChange={(e) => setFriendlyName(e.target.value)}
        required
      />
      <TextField
        id={`${formId}-ha`}
        label="Home Assistant entity id"
        hint="Optional, e.g. sensor.litter_robot_waste_drawer"
        value={haEntityId}
        disabled={disabled}
        onChange={(e) => setHaEntityId(e.target.value)}
      />
      <TextField
        id={`${formId}-roles`}
        label="Visible to roles"
        hint="Comma-separated, e.g. admin, parent"
        value={visibleCsv}
        disabled={disabled}
        onChange={(e) => setVisibleCsv(e.target.value)}
      />

      <div className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
            Notification guidance
          </span>
          <AdminButton type="button" variant="ghost" className="!py-1 !px-2 text-xs" disabled={disabled} onClick={addRule}>
            Add rule
          </AdminButton>
        </div>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Each rule can match an HA entity id substring (optional) and carries the instruction the notifier should follow.
        </p>
        <ul className="space-y-4">
          {rules.map((row, index) => (
            <li
              key={index}
              className="rounded-lg border p-3 space-y-3"
              style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                  Rule {index + 1}
                </span>
                <AdminButton
                  type="button"
                  variant="ghost"
                  className="!py-1 !px-2 text-xs text-red-600 dark:text-red-400"
                  disabled={disabled || rules.length <= 1}
                  onClick={() => removeRule(index)}
                >
                  Remove
                </AdminButton>
              </div>
              <TextField
                id={`${formId}-rule-${index}-pattern`}
                label="Entity pattern"
                hint="Optional substring of entity_id, e.g. waste_drawer"
                value={row.entityPattern}
                disabled={disabled}
                onChange={(e) => updateRule(index, { entityPattern: e.target.value })}
              />
              <TextField
                id={`${formId}-rule-${index}-instruction`}
                label="Instruction"
                hint="When / how to notify for this pattern"
                value={row.instruction}
                disabled={disabled}
                onChange={(e) => updateRule(index, { instruction: e.target.value })}
              />
              <TextField
                id={`${formId}-rule-${index}-roles`}
                label="Roles to notify (optional)"
                hint="Comma-separated; leave empty to fall back to device visible roles"
                value={row.rolesCsv}
                disabled={disabled}
                onChange={(e) => updateRule(index, { rolesCsv: e.target.value })}
              />
              <CheckboxRow
                id={`${formId}-rule-${index}-enabled`}
                label="Enabled"
                checked={row.enabled}
                disabled={disabled}
                onChange={(checked) => updateRule(index, { enabled: checked })}
              />
            </li>
          ))}
        </ul>
      </div>

      <TextAreaField
        id={`${formId}-metadata`}
        label="Metadata (JSON object)"
        rows={5}
        value={metadataJson}
        disabled={disabled}
        onChange={(e) => setMetadataJson(e.target.value)}
        className="font-mono text-xs"
      />

      {includeActive ? (
        <CheckboxRow id={`${formId}-active`} label="Active" checked={active} disabled={disabled} onChange={setActive} />
      ) : null}

      {combinedError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {combinedError}
        </div>
      ) : null}

      {/* Native submit for dialog footer `form={formId}` */}
      <button type="submit" className="sr-only" tabIndex={-1} disabled={disabled}>
        Submit
      </button>
    </form>
  );
}
