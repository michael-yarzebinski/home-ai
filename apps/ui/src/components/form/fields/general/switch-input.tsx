import { useFormContext, useWatch, Controller, FieldValues } from "react-hook-form";
import { BaseFieldProps } from "../types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function SwitchInput<T extends FieldValues>(props: BaseFieldProps<T>) {
  const { viewMode, forceReadMode } = props;
  const isReadMode = viewMode === 'READ' || forceReadMode;

  return (
    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
      <div className="space-y-0.5">
        <Label>{props.label}</Label>
        {props.description && (
          <p className="text-xs text-muted-foreground">{props.description}</p>
        )}
      </div>
      {isReadMode ? <SwitchView {...props} /> : <SwitchEdit {...props} />}
    </div>
  );
}

function SwitchView<T extends FieldValues>({ name }: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();
  const value = useWatch({ control, name });

  return (
    <Switch
      checked={value}
      disabled // This visually locks the switch for Read Mode
      className="data-[state=checked]:bg-primary/50" // Optional: slight fade to show it's read-only
    />
  );
}

function SwitchEdit<T extends FieldValues>({ name }: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Switch
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      )}
    />
  );
}