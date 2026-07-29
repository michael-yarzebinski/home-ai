import { useFormContext, useWatch, Controller, FieldValues } from "react-hook-form";
import { BaseFieldProps } from "../types";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function TextAreaInput<T extends FieldValues>(props: BaseFieldProps<T>) {
  const { viewMode, forceReadMode } = props;
  const isReadMode = viewMode === 'READ' || forceReadMode;

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{props.label}</Label>
      {isReadMode ? <TextAreaView {...props} /> : <TextAreaEdit {...props} />}
    </div>
  );
}

function TextAreaView<T extends FieldValues>({ name }: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();
  const value = useWatch({ control, name });

  return (
    // whitespace-pre-wrap ensures that line breaks in the description are rendered
    <div className="py-1 text-sm text-foreground whitespace-pre-wrap min-h-[2.5rem]">
      {value || <span className="text-muted-foreground italic">No description provided.</span>}
    </div>
  );
}

function TextAreaEdit<T extends FieldValues>({ name, placeholder }: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Textarea 
          {...field} 
          placeholder={placeholder}
          className={fieldState.error ? "border-destructive" : ""}
        />
      )}
    />
  );
}