import { useEffect, useState, type ReactNode } from 'react';
import { useForm, Controller, FormProvider, type FieldValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Role } from '@home-ai/shared/domain/role/role';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FieldViewMode } from '@/components/form/fields/types';
import { TextInput } from '@/components/form/fields/general/text-input';
import { TextAreaInput } from '@/components/form/fields/general/text-area-input';
import { NumberInput } from '@/components/form/fields/general/number-input';
import { SwitchInput } from '@/components/form/fields/general/switch-input';
import { SelectInput } from '@/components/form/fields/general/select-input';
import { ArrayInput } from '@/components/form/fields/general/array-input';
import { MultiRoleSelectInput } from '@/components/form/fields/domain/multi-role-select-input';
import { RoleSelectInput } from '@/components/form/fields/domain/role-select-input';
import type { EntityConfig, FormFieldDef } from './entity-configs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModalMode = 'view' | 'add' | 'edit';

export interface EntityModalProps {
  open: boolean;
  onClose: () => void;
  /** Starting mode — 'view' for row click, 'edit' for pencil, 'add' for + button */
  initialMode: ModalMode;
  config: EntityConfig;
  /** Entity being viewed/edited (omit for 'add') */
  entity?: Record<string, unknown>;
  onSave?: (data: Record<string, unknown>) => Promise<void>;
  onDelete?: (entity: Record<string, unknown>) => Promise<void>;
  onRestore?: (entity: Record<string, unknown>) => Promise<void>;
}

interface EntityRecordPermissions {
  canUpdate: boolean;
  canRestore: boolean;
  canDelete: boolean;
}

function entityModalPermissions(
  config: EntityConfig,
  hasDeleteHandler: boolean,
  hasRestoreHandler: boolean,
): EntityRecordPermissions {
  if (config.isMonitoring) {
    return { canUpdate: false, canRestore: false, canDelete: false };
  }
  return {
    canUpdate: true,
    canRestore: hasRestoreHandler,
    canDelete: hasDeleteHandler,
  };
}

function serializeForFormField(field: FormFieldDef, raw: unknown): unknown {
  if (raw === undefined || raw === null) return raw;
  if (field.type === 'textarea' && typeof raw !== 'string') {
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return String(raw);
    }
  }
  return raw;
}

function buildModalFormDefaults(
  config: EntityConfig,
  entity: Record<string, unknown> | undefined,
  mode: 'add' | 'edit',
): Record<string, unknown> {
  const fields = config.formFields ?? [];
  const base: Record<string, unknown> = { ...(config.defaultFormValues?.() ?? {}) };

  if (mode === 'add' || !entity) {
    return base;
  }

  for (const f of fields) {
    const raw = entity[f.name];
    if (raw === undefined && base[f.name] === undefined) {
      continue;
    }

    if (f.type === 'tags') {
      if (Array.isArray(raw)) {
        base[f.name] = raw.map(String);
      } else if (typeof raw === 'string') {
        base[f.name] = raw.split(',').map((s) => s.trim()).filter(Boolean);
      } else {
        base[f.name] = [];
      }
      continue;
    }

    if (f.type === 'multi-role-select') {
      base[f.name] = Array.isArray(raw) ? raw : [];
      continue;
    }

    if (f.type === 'role-select') {
      base[f.name] = raw ?? Role.PARENT;
      continue;
    }

    if (f.type === 'switch') {
      base[f.name] = Boolean(raw);
      continue;
    }

    if (f.type === 'number') {
      base[f.name] = raw != null && raw !== '' ? Number(raw) : null;
      continue;
    }

    base[f.name] = serializeForFormField(f, raw ?? base[f.name]);
  }

  return base;
}

// ---------------------------------------------------------------------------
// Root modal shell
// ---------------------------------------------------------------------------

