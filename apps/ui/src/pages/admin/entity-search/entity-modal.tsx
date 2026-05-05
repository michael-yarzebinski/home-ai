import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Role } from '@home-ai/shared/domain/role/role';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MultiRoleSelect, SingleRoleSelect } from '@/components/form/role-select';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import type { EntityConfig } from './entity-configs';

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

// ---------------------------------------------------------------------------
// Root modal shell
// ---------------------------------------------------------------------------

export function EntityModal({
  open, onClose, initialMode, config, entity, onSave, onDelete, onRestore,
}: EntityModalProps) {
  const [mode, setMode] = useState<ModalMode>(initialMode);

  // Sync mode whenever the modal (re)opens
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  const isActive = entity != null ? Boolean(entity['active'] ?? true) : true;
  const canEdit = !config.isMonitoring;

  // Human-readable entity name for the modal header
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
    mode === 'add' ? `Add ${config.label}` :
    mode === 'view' ? (entityTitle || config.label) :
    `Edit ${config.label}`;

  const modalDescription =
    mode === 'add' ? `Fill in the details for the new ${config.label.toLowerCase()}.` :
    mode === 'view' ? config.label :
    entityTitle || `Editing ${config.label.toLowerCase()}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={cn('max-w-lg', mode === 'view' && 'max-w-xl')}>
        <DialogHeader>
          <div className="flex items-center gap-2.5 pr-6">
            <DialogTitle className="flex-1 truncate">{modalTitle}</DialogTitle>
            {!isActive && <Badge variant="muted">Inactive</Badge>}
          </div>
          <DialogDescription>{modalDescription}</DialogDescription>
        </DialogHeader>

        {/* ── View panel ── */}
        {mode === 'view' && entity && (
          <ViewPanel
            config={config}
            entity={entity}
            canEdit={canEdit}
            isActive={isActive}
            onEdit={() => setMode('edit')}
            onRestore={onRestore && !isActive ? () => onRestore(entity) : undefined}
            onClose={onClose}
          />
        )}

        {/* ── Add / Edit form panel ── */}
        {(mode === 'add' || mode === 'edit') && (
          <FormPanel
            key={`${mode}-${entity?.['id'] ?? 'new'}`}
            config={config}
            entity={mode === 'edit' ? entity : undefined}
            mode={mode}
            isReadOnly={mode === 'edit' && !isActive}
            onSave={onSave ?? (() => Promise.resolve())}
            onClose={onClose}
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
  entity: Record<string, unknown>;
  canEdit: boolean;
  isActive: boolean;
  onEdit: () => void;
  onRestore?: () => Promise<void>;
  onClose: () => void;
}

function ViewPanel({ config, entity, canEdit, isActive, onEdit, onRestore, onClose }: ViewPanelProps) {
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

  // ID row
  rows.push({
    label: 'ID',
    value: (
      <span className="font-mono text-xs text-muted-foreground break-all">
        {String(entity['id'] ?? '—')}
      </span>
    ),
  });

  // All column-defined fields
  const colKeys = new Set<string>();
  for (const col of config.columns) {
    colKeys.add(col.key);
    rows.push({
      label: col.header,
      value: col.render
        ? col.render(entity[col.key], entity)
        : <span>{String(entity[col.key] ?? '—')}</span>,
    });
  }

  // Timestamps (if not already a column)
  const fmtDate = (v: unknown) =>
    v ? new Date(v as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  if (!colKeys.has('createdAt') && entity['createdAt'] != null) {
    rows.push({ label: 'Created', value: fmtDate(entity['createdAt']) });
  }
  if (!colKeys.has('updatedAt') && entity['updatedAt'] != null) {
    rows.push({ label: 'Updated', value: fmtDate(entity['updatedAt']) });
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
        {/* Left: Restore for inactive items */}
        <div>
          {!isActive && onRestore && (
            <button
              onClick={() => void handleRestore()}
              disabled={pending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-colors disabled:opacity-50"
            >
              {pending && <Loader2 size={13} className="animate-spin" />}
              Restore
            </button>
          )}
        </div>
        {/* Right: Edit + Close */}
        <div className="flex gap-2">
          {isActive && canEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Pencil size={13} />
              Edit
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Close
          </button>
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
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
  onDelete?: () => Promise<void>;
  onRestore?: () => Promise<void>;
}

function FormPanel({ config, entity, mode, isReadOnly, onSave, onClose, onDelete, onRestore }: FormPanelProps) {
  const fields = config.formFields ?? [];
  const schema = config.formSchema;
  const [pending, setPending] = useState(false);

  const defaultValues = buildDefaultValues(fields, entity ?? config.defaultFormValues?.() ?? {});

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: schema ? zodResolver(schema as any) : undefined,
    defaultValues,
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    // Convert comma-separated tag strings back to arrays for the API
    const coerced = { ...data };
    for (const field of fields) {
      if (field.type === 'tags' && typeof coerced[field.name] === 'string') {
        const raw = coerced[field.name] as string;
        coerced[field.name] = raw.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }
    setPending(true);
    try {
      await onSave(coerced);
      toast.success(mode === 'add' ? `${config.label} created` : `${config.label} saved`);
      onClose();
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
      onClose();
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
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="px-6 pb-2">
        {isReadOnly && (
          <div className="mb-4 px-3 py-2 rounded-md bg-muted/40 border border-border text-xs text-muted-foreground">
            This item is inactive. Restore it to make edits.
          </div>
        )}

        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
          {fields.map((field) => {
            const error = form.formState.errors[field.name]?.message as string | undefined;
            return (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>

                {field.description && (
                  <p className="text-[10px] text-muted-foreground/70">{field.description}</p>
                )}

                {/* ── Text / Number / Password / Color ── */}
                {(field.type === 'text' || field.type === 'number' || field.type === 'password' || field.type === 'color') && (
                  <Input
                    id={field.name}
                    type={field.type === 'color' ? 'text' : field.type}
                    placeholder={field.placeholder}
                    disabled={isReadOnly}
                    {...form.register(field.name)}
                    className={cn(error && 'border-red-500', isReadOnly && 'opacity-60')}
                  />
                )}

                {/* ── Textarea ── */}
                {field.type === 'textarea' && (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    rows={3}
                    disabled={isReadOnly}
                    {...form.register(field.name)}
                    className={cn(error && 'border-red-500', isReadOnly && 'opacity-60')}
                  />
                )}

                {/* ── Tags (comma-separated) ── */}
                {field.type === 'tags' && (
                  <Input
                    id={field.name}
                    placeholder={field.placeholder ?? 'tag1, tag2, tag3'}
                    disabled={isReadOnly}
                    {...form.register(field.name)}
                    className={cn(error && 'border-red-500', isReadOnly && 'opacity-60')}
                  />
                )}

                {/* ── Switch (boolean) ── */}
                {field.type === 'switch' && (
                  <Controller
                    name={field.name}
                    control={form.control}
                    render={({ field: f }) => (
                      <div className="flex items-center gap-2">
                        <Switch
                          id={field.name}
                          checked={Boolean(f.value)}
                          onCheckedChange={f.onChange}
                          disabled={isReadOnly}
                        />
                        <label
                          htmlFor={field.name}
                          className={cn('text-xs text-muted-foreground', isReadOnly ? 'cursor-default' : 'cursor-pointer')}
                        >
                          {f.value ? 'Enabled' : 'Disabled'}
                        </label>
                      </div>
                    )}
                  />
                )}

                {/* ── Single role select ── */}
                {field.type === 'role-select' && (
                  <Controller
                    name={field.name}
                    control={form.control}
                    render={({ field: f }) => (
                      <SingleRoleSelect
                        value={(f.value as Role) ?? ''}
                        onChange={f.onChange}
                        options={field.options ?? []}
                        error={error}
                        disabled={isReadOnly}
                      />
                    )}
                  />
                )}

                {/* ── Multi-role select ── */}
                {field.type === 'multi-role-select' && (
                  <Controller
                    name={field.name}
                    control={form.control}
                    render={({ field: f }) => (
                      <MultiRoleSelect
                        value={(f.value as Role[]) ?? []}
                        onChange={f.onChange}
                        error={error}
                        disabled={isReadOnly}
                      />
                    )}
                  />
                )}

                {/* Inline error */}
                {error && field.type !== 'multi-role-select' && field.type !== 'role-select' && (
                  <p className="text-xs text-red-500">{error}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <DialogFooter className="flex items-center justify-between gap-2 pt-2">
        {/* Left: Delete (active) or Restore (inactive) */}
        <div>
          {!isReadOnly && onDelete && (
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
          {isReadOnly && onRestore && (
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

        {/* Right: Cancel + Save */}
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
              {mode === 'add' ? 'Create' : 'Save Changes'}
            </button>
          )}
        </div>
      </DialogFooter>
    </>
  );
}

// ---------------------------------------------------------------------------
// buildDefaultValues — populates form from entity data
// ---------------------------------------------------------------------------

function buildDefaultValues(
  fields: EntityConfig['formFields'],
  entity: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of fields ?? []) {
    const raw = entity[field.name];

    switch (field.type) {
      case 'tags':
        // Convert array → comma-separated string for text input
        result[field.name] = Array.isArray(raw)
          ? (raw as unknown[]).join(', ')
          : raw != null ? String(raw) : '';
        break;

      case 'multi-role-select':
        result[field.name] = Array.isArray(raw) ? raw : [];
        break;

      case 'switch':
        result[field.name] = raw != null ? Boolean(raw) : false;
        break;

      case 'number':
        result[field.name] = raw != null ? raw : '';
        break;

      default: {
        // text, textarea, password, color, role-select, select
        if (raw instanceof Date) {
          // Convert Date to local datetime-string for text inputs
          result[field.name] = raw.toISOString().slice(0, 16);
        } else {
          result[field.name] = raw != null ? raw : '';
        }
      }
    }
  }

  return result;
}
