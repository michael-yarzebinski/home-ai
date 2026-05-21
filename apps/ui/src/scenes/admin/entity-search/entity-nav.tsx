import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ENTITY_CONFIGS, MONITORING_KEYS, CRUD_ENTITY_KEYS } from './entity-configs';

interface EntityNavProps {
  selectedKey: string;
  onSelect: (key: string) => void;
}

export function EntityNav({ selectedKey, onSelect }: EntityNavProps) {
  const [monitoringOpen, setMonitoringOpen] = useState(true);

  const monitoringConfigs = ENTITY_CONFIGS.filter((c) => MONITORING_KEYS.includes(c.key));
  const crudConfigs = ENTITY_CONFIGS.filter((c) => CRUD_ENTITY_KEYS.includes(c.key));

  return (
    <nav className="flex flex-col h-full overflow-y-auto pt-4 pb-2 px-2" aria-label="Entity types">
      {/* Section label */}
      <span className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
        Entity Types
      </span>

      {/* Monitoring section (collapsible) */}
      <div className="mb-1">
        <button
          onClick={() => setMonitoringOpen((o) => !o)}
          className={cn(
            'flex w-full items-center justify-between px-2 py-2 rounded-md',
            'text-xs font-semibold uppercase tracking-widest',
            'text-muted-foreground/70 hover:text-muted-foreground hover:bg-accent',
            'transition-colors',
          )}
        >
          <span>Monitoring</span>
          {monitoringOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>

        {monitoringOpen && (
          <div className="flex flex-col gap-0.5 mt-0.5">
            {monitoringConfigs.map((config) => (
              <NavItem
                key={config.key}
                label={config.label}
                active={selectedKey === config.key}
                onClick={() => onSelect(config.key)}
                indent
              />
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-2 my-2 border-t border-border" />

      {/* CRUD entities */}
      <div className="flex flex-col gap-0.5">
        {crudConfigs.map((config) => (
          <NavItem
            key={config.key}
            label={config.label}
            active={selectedKey === config.key}
            onClick={() => onSelect(config.key)}
          />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  label,
  active,
  onClick,
  indent = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  indent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center rounded-md py-2 text-sm transition-colors text-left',
        indent ? 'px-4' : 'px-2',
        active
          ? 'bg-accent text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent',
      )}
    >
      {label}
    </button>
  );
}
