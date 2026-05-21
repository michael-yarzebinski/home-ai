import { useFormContext, useWatch, Controller, FieldValues } from "react-hook-form";
import { BaseFieldProps } from "../types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface RadioOption {
  label: string;
  value: string;
}

interface RadioFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  options: RadioOption[];
}

export function RadioInput<T extends FieldValues>(props: RadioFieldProps<T>) {
  const { viewMode, forceReadMode } = props;
  const isReadMode = viewMode === 'READ' || forceReadMode;

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm">
      <Label className="text-base">{props.label}</Label>
      {isReadMode ? <RadioView {...props} /> : <RadioEdit {...props} />}
    </div>
  );
}

function RadioView<T extends FieldValues>({ name, options }: RadioFieldProps<T>) {
  const { control } = useFormContext<T>();
  const value = useWatch({ control, name });

  return (
    <RadioGroup value={value} disabled className="flex flex-col gap-2">
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-2 opacity-80">
          <RadioGroupItem value={option.value} id={`view-${option.value}`} />
          <Label htmlFor={`view-${option.value}`} className="font-normal cursor-default">
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

function RadioEdit<T extends FieldValues>({ name, options }: RadioFieldProps<T>) {
  const { control } = useFormContext<T>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <RadioGroup
          onValueChange={field.onChange}
          defaultValue={field.value}
          className="flex flex-col gap-2"
        >
          {options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value} className="font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
    />
  );
}