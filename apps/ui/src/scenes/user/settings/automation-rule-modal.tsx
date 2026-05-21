import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  TriggerType,
  ActionType,
  type AutomationRule,
} from '@home-ai/shared/domain/automation-rule/automation-rule';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MOCK_DEVICES } from '@/mock/entity-data';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AutomationRuleModalMode = 'add' | 'edit' | 'view';

export interface AutomationRuleModalProps {
  open: boolean;
  onClose: () => void;
  mode: AutomationRuleModalMode;
  /** Existing rule when editing/viewing */
  rule?: Record<string, unknown>;
  onSave?: (data: Partial<AutomationRule>) => Promise<void>;
  onDelete?: (rule: Record<string, unknown>) => Promise<void>;
  onRestore?: (rule: Record<string, unknown>) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Flat form type (we reconstruct nested objects on submit)
// ---------------------------------------------------------------------------

interface ActionFormItem {
  tempId: string;
  type: ActionType;
  instruction: string;
  conditionOverride: string;
}

interface FormValues {
  name: string;
  description: string;
  cooldownMinutes: number | string;
  // Trigger
  triggerType: TriggerType;
  // TIME
  cron: string;
  timezone: string;
  // DEVICE
  deviceId: string;
  deviceIntent: string;
  // SYSTEM
  eventName: string;
  systemIntent: string;
  // Actions
  actions: ActionFormItem[];
}

// ---------------------------------------------------------------------------
// Zod schema — flat with superRefine for conditional trigger fields
// ---------------------------------------------------------------------------

const actionSchema = z.object({
  tempId: z.string(),
  type: z.nativeEnum(ActionType),
  instruction: z.string().min(1, 'Instruction is required'),
  conditionOverride: z.string(),
});

const schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    description: z.string(),
    cooldownMinutes: z.coerce.number().int().nonnegative('Must be ≥ 0'),
    triggerType: z.nativeEnum(TriggerType),
    cron: z.string(),
    timezone: z.string(),
    deviceId: z.string(),
    deviceIntent: z.string(),
    eventName: z.string(),
    systemIntent: z.string(),
    actions: z.array(actionSchema).min(1, 'At least one action is required'),
  })
  .superRefine((d, ctx) => {
    if (d.triggerType === TriggerType.TIME) {
      if (!d.cron.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'CRON expression is required', path: ['cron'] });
      if (!d.timezone.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Timezone is required', path: ['timezone'] });
    }
    if (d.triggerType === TriggerType.DEVICE) {
      if (!d.deviceId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Device is required', path: ['deviceId'] });
      if (!d.deviceIntent.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Intent is required', path: ['deviceIntent'] });
    }
    if (d.triggerType === TriggerType.SYSTEM) {
      if (!d.eventName.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Event name is required', path: ['eventName'] });
    }
  });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ruleToFormValues(rule: Record<string, unknown>): FormValues {
  const trigger = (rule['trigger'] as Record<string, unknown> | undefined) ?? {};
  const triggerType = (trigger['type'] as TriggerType) ?? TriggerType.TIME;

  const rawActions = Array.isArray(rule['actions']) ? (rule['actions'] as Record<string, unknown>[]) : [];
  const actions: ActionFormItem[] = rawActions.map((a, i) => ({
    tempId: String(a['id'] ?? `tmp_${i}`),
    type: (a['type'] as ActionType) ?? ActionType.NOTIFICATION,
    instruction: String(a['instruction'] ?? ''),
    conditionOverride: String(a['conditionOverride'] ?? ''),
  }));

  return {
    name: String(rule['name'] ?? ''),
    description: String(rule['description'] ?? ''),
    cooldownMinutes: Number(rule['cooldownMinutes'] ?? 60),
    triggerType,
    // TIME
    cron: triggerType === TriggerType.TIME ? String(trigger['cron'] ?? '') : '',
    timezone: triggerType === TriggerType.TIME ? String(trigger['timezone'] ?? '') : '',
    // DEVICE
    deviceId: triggerType === TriggerType.DEVICE ? String(trigger['deviceId'] ?? '') : '',
    deviceIntent: triggerType === TriggerType.DEVICE ? String(trigger['intent'] ?? '') : '',
    // SYSTEM
    eventName: triggerType === TriggerType.SYSTEM ? String(trigger['eventName'] ?? '') : '',
    systemIntent: triggerType === TriggerType.SYSTEM ? String(trigger['intent'] ?? '') : '',
    actions: actions.length > 0 ? actions : [blankAction()],
  };
}

function blankFormValues(): FormValues {
  return {
    name: '',
    description: '',
    cooldownMinutes: 60,
    triggerType: TriggerType.TIME,
    cron: '',
    timezone: 'America/Chicago',
    deviceId: '',
    deviceIntent: '',
    eventName: '',
    systemIntent: '',
    actions: [blankAction()],
  };
}

function blankAction(): ActionFormItem {
  return { tempId: `tmp_${Date.now()}_${Math.random()}`, type: ActionType.NOTIFICATION, instruction: '', conditionOverride: '' };
}

function formToRule(values: FormValues): Partial<AutomationRule> {
  let trigger: AutomationRule['trigger'];
  if (values.triggerType === TriggerType.TIME) {
    trigger = { type: TriggerType.TIME, cron: values.cron, timezone: values.timezone };
  } else if (values.triggerType === TriggerType.DEVICE) {
    trigger = { type: TriggerType.DEVICE, deviceId: values.deviceId, intent: values.deviceIntent };
  } else {
    trigger = { type: TriggerType.SYSTEM, eventName: values.eventName, intent: values.systemIntent || undefined };
  }

  return {
    name: values.name,
    description: values.description || undefined,
    cooldownMinutes: Number(values.cooldownMinutes),
    trigger,
    actions: values.actions.map((a, i) => ({
      id: a.tempId.startsWith('tmp_') ? `act_${Date.now()}_${i}` : a.tempId,
      type: a.type,
      instruction: a.instruction,
      conditionOverride: a.conditionOverride || undefined,
    })),
  };
}

/** Simple CRON human description for common patterns */
function describeCron(cron: string): string | null {
  if (!cron.trim()) return null;
  const p = cron.trim().split(/\s+/);
  if (p.length !== 5) return null;
  const [min, hour, , , dow] = p;
  const h = parseInt(hour);
  const m = parseInt(min);
  if (isNaN(h) || isNaN(m)) return null;
  const period = h >= 12 ? 'PM' : 'AM';
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const dm = m.toString().padStart(2, '0');
  const time = `${dh}:${dm} ${period}`;
  const days: Record<string, string> = {
    '*': 'every day', '1-5': 'Mon–Fri', '0-4': 'Sun–Thu', '1-7': 'every day',
    '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat',
  };
  return `${days[dow] ?? dow} at ${time}`;
}

// ---------------------------------------------------------------------------
// Pill selectors
// ---------------------------------------------------------------------------

const TRIGGER_TYPES: { value: TriggerType; label: string; description: string }[] = [
  { value: TriggerType.TIME, label: 'Time', description: 'CRON schedule' },
  { value: TriggerType.DEVICE, label: 'Device', description: 'Device event' },
  { value: TriggerType.SYSTEM, label: 'System', description: 'App event' },
];

const ACTION_TYPES: { value: ActionType; label: string }[] = [
  { value: ActionType.NOTIFICATION, label: 'Notify' },
  { value: ActionType.TASK, label: 'Task' },
  { value: ActionType.HA_SERVICE, label: 'HA Service' },
  { value: ActionType.SCRIPT, label: 'Script' },
];

const ACTION_TYPE_COLORS: Record<ActionType, string> = {
  [ActionType.NOTIFICATION]: 'border-primary text-primary bg-primary/10',
  [ActionType.TASK]: 'border-amber-500 text-amber-400 bg-amber-500/10',
  [ActionType.HA_SERVICE]: 'border-green-500 text-green-400 bg-green-500/10',
  [ActionType.SCRIPT]: 'border-purple-500 text-purple-400 bg-purple-500/10',
};

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function AutomationRuleModal({
  open, onClose, mode, rule, onSave, onDelete, onRestore,
}: AutomationRuleModalProps) {
  const isActive = rule != null ? Boolean(rule['active'] ?? true) : true;
  const isReadOnly = mode === 'edit' && !isActive;

  const defaultValues = rule ? ruleToFormValues(rule) : blankFormValues();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<FormValues, any, any>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  // Reset form whenever the modal opens with fresh data
  useEffect(() => {
    if (open) {
      form.reset(rule ? ruleToFormValues(rule) : blankFormValues());
    }
  }, [open]); // eslint-disable-line

  const { fields: actionFields, append, remove } = useFieldArray({
    control: form.control,
    name: 'actions',
    keyName: 'fieldKey',
  });

  const triggerType = form.watch('triggerType');

  const [pending, setPending] = useState(false);

  const onSubmit = async (values: FormValues) => {
    if (!onSave) return;
    setPending(true);
    try {
      await onSave(formToRule(values));
      toast.success(mode === 'add' ? 'Automation rule created' : 'Automation rule saved');
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !rule) return;
    setPending(true);
    try {
      await onDelete(rule);
      toast.success('Automation rule deleted');
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  const handleRestore = async () => {
    if (!onRestore || !rule) return;
    setPending(true);
    try {
      await onRestore(rule);
      toast.success('Automation rule restored');
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  const ruleName = rule
    ? String(rule['name'] ?? rule['id'] ?? '')
    : '';

  const title = mode === 'add' ? 'New Automation Rule' : mode === 'edit' ? 'Edit Rule' : ruleName;
  const description =
    mode === 'add' ? 'Configure a trigger and one or more actions.' :
    mode === 'edit' ? ruleName :
    'Automation Rule';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5 pr-6">
            <DialogTitle className="flex-1 truncate">{title}</DialogTitle>
            {!isActive && <Badge variant="muted">Inactive</Badge>}
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* ── Scrollable form body ── */}
        <div className="px-6 pb-2 max-h-[65vh] overflow-y-auto space-y-6">

          {isReadOnly && (
            <div className="px-3 py-2 rounded-md bg-muted/40 border border-border text-xs text-muted-foreground">
              This rule is inactive. Restore it to make edits.
            </div>
          )}

          {/* ── Basic info ── */}
          <Section label="Basic Info">
            <Field label="Name" required error={form.formState.errors.name?.message}>
              <Input
                placeholder="bedtime_reminder"
                disabled={isReadOnly}
                {...form.register('name')}
              />
              <FieldHint>Lowercase snake_case identifier</FieldHint>
            </Field>

            <Field label="Description" error={form.formState.errors.description?.message}>
              <Textarea
                placeholder="What does this rule do?"
                rows={2}
                disabled={isReadOnly}
                {...form.register('description')}
              />
            </Field>

            <Field label="Cooldown (minutes)" required error={form.formState.errors.cooldownMinutes?.message}>
              <Input
                type="number"
                placeholder="60"
                disabled={isReadOnly}
                {...form.register('cooldownMinutes')}
              />
              <FieldHint>Minimum wait between executions</FieldHint>
            </Field>
          </Section>

          {/* ── Trigger ── */}
          <Section label="Trigger">
            {/* Type pill selector */}
            <div>
              <Label className="mb-2 block">Trigger Type <span className="text-red-500 ml-0.5">*</span></Label>
              <Controller
                name="triggerType"
                control={form.control}
                render={({ field }) => (
                  <div className="flex gap-2">
                    {TRIGGER_TYPES.map((t) => {
                      const selected = field.value === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => field.onChange(t.value)}
                          className={cn(
                            'flex flex-col items-start px-3 py-2 rounded-lg border text-xs font-medium transition-colors flex-1',
                            selected
                              ? 'border-primary text-primary bg-primary/10'
                              : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                            isReadOnly && 'cursor-not-allowed opacity-60',
                          )}
                        >
                          <span className="font-semibold">{t.label}</span>
                          <span className={cn('font-normal', selected ? 'text-primary/70' : 'text-muted-foreground/60')}>
                            {t.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            {/* TIME sub-fields */}
            {triggerType === TriggerType.TIME && (
              <>
                <Field label="CRON Expression" required error={form.formState.errors.cron?.message}>
                  <Input
                    placeholder="0 21 * * 0-4"
                    disabled={isReadOnly}
                    {...form.register('cron')}
                    className="font-mono"
                  />
                  {(() => {
                    const desc = describeCron(form.watch('cron'));
                    return desc
                      ? <FieldHint className="text-primary/70">↳ {desc}</FieldHint>
                      : <FieldHint>Format: minute hour day month weekday · e.g. <code>0 21 * * 0-4</code> = 9 PM Sun–Thu</FieldHint>;
                  })()}
                </Field>

                <Field label="Timezone" required error={form.formState.errors.timezone?.message}>
                  <Input
                    placeholder="America/Chicago"
                    disabled={isReadOnly}
                    {...form.register('timezone')}
                  />
                </Field>
              </>
            )}

            {/* DEVICE sub-fields */}
            {triggerType === TriggerType.DEVICE && (
              <>
                <Field label="Device" required error={form.formState.errors.deviceId?.message}>
                  <select
                    disabled={isReadOnly}
                    {...form.register('deviceId')}
                    className={cn(
                      'flex h-9 w-full rounded-md border border-border bg-background px-3 py-1',
                      'text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                    )}
                  >
                    <option value="">Select a device…</option>
                    {MOCK_DEVICES.filter((d) => d.active).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.friendlyName} ({d.room ?? d.category})
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Intent" required error={form.formState.errors.deviceIntent?.message}>
                  <Textarea
                    placeholder='e.g. "When garage door has been open for more than 15 minutes after 10 PM"'
                    rows={2}
                    disabled={isReadOnly}
                    {...form.register('deviceIntent')}
                  />
                  <FieldHint>Describe in plain language when this should trigger</FieldHint>
                </Field>
              </>
            )}

            {/* SYSTEM sub-fields */}
            {triggerType === TriggerType.SYSTEM && (
              <>
                <Field label="Event Name" required error={form.formState.errors.eventName?.message}>
                  <Input
                    placeholder="app.startup"
                    disabled={isReadOnly}
                    {...form.register('eventName')}
                    className="font-mono"
                  />
                  <FieldHint>Internal application event identifier</FieldHint>
                </Field>

                <Field label="Intent" error={form.formState.errors.systemIntent?.message}>
                  <Textarea
                    placeholder='Optional: "On every application startup"'
                    rows={2}
                    disabled={isReadOnly}
                    {...form.register('systemIntent')}
                  />
                </Field>
              </>
            )}
          </Section>

          {/* ── Actions ── */}
          <Section
            label="Actions"
            error={typeof form.formState.errors.actions?.message === 'string' ? form.formState.errors.actions.message : undefined}
            action={
              !isReadOnly && (
                <button
                  type="button"
                  onClick={() => append(blankAction())}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus size={12} />
                  Add Action
                </button>
              )
            }
          >
            {actionFields.length === 0 && (
              <p className="text-xs text-muted-foreground/50 py-2">
                No actions yet. Click "Add Action" to get started.
              </p>
            )}

            <div className="space-y-4">
              {actionFields.map((field, idx) => (
                <ActionRow
                  key={field.fieldKey}
                  index={idx}
                  form={form}
                  isReadOnly={isReadOnly}
                  canRemove={actionFields.length > 1}
                  onRemove={() => remove(idx)}
                />
              ))}
            </div>
          </Section>
        </div>

        {/* ── Footer ── */}
        <DialogFooter className="flex items-center justify-between gap-2 pt-2">
          <div>
            {!isReadOnly && onDelete && rule && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={pending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {pending && <Loader2 size={13} className="animate-spin" />}
                Delete
              </button>
            )}
            {isReadOnly && onRestore && rule && (
              <button
                type="button"
                onClick={() => void handleRestore()}
                disabled={pending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-colors disabled:opacity-50"
              >
                {pending && <Loader2 size={13} className="animate-spin" />}
                Restore
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              {isReadOnly ? 'Close' : 'Cancel'}
            </button>
            {!isReadOnly && (
              <button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={pending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {pending && <Loader2 size={13} className="animate-spin" />}
                {mode === 'add' ? 'Create Rule' : 'Save Changes'}
              </button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// ActionRow
// ---------------------------------------------------------------------------

function ActionRow({
  index, form, isReadOnly, canRemove, onRemove,
}: {
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: ReturnType<typeof useForm<FormValues, any, any>>;
  isReadOnly: boolean;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const errors = form.formState.errors.actions?.[index];
  const actionType = form.watch(`actions.${index}.type`);

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
      {/* Header: index + type selector + remove button */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Action</span>
        </div>
        {canRemove && !isReadOnly && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Remove action"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Action type pills */}
      <div>
        <Label className="mb-1.5 block text-[11px]">Type</Label>
        <Controller
          name={`actions.${index}.type`}
          control={form.control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-1.5">
              {ACTION_TYPES.map((t) => {
                const selected = field.value === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => field.onChange(t.value)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors capitalize',
                      selected
                        ? ACTION_TYPE_COLORS[t.value]
                        : 'border-border text-muted-foreground hover:border-foreground/30 bg-transparent',
                      isReadOnly && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      {/* Instruction */}
      <Field
        label="Instruction"
        required
        error={errors?.instruction?.message}
        labelSize="sm"
      >
        <Textarea
          placeholder={actionInstructionPlaceholder(actionType)}
          rows={2}
          disabled={isReadOnly}
          {...form.register(`actions.${index}.instruction`)}
        />
        <FieldHint>Plain language objective for the AI — be specific and actionable</FieldHint>
      </Field>

      {/* Condition override */}
      <Field label="Condition Override" error={errors?.conditionOverride?.message} labelSize="sm">
        <Input
          placeholder='e.g. "Only if no one is home"'
          disabled={isReadOnly}
          {...form.register(`actions.${index}.conditionOverride`)}
        />
        <FieldHint>Optional extra condition the AI must check before executing</FieldHint>
      </Field>
    </div>
  );
}

function actionInstructionPlaceholder(type: ActionType): string {
  switch (type) {
    case ActionType.NOTIFICATION: return 'e.g. "Send a bedtime reminder to Emma and Liam."';
    case ActionType.TASK: return 'e.g. "Add \'Buy groceries\' to the shopping list."';
    case ActionType.HA_SERVICE: return 'e.g. "Close the garage door via Home Assistant."';
    case ActionType.SCRIPT: return 'e.g. "Run the morning briefing script."';
  }
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

function Section({
  label,
  error,
  action,
  children,
}: {
  label: string;
  error?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {label}
          </span>
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
        {action}
      </div>
      <div className="space-y-3 pl-0">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  labelSize = 'md',
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  labelSize?: 'sm' | 'md';
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className={cn(labelSize === 'sm' && 'text-[11px]')}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function FieldHint({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-[10px] text-muted-foreground/60', className)}>{children}</p>
  );
}
