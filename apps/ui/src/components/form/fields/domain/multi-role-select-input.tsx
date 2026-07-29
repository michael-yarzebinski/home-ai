import { Role } from '@home-ai/shared/domain/role/role';
import { useFormContext, Controller, FieldValues } from 'react-hook-form';
import { BaseFieldProps } from "../types";
import { Label } from '@/components/ui/label';
import { RemovableRoleBadge } from './removable-role-badge';

const ALL_ROLES = Object.values(Role);

const UNSELECTED_STYLE = 
  'rounded-full border border-border/60 bg-muted/30 px-2.5 py-0.5 text-xs font-semibold capitalize text-muted-foreground/75 transition-colors hover:border-border hover:bg-muted/50 hover:text-muted-foreground cursor-pointer';

export function MultiRoleSelectInput<T extends FieldValues>({ 
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
        render={({ field, fieldState }) => {
          const values: Role[] = Array.isArray(field.value) ? field.value : [];

          const toggleRole = (role: Role) => {
            if (values.includes(role)) {
              field.onChange(values.filter((r) => r !== role));
            } else {
              field.onChange([...values, role]);
            }
          };

          return (
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                {ALL_ROLES.map((role) => {
                  const isSelected = values.includes(role);

                  if (isReadMode) {
                    return isSelected ? (
                      <RemovableRoleBadge key={role} role={role} removable={false} />
                    ) : null;
                  }

                  if (isSelected) {
                    return (
                      <RemovableRoleBadge
                        key={role}
                        role={role}
                        onRemove={() => toggleRole(role)}
                      />
                    );
                  }

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={UNSELECTED_STYLE}
                    >
                      {role}
                    </button>
                  );
                })}
                {isReadMode && values.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">—</span>
                )}
              </div>
              {fieldState.error && (
                <p className="text-xs text-destructive">{fieldState.error.message}</p>
              )}
            </div>
          );
        }}
      />
      {description && !isReadMode && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}