import { Role } from '@home-ai/shared/domain/role/role';
import { cn } from '@/lib/utils';

const ALL_ROLES = Object.values(Role);

const ROLE_COLORS: Record<Role, string> = {
  [Role.ADMIN]: 'border-primary text-primary bg-primary/10',
  [Role.PARENT]: 'border-amber-500 text-amber-400 bg-amber-500/10',
  [Role.CHILD]: 'border-green-500 text-green-400 bg-green-500/10',
  [Role.GUEST]: 'border-muted-foreground text-muted-foreground bg-muted/30',
  [Role.READONLY]: 'border-muted-foreground text-muted-foreground bg-muted/30',
  [Role.AUTOMATION]: 'border-red-500 text-red-400 bg-red-500/10',
};

// ---------------------------------------------------------------------------
// Multi-role selector
// ---------------------------------------------------------------------------

interface MultiRoleSelectProps {
  value: Role[];
  onChange: (roles: Role[]) => void;
  error?: string;
  disabled?: boolean;
}

export function MultiRoleSelect({ value, onChange, error, disabled }: MultiRoleSelectProps) {
  const toggle = (role: Role) => {
    if (disabled) return;
    if (value.includes(role)) {
      onChange(value.filter((r) => r !== role));
    } else {
      onChange([...value, role]);
    }
  };

  return (
    <div className={cn('space-y-1.5', disabled && 'opacity-60')}>
      <div className="flex flex-wrap gap-1.5">
        {ALL_ROLES.map((role) => {
          const selected = value.includes(role);
          return (
            <button
              key={role}
              type="button"
              onClick={() => toggle(role)}
              disabled={disabled}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors capitalize',
                selected
                  ? ROLE_COLORS[role]
                  : 'border-border text-muted-foreground hover:border-foreground/40 bg-transparent',
                disabled && 'cursor-not-allowed',
              )}
            >
              {role}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single-role selector
// ---------------------------------------------------------------------------

interface SingleRoleSelectProps {
  value: Role | '';
  onChange: (role: Role) => void;
  options: { label: string; value: string }[];
  error?: string;
  disabled?: boolean;
}

export function SingleRoleSelect({ value, onChange, error, disabled }: SingleRoleSelectProps) {
  return (
    <div className={cn('space-y-1.5', disabled && 'opacity-60')}>
      <div className="flex flex-wrap gap-1.5">
        {ALL_ROLES.map((role) => {
          const selected = value === role;
          return (
            <button
              key={role}
              type="button"
              onClick={() => !disabled && onChange(role)}
              disabled={disabled}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors capitalize',
                selected
                  ? ROLE_COLORS[role]
                  : 'border-border text-muted-foreground hover:border-foreground/40 bg-transparent',
                disabled && 'cursor-not-allowed',
              )}
            >
              {role}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
