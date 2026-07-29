import { Role } from '@home-ai/shared/domain/role/role';
import { useFormContext, Controller, FieldValues } from 'react-hook-form';
import { BaseFieldProps } from "../types";
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RemovableRoleBadge, ROLE_BADGE_TONE } from './removable-role-badge';

const ALL_ROLES = Object.values(Role);

const UNSELECTED_STYLE = 
  'rounded-full border border-border/60 bg-muted/30 px-2.5 py-0.5 text-xs font-semibold capitalize text-muted-foreground/75 transition-colors hover:border-border hover:bg-muted/50 hover:text-muted-foreground';

export function RoleSelectInput<T extends FieldValues>({ 
  name, 
  label, 
  description, 
  viewMode, 
  forceReadMode 
}: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();
  const isReadMode = viewMode === 'READ' || forceReadMode;

  return (
    <div className="flex flex-col gap-2">
      {label && <Label>{label}</Label>}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {ALL_ROLES.map((role) => {
                const isSelected = field.value === role;

                // In Read Mode, only show the selected role
                if (isReadMode) {
                  return isSelected ? (
                    <RemovableRoleBadge key={role} role={role} removable={false} />
                  ) : null;
                }

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => field.onChange(role)}
                    className={cn(
                      isSelected
                        ? cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize transition-colors', ROLE_BADGE_TONE[role])
                        : UNSELECTED_STYLE
                    )}
                  >
                    {role}
                  </button>
                );
              })}
              {isReadMode && !field.value && <span className="text-xs text-muted-foreground italic">—</span>}
            </div>
            {fieldState.error && (
              <p className="text-xs text-destructive">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />
      {description && !isReadMode && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}