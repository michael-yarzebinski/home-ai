import type { ComponentProps, ReactNode } from 'react';
import { z } from 'zod';
import { Role } from '@home-ai/shared/domain/role/role';
import { Badge } from '@/components/ui/badge';
import {
  MOCK_AI_AUDITS, MOCK_AUDITS, MOCK_APP_CONFIGS, MOCK_AUTOMATION_RULES,
  MOCK_CALENDARS, MOCK_DEVICES, MOCK_FACTS, MOCK_LOGS, MOCK_NOTES,
  MOCK_NOTIFICATION_LOGS, MOCK_NOTIFICATION_QUEUE,
  MOCK_RECIPES, MOCK_TOOLS, MOCK_USERS,
} from '@/mock/entity-data';

// ---------------------------------------------------------------------------
// Config types
// ---------------------------------------------------------------------------

export type FieldType =
  | 'text' | 'textarea' | 'number' | 'password'
  | 'switch' | 'select' | 'multi-role-select' | 'role-select' | 'tags' | 'color';

export interface FormFieldDef {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  description?: string;
}

export interface ColumnDef {
  header: string;
  key: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
  className?: string;
}

export interface QuickAction {
  label: string;
  icon?: string;
  onClick?: (row: Record<string, unknown>) => void;
}

export interface EntityConfig {
  key: string;
  label: string;
  pluralLabel: string;
  /** Path segment used in admin API calls: /v1/admin/{apiPath}/search etc. */
  apiPath: string;
  /** Read-only monitoring entity — no add/edit modal */
  isMonitoring?: boolean;
  /** Allowed to create new entities (default: true for non-monitoring) */
  canCreate?: boolean;
  columns: ColumnDef[];
  formFields?: FormFieldDef[];
  formSchema?: z.ZodTypeAny;
  defaultFormValues?: () => Record<string, unknown>;
  /** Legacy mock data — kept for backwards compat, not used in live mode */
  mockData?: () => Record<string, unknown>[];
  quickAction?: QuickAction;
}

// ---------------------------------------------------------------------------
// Shared cell helpers
// ---------------------------------------------------------------------------

/** Matches `Badge` variant prop — keep in sync with `@/components/ui/badge`. */
type BadgeVariant = NonNullable<ComponentProps<typeof Badge>['variant']>;

