import { Lock } from "lucide-react";
import { Role } from "@home-ai/shared/domain/role/role";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Keys must match {@link Role} string values (`admin`, `parent`, …), not uppercase labels. */
export const ROLE_BADGE_TONE: Record<Role, string> = {
  [Role.ADMIN]: "border-rose-500/50 text-rose-600 bg-rose-500/10 dark:text-rose-400",
  [Role.PARENT]: "border-amber-500/50 text-amber-600 bg-amber-500/10 dark:text-amber-400",
  [Role.CHILD]: "border-emerald-500/50 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
  [Role.GUEST]: "border-blue-500/50 text-blue-600 bg-blue-500/10 dark:text-blue-400",
  [Role.READONLY]: "border-slate-500/50 text-slate-600 bg-slate-500/10 dark:text-slate-400",
  [Role.AUTOMATION]: "border-violet-500/50 text-violet-600 bg-violet-500/10 dark:text-violet-400",
};

interface RoleBadgeGroupProps {
  roles: Role[];
  className?: string;
}

export function RoleBadgeGroup({ roles, className }: RoleBadgeGroupProps) {
  // Always sort alphabetically for UI consistency
  const sortedRoles = [...roles].sort((a, b) => a.localeCompare(b));

  if (sortedRoles.length === 0) {
    return (
      <div className={cn("flex items-center gap-1.5 text-muted-foreground/30", className)}>
        <Lock size={12} strokeWidth={2.5} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Restricted</span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {sortedRoles.map((role) => (
        <Badge
          key={role}
          variant="outline"
          className={cn(
            "text-[10px] font-bold uppercase py-0 px-2 border leading-5 h-5 transition-none",
            ROLE_BADGE_TONE[role] ?? "border-border bg-muted/30 text-muted-foreground",
          )}
        >
          {role}
        </Badge>
      ))}
    </div>
  );
}