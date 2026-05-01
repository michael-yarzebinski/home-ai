import { useMemo, useState } from 'react';
import { Zap } from 'lucide-react';
import { ENTITY_CONFIG_MAP, type EntityConfig } from '@/pages/admin/entity-search/entity-configs';
import { EntityTable } from '@/pages/admin/entity-search/entity-table';
import { AutomationRuleModal } from './automation-rule-modal';
import { MOCK_USER } from '@/mock/user';
import type { AutomationRule } from '@home-ai/shared/domain/automation-rule/automation-rule';

// ---------------------------------------------------------------------------
// Modal state
// ---------------------------------------------------------------------------

type ModalState =
  | { open: false }
  | { open: true; mode: 'add' }
  | { open: true; mode: 'view' | 'edit'; rule: Record<string, unknown> };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findAndMutate(arr: Record<string, unknown>[], id: unknown, patch: Record<string, unknown>) {
  const item = arr.find((r) => r['id'] === id);
  if (item) Object.assign(item, patch);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function SettingsAutomationRules() {
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [tableKey, setTableKey] = useState(0);

  const baseConfig = ENTITY_CONFIG_MAP['automation-rule'];

  // Scope to current user only
  const config = useMemo<EntityConfig>(
    () => ({
      ...baseConfig,
      mockData: () => baseConfig.mockData().filter((r) => r['userId'] === MOCK_USER.id),
    }),
    [baseConfig],
  );

  const refreshTable = () => setTableKey((k) => k + 1);

  // ── Modal openers ─────────────────────────────────────────────────────

  const handleRowClick = (rule: Record<string, unknown>) =>
    setModal({ open: true, mode: 'view', rule });

  const handleEdit = (rule: Record<string, unknown>) =>
    setModal({ open: true, mode: 'edit', rule });

  const handleAdd = () => setModal({ open: true, mode: 'add' });

  // ── Mutations ─────────────────────────────────────────────────────────

  const handleSave = (data: Partial<AutomationRule>) => {
    const source = baseConfig.mockData();
    if (modal.open && modal.mode === 'edit' && 'rule' in modal) {
      findAndMutate(source, modal.rule['id'], { ...data, updatedAt: new Date() });
    } else {
      source.push({
        id: `ar_${Date.now()}`,
        userId: MOCK_USER.id,
        active: true,
        lastRun: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(data as Record<string, unknown>),
      });
    }
    refreshTable();
  };

  const handleDelete = (rule: Record<string, unknown>) => {
    findAndMutate(baseConfig.mockData(), rule['id'], { active: false, updatedAt: new Date() });
    refreshTable();
  };

  const handleRestore = (rule: Record<string, unknown>) => {
    findAndMutate(baseConfig.mockData(), rule['id'], { active: true, updatedAt: new Date() });
    refreshTable();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden -m-6">
      {/* ── Page header ── */}
      <div className="px-6 py-4 border-b border-border flex-shrink-0 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/15 flex-shrink-0">
          <Zap size={15} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-foreground leading-tight">Automation Rules</h1>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {MOCK_USER.name} · Triggers, actions, and schedules
          </p>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <EntityTable
          key={`ar-settings-${tableKey}`}
          config={config}
          onRowClick={handleRowClick}
          onEdit={handleEdit}
          onAdd={handleAdd}
        />
      </div>

      {/* ── Automation Rule Modal ── */}
      {modal.open && (
        <AutomationRuleModal
          open={modal.open}
          onClose={() => setModal({ open: false })}
          mode={modal.mode}
          rule={'rule' in modal ? modal.rule : undefined}
          onSave={handleSave}
          onDelete={handleDelete}
          onRestore={handleRestore}
        />
      )}
    </div>
  );
}