const fmtDate = (v: unknown) =>
  v ? new Date(v as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const fmtDateTime = (v: unknown) =>
  v ? new Date(v as string).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

const fmtRelative = (v: unknown) => {
  if (!v) return '—';
  const secs = Math.floor((Date.now() - new Date(v as string).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
};

const truncate = (v: unknown, max = 48) => {
  const s = String(v ?? '');
  return s.length > max ? s.slice(0, max) + '…' : s;
};

const StatusBadge = ({ active }: { active: boolean }) => (
  <Badge variant={active ? 'default' : 'secondary'} className="min-w-[66px] justify-center">
    {active ? 'Active' : 'Inactive'}
  </Badge>
);

const roleBadgeAppearance = (role: Role): { variant: BadgeVariant; className?: string } => {
  const map: Record<Role, { variant: BadgeVariant; className?: string }> = {
    [Role.ADMIN]: { variant: 'default' },
    [Role.PARENT]: {
      variant: 'outline',
      className: 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100',
    },
    [Role.CHILD]: { variant: 'secondary' },
    [Role.GUEST]: { variant: 'secondary' },
    [Role.READONLY]: { variant: 'outline' },
    [Role.AUTOMATION]: { variant: 'destructive' },
  };
  return map[role] ?? { variant: 'secondary' };
};

const RoleBadge = ({ role }: { role: Role }) => {
  const { variant, className } = roleBadgeAppearance(role);
  return <Badge variant={variant} className={className}>{role}</Badge>;
};

const RoleList = ({ roles }: { roles: Role[] }) => (
  <div className="flex flex-wrap gap-1">
    {(roles ?? []).map((r) => <RoleBadge key={r} role={r} />)}
  </div>
);

const BoolBadge = ({ value, trueLabel = 'Yes', falseLabel = 'No' }: { value: boolean; trueLabel?: string; falseLabel?: string }) => (
  <Badge variant={value ? 'default' : 'secondary'}>{value ? trueLabel : falseLabel}</Badge>
);

// ---------------------------------------------------------------------------
// All entity configs
// ---------------------------------------------------------------------------

const ALL_ROLES = Object.values(Role).map((r) => ({ label: r, value: r }));

export const ENTITY_CONFIGS: EntityConfig[] = [
  // ── Monitoring ──────────────────────────────────────────────────────────

  {
    key: 'ai-audit',
    apiPath: 'ai-audit',
    label: 'AI Audit',
    pluralLabel: 'AI Audits',
    isMonitoring: true,
    mockData: () => MOCK_AI_AUDITS as unknown as Record<string, unknown>[],
    columns: [
      { header: 'User', key: 'userId', render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
      { header: 'Message', key: 'userMessage', render: (v) => truncate(v, 52) },
      { header: 'Status', key: 'success', render: (v) => <BoolBadge value={v as boolean} trueLabel="Success" falseLabel="Failed" /> },
      { header: 'Duration', key: 'durationMs', render: (v) => <>{v != null ? `${v}ms` : '—'}</> },
      { header: 'Created', key: 'createdAt', render: fmtRelative },
    ],
  },

  {
    key: 'audit',
    apiPath: 'audit',
    label: 'Audit',
    pluralLabel: 'Audit Logs',
    isMonitoring: true,
    mockData: () => MOCK_AUDITS as unknown as Record<string, unknown>[],
    columns: [
      { header: 'Type', key: 'entityType', render: (v) => <Badge variant="outline">{String(v)}</Badge> },
      { header: 'Entity ID', key: 'entityId', render: (v) => <span className="font-mono text-xs">{truncate(v, 20)}</span> },
      { header: 'Action', key: 'action', render: (v) => <Badge>{String(v)}</Badge> },
      { header: 'User', key: 'userId', render: (v) => v ? <span className="font-mono text-xs">{String(v)}</span> : <span className="text-muted-foreground">—</span> },
      { header: 'Notes', key: 'notes', render: (v) => v ? truncate(v, 40) : '—' },
      { header: 'Created', key: 'createdAt', render: fmtRelative },
    ],
  },

  {
    key: 'log',
    apiPath: 'logs',
    label: 'Log',
    pluralLabel: 'System Logs',
    isMonitoring: true,
    mockData: () => MOCK_LOGS as unknown as Record<string, unknown>[],
    columns: [
      {
        header: 'Severity', key: 'severity',         render: (v) => {
          const s = String(v);
          const map: Record<string, { variant: BadgeVariant; className?: string }> = {
            CRITICAL: { variant: 'destructive' },
            ERROR: { variant: 'destructive' },
            WARN: {
              variant: 'outline',
              className: 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100',
            },
            INFO: { variant: 'default' },
          };
          const cfg = map[s] ?? { variant: 'secondary' };
          return <Badge variant={cfg.variant} className={cfg.className}>{s}</Badge>;
        },
      },
      { header: 'Message', key: 'message', render: (v) => truncate(v, 60) },
      { header: 'Created', key: 'createdAt', render: fmtRelative },
    ],
  },

  {
    key: 'notification-log',
    apiPath: 'notification-log',
    label: 'Notification Log',
    pluralLabel: 'Notification Logs',
    isMonitoring: true,
    mockData: () => MOCK_NOTIFICATION_LOGS as unknown as Record<string, unknown>[],
    columns: [
      { header: 'User', key: 'userId', render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
      { header: 'Message', key: 'message', render: (v) => truncate(v, 60) },
      { header: 'Sent', key: 'createdAt', render: fmtRelative },
    ],
  },

  // ── CRUD entities (alphabetical) ────────────────────────────────────────

  {
    key: 'app-config',
    apiPath: 'app-config',
    label: 'App Config',
    pluralLabel: 'App Configs',
    mockData: () => MOCK_APP_CONFIGS as unknown as Record<string, unknown>[],
    columns: [
      { header: 'Key', key: 'key', render: (v) => <span className="font-mono text-xs text-primary">{String(v)}</span> },
      { header: 'Value', key: 'value', render: (v) => <span className="font-mono text-xs">{truncate(JSON.stringify(v), 40)}</span> },
      { header: 'Description', key: 'description', render: (v) => v ? truncate(v, 50) : '—' },
      { header: 'Status', key: 'active', render: (v) => <StatusBadge active={v as boolean} /> },
      { header: 'Updated', key: 'updatedAt', render: fmtDate },
    ],
    formFields: [
      { name: 'value', label: 'Value', type: 'textarea', required: true, description: 'JSON or plain value' },
      { name: 'description', label: 'Description', type: 'text', placeholder: 'What does this config control?' },
    ],
    formSchema: z.object({
      value: z.string().min(1, 'Value is required'),
      description: z.string().optional(),
    }),
  },

  {
    key: 'automation-rule',
    apiPath: 'automation-rules',
    label: 'Automation Rule',
    pluralLabel: 'Automation Rules',
    mockData: () => MOCK_AUTOMATION_RULES as unknown as Record<string, unknown>[],
    columns: [
      { header: 'Name', key: 'name', render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
      { header: 'Description', key: 'description', render: (v) => v ? truncate(v, 50) : <span className="text-muted-foreground">—</span> },
      {
        header: 'Trigger',
        key: 'trigger',
        render: (v) => {
          const t = v as { type: string } | undefined;
          const map: Record<string, { variant: BadgeVariant; className?: string }> = {
            TIME: { variant: 'default' },
            DEVICE: {
              variant: 'outline',
              className: 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100',
            },
            SYSTEM: { variant: 'outline' },
          };
          const cfg = map[t?.type ?? ''] ?? { variant: 'secondary' };
          return (
            <Badge variant={cfg.variant} className={cfg.className}>
              {t?.type ?? '—'}
            </Badge>
          );
        },
      },
      { header: 'Actions', key: 'actions', render: (v) => <>{Array.isArray(v) ? v.length : 0}</> },
      { header: 'Cooldown', key: 'cooldownMinutes', render: (v) => <>{v != null ? `${v}m` : '—'}</> },
      { header: 'Last Run', key: 'lastRun', render: (v) => v ? fmtRelative(v) : <span className="text-muted-foreground text-xs">Never</span> },
      { header: 'Status', key: 'active', render: (v) => <StatusBadge active={v as boolean} /> },
    ],
    formFields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'bedtime_reminder', description: 'Lowercase snake_case identifier' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'What does this rule do?' },
      { name: 'cooldownMinutes', label: 'Cooldown (minutes)', type: 'number', required: true, placeholder: '60', description: 'Minimum minutes between executions' },
    ],
    formSchema: z.object({
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
      cooldownMinutes: z.coerce.number().int().nonnegative('Must be non-negative'),
    }),
  },

  {
    key: 'calendar',
    apiPath: 'calendars',
    label: 'Calendar',
    pluralLabel: 'Calendars',
    mockData: () => MOCK_CALENDARS as unknown as Record<string, unknown>[],
    columns: [
      { header: 'Name', key: 'friendlyName' },
      { header: 'Slug', key: 'name', render: (v) => <span className="font-mono text-xs text-muted-foreground">{String(v)}</span> },
      { header: 'Color', key: 'color', render: (v) => v ? <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: String(v) }} />{String(v)}</span> : '—' },
      { header: 'Read Access', key: 'readRoles', render: (v) => <RoleList roles={v as Role[]} /> },
      { header: 'Status', key: 'active', render: (v) => <StatusBadge active={v as boolean} /> },
    ],
    formFields: [
      { name: 'name', label: 'Slug', type: 'text', required: true, placeholder: 'family', description: 'Lowercase identifier, no spaces' },
      { name: 'friendlyName', label: 'Display Name', type: 'text', required: true, placeholder: 'Family Calendar' },
      { name: 'aliases', label: 'Aliases', type: 'tags', placeholder: 'family, home', description: 'Comma-separated' },
      { name: 'color', label: 'Color', type: 'color', placeholder: '#3b9eff' },
      { name: 'readRoles', label: 'Read Access', type: 'multi-role-select', required: true },
      { name: 'writeRoles', label: 'Write Access', type: 'multi-role-select', required: true },
    ],
    formSchema: z.object({
      name: z.string().min(1, 'Slug is required'),
      friendlyName: z.string().min(1, 'Display name is required'),
      aliases: z.string().optional(),
      color: z.string().optional(),
      readRoles: z.array(z.nativeEnum(Role)).min(1, 'At least one read role required'),
      writeRoles: z.array(z.nativeEnum(Role)).min(1, 'At least one write role required'),
    }),
    defaultFormValues: () => ({ readRoles: [Role.ADMIN], writeRoles: [Role.ADMIN] }),
  },

  {
    key: 'device',
    apiPath: 'devices',
    label: 'Device',
    pluralLabel: 'Devices',
    mockData: () => MOCK_DEVICES as unknown as Record<string, unknown>[],
    quickAction: { label: 'Toggle Power' },
    columns: [
      { header: 'Name', key: 'friendlyName' },
      { header: 'Room', key: 'room', render: (v) => <>{v ?? '—'}</> },
      { header: 'Category', key: 'category', render: (v) => v ? <Badge variant="outline">{String(v)}</Badge> : <span>—</span> },
      { header: 'LLM', key: 'llmModelType', render: (v) => <Badge variant="outline">{String(v ?? 'soon')}</Badge> },
      { header: 'Status', key: 'active', render: (v) => <StatusBadge active={v as boolean} /> },
    ],
    formFields: [
      { name: 'friendlyName', label: 'Display Name', type: 'text', required: true, placeholder: 'Living Room Light' },
      { name: 'slug', label: 'Slug', type: 'text', required: true, placeholder: 'light.living_room' },
      { name: 'aliases', label: 'Aliases', type: 'tags', placeholder: 'living room, main light', description: 'Comma-separated' },
      { name: 'room', label: 'Room', type: 'text', placeholder: 'Living Room' },
      { name: 'category', label: 'Category', type: 'text', placeholder: 'lights' },
      { name: 'readRoles', label: 'Read Access', type: 'multi-role-select', required: true },
      { name: 'writeRoles', label: 'Write Access', type: 'multi-role-select', required: true },
      {
        name: 'llmModelType',
        label: 'Automation LLM',
        type: 'select',
        required: true,
        options: [
          { label: 'Soon (default)', value: 'soon' },
          { label: 'Immediate (fast path)', value: 'immediate' },
        ],
        description: 'Model tier for device-triggered automations',
      },
    ],
    formSchema: z.object({
      friendlyName: z.string().min(1, 'Display name is required'),
      slug: z.string().min(1, 'Slug is required'),
      aliases: z.string().optional(),
      room: z.string().optional(),
      category: z.string().optional(),
      readRoles: z.array(z.nativeEnum(Role)).min(1, 'At least one read role required'),
      writeRoles: z.array(z.nativeEnum(Role)).min(1, 'At least one write role required'),
      llmModelType: z.enum(['soon', 'immediate']).default('soon'),
    }),
    defaultFormValues: () => ({
      readRoles: [Role.ADMIN],
      writeRoles: [Role.ADMIN],
      llmModelType: 'soon',
    }),
  },

  {
    key: 'fact',
    apiPath: 'facts',
    label: 'Fact',
    pluralLabel: 'Facts',
    mockData: () => MOCK_FACTS as unknown as Record<string, unknown>[],
    quickAction: { label: 'Verify Source' },
    columns: [
      { header: 'Key', key: 'key', render: (v) => <span className="font-mono text-xs text-primary">{String(v)}</span> },
      { header: 'Value', key: 'value', render: (v) => truncate(v, 56) },
      { header: 'Tags', key: 'tags', render: (v) => <div className="flex flex-wrap gap-1">{(v as string[]).slice(0, 3).map((t) => <Badge key={t} variant="outline">{t}</Badge>)}</div> },
      { header: 'Status', key: 'active', render: (v) => <StatusBadge active={v as boolean} /> },
      { header: 'Updated', key: 'updatedAt', render: fmtDate },
    ],
    formFields: [
      { name: 'key', label: 'Key', type: 'text', required: true, placeholder: 'family.allergy.emma', description: 'Dot-notation identifier' },
      { name: 'value', label: 'Value', type: 'textarea', required: true, placeholder: 'Enter the fact content…' },
      { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'allergy, health', description: 'Comma-separated' },
      { name: 'readRoles', label: 'Read Access', type: 'multi-role-select', required: true },
      { name: 'writeRoles', label: 'Write Access', type: 'multi-role-select', required: true },
    ],
    formSchema: z.object({
      key: z.string().min(1, 'Key is required'),
      value: z.string().min(1, 'Value is required'),
      tags: z.string().optional(),
      readRoles: z.array(z.nativeEnum(Role)).min(1, 'At least one read role required'),
      writeRoles: z.array(z.nativeEnum(Role)).min(1, 'At least one write role required'),
    }),
    defaultFormValues: () => ({ readRoles: [Role.ADMIN, Role.PARENT], writeRoles: [Role.ADMIN] }),
  },

  {
    key: 'note',
    apiPath: 'notes',
    label: 'Note',
    pluralLabel: 'Notes',
    mockData: () => MOCK_NOTES as unknown as Record<string, unknown>[],
    columns: [
      { header: 'Name', key: 'friendlyName' },
      { header: 'Slug', key: 'name', render: (v) => <span className="font-mono text-xs text-muted-foreground">{String(v)}</span> },
      { header: 'Aliases', key: 'aliases', render: (v) => <span className="text-muted-foreground text-xs">{(v as string[]).join(', ')}</span> },
      { header: 'Read Access', key: 'readRoles', render: (v) => <RoleList roles={v as Role[]} /> },
      { header: 'Status', key: 'active', render: (v) => <StatusBadge active={v as boolean} /> },
    ],
    formFields: [
      { name: 'name', label: 'Slug', type: 'text', required: true, placeholder: 'grocery_list' },
      { name: 'friendlyName', label: 'Display Name', type: 'text', required: true, placeholder: 'Grocery List' },
      { name: 'aliases', label: 'Aliases', type: 'tags', placeholder: 'groceries, shopping' },
      { name: 'readRoles', label: 'Read Access', type: 'multi-role-select', required: true },
      { name: 'writeRoles', label: 'Write Access', type: 'multi-role-select', required: true },
    ],
    formSchema: z.object({
      name: z.string().min(1, 'Slug is required'),
      friendlyName: z.string().min(1, 'Display name is required'),
      aliases: z.string().optional(),
      readRoles: z.array(z.nativeEnum(Role)).min(1, 'At least one read role required'),
      writeRoles: z.array(z.nativeEnum(Role)).min(1, 'At least one write role required'),
    }),
    defaultFormValues: () => ({ readRoles: [Role.ADMIN, Role.PARENT], writeRoles: [Role.ADMIN] }),
  },

  {
    key: 'notification-queue',
    apiPath: 'notification-queue',
    label: 'Notification Queue',
    pluralLabel: 'Notification Queue',
    canCreate: false,
    mockData: () => MOCK_NOTIFICATION_QUEUE as unknown as Record<string, unknown>[],
    columns: [
      { header: 'User', key: 'userId', render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
      { header: 'Message', key: 'message', render: (v) => truncate(v, 52) },
      { header: 'Priority', key: 'importance', render: (v) => {
        const map: Record<string, BadgeVariant> = { high: 'default', normal: 'secondary', low: 'outline' };
        return <Badge variant={map[String(v).toLowerCase()] ?? 'secondary'}>{String(v)}</Badge>;
      }},
      { header: 'Scheduled', key: 'scheduledFor', render: fmtDateTime },
      { header: 'Status', key: 'active', render: (v) => <StatusBadge active={v as boolean} /> },
    ],
    formFields: [
      { name: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'Notification message…' },
      {
        name: 'importance',
        label: 'Priority',
        type: 'text',
        required: true,
        placeholder: 'high | normal | low',
        description: 'One of: high, normal, low',
      },
      {
        name: 'scheduledFor',
        label: 'Scheduled For',
        type: 'text',
        placeholder: '2026-05-01T14:00',
        description: 'ISO date-time (YYYY-MM-DDTHH:mm)',
      },
    ],
    formSchema: z.object({
      message: z.string().min(1, 'Message is required'),
      importance: z.string().min(1, 'Priority is required'),
      scheduledFor: z.string().optional(),
    }),
  },

  {
    key: 'recipe',
    apiPath: 'recipes',
    label: 'Recipe',
    pluralLabel: 'Recipes',
    mockData: () => MOCK_RECIPES as unknown as Record<string, unknown>[],
    quickAction: { label: 'Run Now' },
    columns: [
      { header: '#', key: 'readableId', className: 'w-12' },
      { header: 'Title', key: 'title' },
      { header: 'Servings', key: 'servings', render: (v) => <>{v ?? '—'}</> },
      { header: 'Prep', key: 'prepTimeMinutes', render: (v) => <>{v != null ? `${v}m` : '—'}</> },
      { header: 'Cook', key: 'cookTimeMinutes', render: (v) => <>{v != null ? `${v}m` : '—'}</> },
      { header: 'Status', key: 'active', render: (v) => <StatusBadge active={v as boolean} /> },
    ],
    formFields: [
      { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Classic Spaghetti Bolognese' },
      { name: 'url', label: 'Source URL', type: 'text', placeholder: 'https://…' },
      { name: 'servings', label: 'Servings', type: 'number', placeholder: '4' },
      { name: 'prepTimeMinutes', label: 'Prep Time (minutes)', type: 'number', placeholder: '15' },
      { name: 'cookTimeMinutes', label: 'Cook Time (minutes)', type: 'number', placeholder: '30' },
    ],
    formSchema: z.object({
      title: z.string().min(1, 'Title is required'),
      url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
      servings: z.coerce.number().int().positive().optional(),
      prepTimeMinutes: z.coerce.number().int().nonnegative().optional(),
      cookTimeMinutes: z.coerce.number().int().nonnegative().optional(),
    }),
  },

  {
    key: 'tool',
    apiPath: 'tools',
    label: 'Tool',
    pluralLabel: 'Tools',
    canCreate: false,
    mockData: () => MOCK_TOOLS as unknown as Record<string, unknown>[],
    columns: [
      { header: 'Name', key: 'name', render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
      { header: 'Display Name', key: 'friendlyName' },
      { header: 'Request Roles', key: 'requestRoles', render: (v) => <RoleList roles={v as Role[]} /> },
      { header: 'Status', key: 'active', render: (v) => <StatusBadge active={v as boolean} /> },
    ],
    formFields: [
      { name: 'friendlyName', label: 'Display Name', type: 'text', required: true },
      { name: 'hints', label: 'Hints', type: 'textarea', placeholder: 'Instructions for the AI on how to use this tool…' },
      { name: 'requestRoles', label: 'Request Roles', type: 'multi-role-select', required: true },
      { name: 'writeRoles', label: 'Write Roles', type: 'multi-role-select', required: true },
      { name: 'notifyRoles', label: 'Notify Roles', type: 'multi-role-select' },
    ],
    formSchema: z.object({
      friendlyName: z.string().min(1, 'Display name is required'),
      hints: z.string().optional(),
      requestRoles: z.array(z.nativeEnum(Role)).min(1, 'At least one request role required'),
      writeRoles: z.array(z.nativeEnum(Role)).min(1, 'At least one write role required'),
      notifyRoles: z.array(z.nativeEnum(Role)).optional(),
    }),
  },

  {
    key: 'user',
    apiPath: 'users',
    label: 'User',
    pluralLabel: 'Users',
    mockData: () => MOCK_USERS as unknown as Record<string, unknown>[],
    columns: [
      { header: 'Name', key: 'name' },
      { header: 'Role', key: 'role', render: (v) => <RoleBadge role={v as Role} /> },
      { header: 'Phone', key: 'phoneNumber', render: (v) => v ? <>{String(v)}</> : <span className="text-muted-foreground">—</span> },
      { header: 'Timezone', key: 'timezone' },
      { header: 'Status', key: 'active', render: (v) => <StatusBadge active={v as boolean} /> },
    ],
    formFields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Jane Smith' },
      { name: 'role', label: 'Role', type: 'role-select', required: true, options: ALL_ROLES },
      { name: 'phoneNumber', label: 'Phone Number', type: 'text', placeholder: '+15555550100' },
      { name: 'timezone', label: 'Timezone', type: 'text', required: true, placeholder: 'America/Chicago' },
      { name: 'quietHoursStart', label: 'Quiet Hours Start', type: 'text', placeholder: '22:00', description: 'HH:MM format' },
      { name: 'quietHoursEnd', label: 'Quiet Hours End', type: 'text', placeholder: '07:00', description: 'HH:MM format' },
      { name: 'accessCode', label: 'Access Code', type: 'password', required: true, placeholder: '••••••', description: 'Will be hashed before storage' },
    ],
    formSchema: z.object({
      name: z.string().min(1, 'Name is required'),
      role: z.nativeEnum(Role),
      phoneNumber: z.string().optional(),
      timezone: z.string().min(1, 'Timezone is required'),
      quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:MM').optional().or(z.literal('')),
      quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:MM').optional().or(z.literal('')),
      accessCode: z.string().min(4, 'Access code must be at least 4 characters'),
    }),
    defaultFormValues: () => ({ role: Role.PARENT, timezone: 'America/Chicago' }),
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export const ENTITY_CONFIG_MAP: Record<string, EntityConfig> = Object.fromEntries(
  ENTITY_CONFIGS.map((c) => [c.key, c]),
);

export const MONITORING_KEYS = ENTITY_CONFIGS.filter((c) => c.isMonitoring).map((c) => c.key);
export const CRUD_ENTITY_KEYS = ENTITY_CONFIGS.filter((c) => !c.isMonitoring).map((c) => c.key);
