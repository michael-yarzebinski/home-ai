import { useFormContext, useWatch, Controller, FieldValues } from "react-hook-form";
import { BaseFieldProps } from "../types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function CheckboxInput<T extends FieldValues>(props: BaseFieldProps<T>) {
  const { viewMode, forceReadMode } = props;
  const isReadMode = viewMode === 'READ' || forceReadMode;

  return (
    <div className="items-top flex space-x-2 rounded-lg border p-4 shadow-sm">
      {isReadMode ? <CheckboxView {...props} /> : <CheckboxEdit {...props} />}
      <div className="grid gap-1.5 leading-none">
        <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {props.label}
        </Label>
        {props.description && (
          <p className="text-sm text-muted-foreground">
            {props.description}
          </p>
        )}
      </div>
    </div>
  );
}

// Read View: Renders the Checkbox visually but locked
function CheckboxView<T extends FieldValues>({ name }: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();
  const value = useWatch({ control, name });

  return (
    <Checkbox
      checked={value}
      disabled // Visually locks the checkbox
      className="peer"
    />
  );
}

// Edit View: The interactive version
function CheckboxEdit<T extends FieldValues>({ name }: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Checkbox
          id={name}
          checked={field.value}
          onCheckedChange={field.onChange}
          className="peer"
        />
      )}
    />
  );
}