import { useState } from 'react';
import { Database } from 'lucide-react';
import { ENTITY_CONFIG_MAP, ENTITY_CONFIGS } from './entity-configs';
import { EntityNav } from './entity-nav';
import { EntityTable } from './entity-table';
import { EntityModal, type ModalMode } from './entity-modal';

// ---------------------------------------------------------------------------
// Modal state union
// ---------------------------------------------------------------------------

type ModalState =
  | { open: false }
  | { open: true; initialMode: 'add' }
  | { open: true; initialMode: Exclude<ModalMode, 'add'>; entity: Record<string, unknown> };

// ---------------------------------------------------------------------------
// Helpers for mock mutations (soft-delete / restore / upsert)
// ---------------------------------------------------------------------------

function findAndMutate(arr: Record<string, unknown>[], id: unknown, patch: Record<string, unknown>) {
  const item = arr.find((r) => r['id'] === id);
  if (item) Object.assign(item, patch);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const INITIAL_KEY = ENTITY_CONFIGS[0].key;

export function EntitySearch() {
  const [selectedKey, setSelectedKey] = useState(INITIAL_KEY);
  const [modal, setModal] = useState<ModalState>({ open: false });
  // Incrementing this forces the table to remount and re-read mock data
  const [tableKey, setTableKey] = useState(0);

  const config = ENTITY_CONFIG_MAP[selectedKey];
  const refreshTable = () => setTableKey((k) => k + 1);

  // ── Navigation ────────────────────────────────────────────────────────

  const handleSelectEntity = (key: string) => {
    setSelectedKey(key);
    setModal({ open: false });
  };

  // ── Modal openers ─────────────────────────────────────────────────────

  const handleRowClick = (entity: Record<string, unknown>) => {
    setModal({ open: true, initialMode: 'view', entity });
  };

  const handleEdit = (entity: Record<string, unknown>) => {
    setModal({ open: true, initialMode: 'edit', entity });
  };

  const handleAdd = () => {
    setModal({ open: true, initialMode: 'add' });
  };

  // ── Save (mock upsert) ────────────────────────────────────────────────

  const handleSave = (data: Record<string, unknown>) => {
    const source = config.mockData() as Record<string, unknown>[];
    if (modal.open && modal.initialMode === 'edit' && 'entity' in modal) {
      findAndMutate(source, modal.entity['id'], { ...data, updatedAt: new Date() });
    } else {
      // Mock create: push with synthetic id + timestamps
      source.push({
        id: `new_${Date.now()}`,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      });
    }
    refreshTable();
  };

  // ── Soft-delete ───────────────────────────────────────────────────────

  const handleDelete = (entity: Record<string, unknown>) => {
    findAndMutate(config.mockData(), entity['id'], { active: false, updatedAt: new Date() });
    refreshTable();
  };

  // ── Restore ───────────────────────────────────────────────────────────

  const handleRestore = (entity: Record<string, unknown>) => {
    findAndMutate(config.mockData(), entity['id'], { active: true, updatedAt: new Date() });
    refreshTable();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden -mt-6 -mb-6">
      {/* ── Page header ── */}
      <div className="px-6 py-4 border-b border-border flex-shrink-0 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 flex-shrink-0">
          <Database size={15} className="text-primary" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-foreground leading-tight">Entity Search</h1>
          <p className="text-xs text-muted-foreground/70 mt-0.5">Browse, search, and manage all system entities</p>
        </div>
      </div>

      {/* ── Two-panel layout ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left panel: entity type selector */}
        <aside className="w-56 flex-shrink-0 border-r border-border bg-card flex flex-col">
          <EntityNav selectedKey={selectedKey} onSelect={handleSelectEntity} />
        </aside>

        {/* Right panel: table */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* Panel sub-header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0">
            <h2 className="text-sm font-semibold text-foreground">{config.pluralLabel}</h2>
            {config.isMonitoring && (
              <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                Read Only
              </span>
            )}
          </div>

          {/* Table — key forces remount on entity switch or data mutation */}
          <EntityTable
            key={`${selectedKey}-${tableKey}`}
            config={config}
            onRowClick={handleRowClick}
            onEdit={handleEdit}
            onAdd={handleAdd}
          />
        </div>
      </div>

      {/* ── Modal ── */}
      {modal.open && (
        <EntityModal
          open={modal.open}
          onClose={() => setModal({ open: false })}
          initialMode={modal.initialMode}
          config={config}
          entity={'entity' in modal ? modal.entity : undefined}
          onSave={handleSave}
          onDelete={handleDelete}
          onRestore={handleRestore}
        />
      )}
    </div>
  );
}
