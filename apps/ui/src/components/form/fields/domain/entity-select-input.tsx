import { useFormContext, useWatch, Controller, FieldValues } from "react-hook-form";
import { BaseFieldProps } from "../types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface EntityOption {
  id: string;
  label: string;
  subLabel?: string;
}

interface EntitySelectInputProps<T extends FieldValues> extends BaseFieldProps<T> {
  options: EntityOption[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function EntitySelectInput<T extends FieldValues>(props: EntitySelectInputProps<T>) {
  const { viewMode, forceReadMode, label, description } = props;
  const isReadMode = viewMode === 'READ' || forceReadMode;

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {isReadMode ? <EntityView {...props} /> : <EntityEdit {...props} />}
      {description && !isReadMode && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function EntityView<T extends FieldValues>({ name, options, isLoading }: EntitySelectInputProps<T>) {
  const { control } = useFormContext<T>();
  const value = useWatch({ control, name });
  
  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  
  const selected = options.find(opt => opt.id === value);

  return (
    <div className="py-1 text-sm font-medium">
      {selected ? (
        <div className="flex flex-col">
          <span>{selected.label}</span>
          {selected.subLabel && <span className="text-xs text-muted-foreground font-normal">{selected.subLabel}</span>}
        </div>
      ) : (
        <span className="text-muted-foreground italic">Not assigned</span>
      )}
    </div>
  );
}

function EntityEdit<T extends FieldValues>({ name, options, isLoading, placeholder, emptyMessage }: EntitySelectInputProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Select 
          onValueChange={field.onChange} 
          value={field.value} 
          disabled={isLoading}
        >
          <SelectTrigger className={cn(fieldState.error && "border-destructive")}>
            <SelectValue placeholder={isLoading ? "Loading..." : (placeholder || "Select...")} />
          </SelectTrigger>
          <SelectContent>
            {options.length === 0 && !isLoading ? (
              <div className="p-2 text-xs text-muted-foreground text-center">
                {emptyMessage || "No options available"}
              </div>
            ) : (
              options.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  <div className="flex flex-col items-start">
                    <span>{opt.label}</span>
                    {opt.subLabel && <span className="text-[10px] opacity-70">{opt.subLabel}</span>}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
    />
  );
}