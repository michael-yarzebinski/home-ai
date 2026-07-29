import { useFormContext, useWatch, Controller, FieldValues } from "react-hook-form";
import { BaseFieldProps } from "../types";
import { Input } from "@/components/ui/input"; // Assuming Shadcn

export function TextInput<T extends FieldValues>(props: BaseFieldProps<T>) {
  const { viewMode, forceReadMode } = props;
  const isReadMode = viewMode === 'READ' || forceReadMode;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium leading-none">{props.label}</label>
      {isReadMode ? (
        <TextView {...props} />
      ) : (
        <TextEdit {...props} />
      )}
    </div>
  );
}

// Lightweight Read View
function TextView<T extends FieldValues>({ name }: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();
  const value = useWatch({ control, name });
  return (
    <div className="py-1 text-sm text-foreground min-h-[2rem]">
      {value || <span className="text-muted-foreground italic">None</span>}
    </div>
  );
}

// Heavy Edit View
function TextEdit<T extends FieldValues>({ name, placeholder }: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Input 
          {...field} 
          placeholder={placeholder}
          className={fieldState.error ? "border-destructive" : ""}
        />
      )}
    />
  );
}