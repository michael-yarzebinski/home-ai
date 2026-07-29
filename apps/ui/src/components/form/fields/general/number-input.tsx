import { useFormContext, useWatch, Controller, FieldValues } from "react-hook-form";
import { BaseFieldProps } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NumberInput<T extends FieldValues>(props: BaseFieldProps<T>) {
  const { viewMode, forceReadMode } = props;
  const isReadMode = viewMode === 'READ' || forceReadMode;

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{props.label}</Label>
      {isReadMode ? <NumberView {...props} /> : <NumberEdit {...props} />}
    </div>
  );
}

function NumberView<T extends FieldValues>({ name }: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();
  const value = useWatch({ control, name });
  
  return (
    <div className="py-1 text-sm font-mono text-foreground">
      {value !== undefined && value !== null ? value.toLocaleString() : "—"}
    </div>
  );
}

function NumberEdit<T extends FieldValues>({ name, placeholder }: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Input
          {...field}
          type="number"
          placeholder={placeholder}
          className={fieldState.error ? "border-destructive" : ""}
          onChange={(e) => {
            // Ensure we send a number or null to the Zod schema
            const val = e.target.value === "" ? null : Number(e.target.value);
            field.onChange(val);
          }}
        />
      )}
    />
  );
}