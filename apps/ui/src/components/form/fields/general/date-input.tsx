import { useState } from 'react';
import { useFormContext, useWatch, Controller, FieldValues } from "react-hook-form";
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { BaseFieldProps } from "../types";
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';

/** Helper to parse YYYY-MM-DD string to a Local Date object */
export function parseYmdToLocalDate(value: unknown): Date | undefined {
  if (typeof value !== 'string') return undefined;
  const s = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}

export function DateInput<T extends FieldValues>(props: BaseFieldProps<T>) {
  const { viewMode, forceReadMode } = props;
  const isReadMode = viewMode === 'READ' || forceReadMode;

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{props.label}</Label>
      {isReadMode ? <DateView {...props} /> : <DateEdit {...props} />}
      {props.description && !isReadMode && (
        <p className="text-xs text-muted-foreground">{props.description}</p>
      )}
    </div>
  );
}

// READ VIEW: Displays a formatted date string
function DateView<T extends FieldValues>({ name }: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();
  const value = useWatch({ control, name });
  const dateObj = parseYmdToLocalDate(value);

  return (
    <div className="py-1 text-sm text-foreground font-medium flex items-center gap-2">
      <CalendarIcon className="size-4 opacity-50" />
      {dateObj ? format(dateObj, 'PPP') : <span className="text-muted-foreground italic">No date set</span>}
    </div>
  );
}

// EDIT VIEW: The Popover + Calendar logic
function DateEdit<T extends FieldValues>({ name, placeholder }: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();
  const [open, setOpen] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selectedDate = parseYmdToLocalDate(field.value);
        
        return (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !field.value && "text-muted-foreground",
                  fieldState.error && "border-destructive"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : (placeholder || "Pick a date")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        );
      }}
    />
  );
}