export function EntityModal({
  open,
  onClose,
  initialMode,
  config,
  entity,
  onSave,
  onDelete,
  onRestore,
}: EntityModalProps) {
  const [mode, setMode] = useState<ModalMode>(initialMode);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  const isActive = entity != null ? Boolean(entity['active'] ?? true) : true;
  const permissions = entityModalPermissions(
    config,
    typeof onDelete === 'function',
    typeof onRestore === 'function',
  );

  const entityTitle = entity
    ? String(
        entity['name'] ??
          entity['friendlyName'] ??
          entity['title'] ??
          entity['key'] ??
          entity['userId'] ??
          entity['id'] ??
          '',
      )
    : '';

  const modalTitle =
    mode === 'add'
      ? `Add ${config.label}`
      : mode === 'view'
        ? entityTitle || config.label
        : `Edit ${config.label}`;

  const modalDescription =
    mode === 'add'
      ? `Fill in the details for the new ${config.label.toLowerCase()}.`
      : mode === 'view'
        ? config.label
        : entityTitle || `Editing ${config.label.toLowerCase()}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={cn('max-w-lg', mode === 'view' && 'max-w-xl')}>
        <DialogHeader>
          <div className="flex items-center gap-2.5 pr-6">
            <DialogTitle className="flex-1 truncate">{modalTitle}</DialogTitle>
            {!isActive && <Badge variant="secondary">Inactive</Badge>}
          </div>
          <DialogDescription>{modalDescription}</DialogDescription>
        </DialogHeader>

        {mode === 'view' && entity && (
          <ViewPanel
            config={config}
            record={entity}
            permissions={permissions}
            isActive={isActive}
            onEdit={() => setMode('edit')}
            onRestore={onRestore && !isActive ? () => onRestore(entity) : undefined}
            onClose={onClose}
          />
        )}

        {(mode === 'add' || mode === 'edit') && (
          <FormPanel
            key={`${mode}-${String(entity?.['id'] ?? 'new')}`}
            config={config}
            entity={mode === 'edit' ? entity : undefined}
            mode={mode}
            isReadOnly={mode === 'edit' && !isActive}
            permissions={permissions}
            onSave={onSave ?? (() => Promise.resolve())}
            onCancel={onClose}
            onSuccess={onClose}
            onDelete={onDelete && entity ? () => onDelete(entity) : undefined}
            onRestore={onRestore && entity && !isActive ? () => onRestore(entity) : undefined}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// ViewPanel — read-only entity details
// ---------------------------------------------------------------------------

interface ViewPanelProps {
  config: EntityConfig;
  record: Record<string, unknown>;
  permissions: EntityRecordPermissions;
  isActive: boolean;
  onEdit: () => void;
  onRestore?: () => Promise<void>;
  onClose: () => void;
}

function ViewPanel({
  config,
  record,
  permissions,
  isActive,
  onEdit,
  onRestore,
  onClose,
}: ViewPanelProps) {
  const [pending, setPending] = useState(false);

  const handleRestore = async () => {
    if (!onRestore) return;
    setPending(true);
    try {
      await onRestore();
      toast.success(`${config.label} restored`);
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  type Row = { label: string; value: ReactNode };
  const rows: Row[] = [];

  rows.push({
    label: 'ID',
    value: (
      <span className="font-mono text-xs text-muted-foreground break-all">
        {String(record['id'] ?? '—')}
      </span>
    ),
  });

  const colKeys = new Set<string>();
  for (const col of config.columns) {
    colKeys.add(col.key);
    rows.push({
      label: col.header,
      value: col.render ? (
        col.render(record[col.key], record)
      ) : (
        <span>{String(record[col.key] ?? '—')}</span>
      ),
    });
  }

  const fmtDate = (v: unknown) =>
    v
      ? new Date(v as string).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '—';

  if (!colKeys.has('createdAt') && record['createdAt'] != null) {
    rows.push({ label: 'Created', value: fmtDate(record['createdAt']) });
  }
  if (!colKeys.has('updatedAt') && record['updatedAt'] != null) {
    rows.push({ label: 'Updated', value: fmtDate(record['updatedAt']) });
  }

  return (
    <>
      <div className="px-6 py-2 max-h-[58vh] overflow-y-auto">
        <div className="space-y-3">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex gap-4 items-start">
              <span className="text-[10px] text-muted-foreground/55 font-semibold whitespace-nowrap w-24 flex-shrink-0 pt-0.5 uppercase tracking-widest">
                {label}
              </span>
              <div className="text-sm text-foreground min-w-0 flex-1">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter className="flex items-center justify-between gap-2 pt-2">
        <div>
          {!isActive && onRestore && permissions.canRestore && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleRestore()}
              disabled={pending}
              className="border-green-500/30 text-green-600 hover:bg-green-500/10 dark:text-green-400"
            >
              {pending && <Loader2 size={13} className="animate-spin" />}
              Restore
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {isActive && permissions.canUpdate && (
            <Button type="button" onClick={onEdit}>
              <Pencil className="size-3.5" />
              Edit
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

// ---------------------------------------------------------------------------
// FormPanel — add or edit form
// ---------------------------------------------------------------------------

interface FormPanelProps {
  config: EntityConfig;
  entity?: Record<string, unknown>;
  mode: 'add' | 'edit';
  isReadOnly: boolean;
  permissions: EntityRecordPermissions;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  onSuccess: () => void;
  onDelete?: () => Promise<void>;
  onRestore?: () => Promise<void>;
}

function FormPanel({
  config,
  entity,
  mode,
  isReadOnly,
  permissions,
  onSave,
  onCancel,
  onSuccess,
  onDelete,
  onRestore,
}: FormPanelProps) {
  const fields = config.formFields ?? [];
  const schema = config.formSchema;
  const [pending, setPending] = useState(false);

  const defaultValues = buildModalFormDefaults(config, entity, mode);
  const formViewMode: FieldViewMode = mode === 'add' ? 'CREATE' : 'EDIT';
  const forceReadMode = isReadOnly;

  const form = useForm<FieldValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: schema ? (zodResolver(schema as any) as any) : undefined,
    defaultValues,
    disabled: isReadOnly,
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    const coerced: Record<string, unknown> = { ...data };
    for (const field of fields) {
      if (field.type === 'tags' || field.type === 'multi-role-select') {
        const raw = coerced[field.name];
        if (!Array.isArray(raw)) {
          coerced[field.name] = [];
        }
      }
    }

    setPending(true);
    try {
      await onSave(coerced);
      toast.success(mode === 'add' ? `${config.label} created` : `${config.label} saved`);
      onSuccess();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setPending(true);
    try {
      await onDelete();
      toast.success(`${config.label} deleted`);
      onSuccess();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  const handleRestore = async () => {
    if (!onRestore) return;
    setPending(true);
    try {
      await onRestore();
      toast.success(`${config.label} restored`);
      onSuccess();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  const namePath = (name: string) => name as Path<FieldValues>;

  return (
    <>
      <FormProvider {...form}>
        <div className="px-6 pb-2">
          {isReadOnly && (
            <div className="mb-4 px-3 py-2 rounded-md bg-muted/40 border border-border text-xs text-muted-foreground">
              This item is inactive. Restore it to make edits.
            </div>
          )}

          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">No form fields configured for this entity.</p>
            )}
            {fields.map((field) => {
              const labelText = `${field.label}${field.required ? ' *' : ''}`;
              const common = {
                name: namePath(field.name),
                label: labelText,
                viewMode: formViewMode,
                forceReadMode,
                placeholder: field.placeholder,
                description: field.description,
              };

              if (field.type === 'tags') {
                return <ArrayInput key={field.name} {...common} />;
              }

              if (field.type === 'textarea') {
                return <TextAreaInput key={field.name} {...common} />;
              }

              if (field.type === 'number') {
                return <NumberInput key={field.name} {...common} />;
              }

              if (field.type === 'switch') {
                return <SwitchInput key={field.name} {...common} />;
              }

              if (field.type === 'select' && field.options?.length) {
                return (
                  <SelectInput
                    key={field.name}
                    {...common}
                    options={field.options.map((o) => ({ label: o.label, value: o.value }))}
                  />
                );
              }

              if (field.type === 'role-select') {
                return <RoleSelectInput key={field.name} {...common} />;
              }

              if (field.type === 'multi-role-select') {
                return <MultiRoleSelectInput key={field.name} {...common} />;
              }

              if (field.type === 'password') {
                return (
                  <div key={field.name} className="space-y-1.5">
                    <Label htmlFor={field.name}>{labelText}</Label>
                    {field.description && (
                      <p className="text-[10px] text-muted-foreground/70">{field.description}</p>
                    )}
                    {forceReadMode ? (
                      <p className="text-sm text-muted-foreground py-1">••••••••</p>
                    ) : (
                      <Controller
                        name={namePath(field.name)}
                        control={form.control}
                        render={({ field: f, fieldState }) => (
                          <Input
                            id={field.name}
                            type="password"
                            autoComplete="new-password"
                            placeholder={field.placeholder}
                            {...f}
                            value={f.value ?? ''}
                            className={fieldState.error ? 'border-destructive' : ''}
                          />
                        )}
                      />
                    )}
                    {!forceReadMode && form.formState.errors[field.name]?.message && (
                      <p className="text-xs text-destructive">
                        {String(form.formState.errors[field.name]?.message)}
                      </p>
                    )}
                  </div>
                );
              }

              if (field.type === 'color') {
                return (
                  <div key={field.name} className="space-y-1.5">
                    <Label htmlFor={field.name}>{labelText}</Label>
                    {field.description && (
                      <p className="text-[10px] text-muted-foreground/70">{field.description}</p>
                    )}
                    {forceReadMode ? (
                      <TextInput {...common} />
                    ) : (
                      <Controller
                        name={namePath(field.name)}
                        control={form.control}
                        render={({ field: f, fieldState }) => (
                          <div className="flex gap-2 items-center">
                            <Input
                              type="color"
                              className="h-9 w-12 cursor-pointer p-1 shrink-0"
                              value={typeof f.value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(f.value) ? f.value : '#000000'}
                              onChange={(e) => f.onChange(e.target.value)}
                            />
                            <Input
                              id={field.name}
                              type="text"
                              placeholder={field.placeholder ?? '#3b9eff'}
                              value={f.value ?? ''}
                              onChange={(e) => f.onChange(e.target.value)}
                              className={cn('font-mono text-xs', fieldState.error && 'border-destructive')}
                            />
                          </div>
                        )}
                      />
                    )}
                  </div>
                );
              }

              return <TextInput key={field.name} {...common} />;
            })}
          </div>
        </div>
      </FormProvider>

      <DialogFooter className="flex items-center justify-between gap-2 pt-2">
        <div>
          {!isReadOnly && onDelete && permissions.canDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleDelete()}
              disabled={pending}
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              {pending && <Loader2 size={13} className="animate-spin" />}
              Delete
            </Button>
          )}
          {isReadOnly && onRestore && permissions.canRestore && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleRestore()}
              disabled={pending}
              className="border-green-500/30 text-green-600 hover:bg-green-500/10 dark:text-green-400"
            >
              {pending && <Loader2 size={13} className="animate-spin" />}
              Restore
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          {!isReadOnly && (
            <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={pending}>
              {pending && <Loader2 size={13} className="animate-spin" />}
              {mode === 'add' ? 'Create' : 'Save Changes'}
            </Button>
          )}
        </div>
      </DialogFooter>
    </>
  );
}
