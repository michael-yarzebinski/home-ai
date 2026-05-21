import { useState } from 'react';
import { Zap } from 'lucide-react';
import { ENTITY_CONFIG_MAP } from '@/scenes/admin/entity-search/entity-configs';
import { EntityTable } from '@/scenes/admin/entity-search/entity-table';
import { AutomationRuleModal } from './automation-rule-modal';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import type { AutomationRule } from '@home-ai/shared/domain/automation-rule/automation-rule';

// ---------------------------------------------------------------------------
// Modal state
// ---------------------------------------------------------------------------

type ModalState =
  | { open: false }
  | { open: true; mode: 'add' }
  | { open: true; mode: 'view' | 'edit'; rule: Record<string, unknown> };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** User-facing automation rules endpoint (scoped to JWT user) */
const USER_API_BASE = '/v1';
const AUTOMATION_RULES_PATH = 'automation-rules';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function SettingsAutomationRules() {
  const { user } = useAuth();
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [tableKey, setTableKey] = useState(0);

  const config = ENTITY_CONFIG_MAP['automation-rule'];
  const refreshTable = () => setTableKey((k) => k + 1);

  // ── Modal openers ─────────────────────────────────────────────────────

  const handleRowClick = (rule: Record<string, unknown>) =>
    setModal({ open: true, mode: 'view', rule });

  const handleEdit = (rule: Record<string, unknown>) =>
    setModal({ open: true, mode: 'edit', rule });

  const handleAdd = () => setModal({ open: true, mode: 'add' });

  // ── Mutations ─────────────────────────────────────────────────────────

  const handleSave = async (data: Partial<AutomationRule>) => {
    if (modal.open && modal.mode === 'edit' && 'rule' in modal) {
      await api.put(`${USER_API_BASE}/${AUTOMATION_RULES_PATH}/${modal.rule['id']}`, data);
    } else {
      await api.post(`${USER_API_BASE}/${AUTOMATION_RULES_PATH}`, data);
    }
    refreshTable();
  };

  const handleDelete = async (rule: Record<string, unknown>) => {
    await api.delete(`${USER_API_BASE}/${AUTOMATION_RULES_PATH}/${rule['id']}`);
    refreshTable();
  };

  const handleRestore = async (rule: Record<string, unknown>) => {
    await api.post(`${USER_API_BASE}/${AUTOMATION_RULES_PATH}/${rule['id']}/restore`);
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
            {user?.name ?? 'My'} · Triggers, actions, and schedules
          </p>
        </div>
      </div>

      {/* ── Table — uses user-facing /v1/automation-rules endpoint ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <EntityTable
          key={`ar-settings-${tableKey}`}
          config={config}
          onRowClick={handleRowClick}
          onEdit={handleEdit}
          onAdd={handleAdd}
          apiBase={USER_API_BASE}
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
