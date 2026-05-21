import { Role } from '@home-ai/shared/domain/role/role';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/** * Refined color palette for Home AI roles.
 * Uses Tailwind's arbitrary opacity for backgrounds and borders.
 */
export const ROLE_BADGE_TONE: Record<Role, string> = {
  [Role.ADMIN]: 'border-rose-500/50 text-rose-600 bg-rose-500/10 dark:text-rose-400',
  [Role.PARENT]: 'border-amber-500/50 text-amber-600 bg-amber-500/10 dark:text-amber-400',
  [Role.CHILD]: 'border-emerald-500/50 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400',
  [Role.GUEST]: 'border-blue-500/50 text-blue-600 bg-blue-500/10 dark:text-blue-400',
  [Role.READONLY]: 'border-slate-500/50 text-slate-600 bg-slate-500/10 dark:text-slate-400',
  [Role.AUTOMATION]: 'border-violet-500/50 text-violet-600 bg-violet-500/10 dark:text-violet-400',
};

export type RemovableRoleBadgeProps = {
  role: Role;
  onRemove?: () => void;
  disabled?: boolean;
  /** When false, displays as a static pill without the close button. */
  removable?: boolean;
  className?: string;
};

export function RemovableRoleBadge({
  role,
  onRemove,
  disabled,
  removable = true,
  className,
}: RemovableRoleBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold capitalize tracking-wide transition-all",
        "px-2.5 py-0.5 gap-1.5",
        ROLE_BADGE_TONE[role],
        disabled && "opacity-50 grayscale-[0.5] pointer-events-none",
        className
      )}
    >
      <span className="truncate">{role.toLowerCase()}</span>
      
      {removable && (
        <button
          type="button"
          aria-label={`Remove ${role}`}
          disabled={disabled}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove?.();
          }}
          className={cn(
            "group/btn -mr-1 rounded-full p-0.5 outline-none transition-colors",
            "hover:bg-foreground/20 focus-visible:ring-1 focus-visible:ring-ring"
          )}
        >
          <X 
            className="size-3 stroke-[2.5] opacity-70 group-hover/btn:opacity-100" 
            aria-hidden="true" 
          />
        </button>
      )}
    </Badge>
  );
}