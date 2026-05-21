import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checklist } from "@home-ai/shared/domain/checklist/checklist"; 
import { Role } from "@home-ai/shared/domain/role/role";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { RoleBadgeGroup } from "../../../components/role-badge-group/role-badge-group";

export const ROLE_BADGE_TONE: Record<Role, string> = {
  [Role.ADMIN]: 'border-rose-500/50 text-rose-600 bg-rose-500/10 dark:text-rose-400',
  [Role.PARENT]: 'border-amber-500/50 text-amber-600 bg-amber-500/10 dark:text-amber-400',
  [Role.CHILD]: 'border-emerald-500/50 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400',
  [Role.GUEST]: 'border-blue-500/50 text-blue-600 bg-blue-500/10 dark:text-blue-400',
  [Role.READONLY]: 'border-slate-500/50 text-slate-600 bg-slate-500/10 dark:text-slate-400',
  [Role.AUTOMATION]: 'border-violet-500/50 text-violet-600 bg-violet-500/10 dark:text-violet-400',
};

export const checklistColumns: ColumnDef<Checklist>[] = [
  {
    accessorKey: "name",
    header: "Protocol",
    cell: ({ row }) => (
      <span className="font-bold text-foreground tracking-tight">
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground line-clamp-2 max-w-[400px]">
        {row.original.description || "—"}
      </span>
    ),
  },
  {
    id: "readRoles",
    header: "Read Access",
    cell: ({ row }) => {
      const roles = row.original.readRoles || [];
      return <RoleBadgeGroup roles={roles as Role[]} />;

    },
  },
  {
    id: "writeRoles",
    header: "Write Access",
    cell: ({ row }) => {
      const roles = row.original?.writeRoles || [];
      return <RoleBadgeGroup roles={roles as Role[]} />;
    },
  },
];