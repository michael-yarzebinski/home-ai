import { useFormContext, useWatch, Controller, FieldValues } from "react-hook-form";
import { BaseFieldProps } from "../types";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Define the option structure
export interface SelectOption {
  label: string;
  value: string | number;
}

// Extend BaseFieldProps for Select specifically
interface SelectFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  options: SelectOption[];
}

export function SelectInput<T extends FieldValues>(props: SelectFieldProps<T>) {
  const { viewMode, forceReadMode } = props;
  const isReadMode = viewMode === 'READ' || forceReadMode;

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{props.label}</Label>
      {isReadMode ? <SelectView {...props} /> : <SelectEdit {...props} />}
    </div>
  );
}

// Read View: Finds the label associated with the current ID value
function SelectView<T extends FieldValues>({ name, options }: SelectFieldProps<T>) {
  const { control } = useFormContext<T>();
  const currentValue = useWatch({ control, name });

  // Look up the label based on the value stored in the form
  const selectedOption = options.find((opt) => opt.value === currentValue);

  return (
    <div className="py-1 text-sm text-foreground font-medium">
      {selectedOption ? selectedOption.label : <span className="text-muted-foreground italic">None selected</span>}
    </div>
  );
}

// Edit View: The standard Shadcn Select
function SelectEdit<T extends FieldValues>({ name, options, placeholder }: SelectFieldProps<T>) {
  const { control } = useFormContext<T>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select onValueChange={field.onChange} value={field.value}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder || "Select an option"} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}