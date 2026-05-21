import { useFormContext, useWatch, FieldValues } from "react-hook-form";
import { BaseFieldProps } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/** Helper to convert HH:mm string to AM/PM format */
const formatTimeToAmPm = (timeStr: string | unknown) => {
  if (typeof timeStr !== 'string' || !timeStr) return "—";
  
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));

  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export function TimeInput<T extends FieldValues>(props: BaseFieldProps<T>) {
  const { viewMode, forceReadMode } = props;
  const isReadMode = viewMode === 'READ' || forceReadMode;

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{props.label}</Label>
      {isReadMode ? <TimeView {...props} /> : <TimeEdit {...props} />}
      {props.description && !isReadMode && (
        <p className="text-xs text-muted-foreground">{props.description}</p>
      )}
    </div>
  );
}

// READ VIEW: Shows the human-friendly AM/PM time
function TimeView<T extends FieldValues>({ name }: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();
  const value = useWatch({ control, name });

  return (
    <div className="py-1 text-sm text-foreground font-medium flex items-center gap-2">
      <Clock className="size-4 opacity-50" />
      {value ? formatTimeToAmPm(value) : <span className="text-muted-foreground italic">No time set</span>}
    </div>
  );
}

// EDIT VIEW: Uses the native browser time picker (HH:mm)
function TimeEdit<T extends FieldValues>({ name, placeholder }: BaseFieldProps<T>) {
  const { register, formState: { errors } } = useFormContext<T>();
  const error = errors[name];

  return (
    <Input
      type="time"
      step={60} // Prevents seconds from showing up in most browsers
      placeholder={placeholder}
      {...register(name)}
      className={cn(
        "w-full max-w-[12rem]", 
        error ? "border-destructive" : ""
      )}
    />
  );
}