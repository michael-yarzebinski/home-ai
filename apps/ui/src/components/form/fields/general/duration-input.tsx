import { useFormContext, useWatch, Controller, FieldValues } from "react-hook-form";
import {
  DurationUnit,
  formatDuration,
  type Duration,
} from "@home-ai/shared/common/duration";
import { BaseFieldProps } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UNIT_OPTIONS = [
  { label: "Minutes", value: DurationUnit.MINUTES },
  { label: "Hours", value: DurationUnit.HOURS },
  { label: "Days", value: DurationUnit.DAYS },
];

export function DurationInput<T extends FieldValues>(props: BaseFieldProps<T>) {
  const { viewMode, forceReadMode } = props;
  const isReadMode = viewMode === "READ" || forceReadMode;

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{props.label}</Label>
      {isReadMode ? <DurationView {...props} /> : <DurationEdit {...props} />}
      {props.description && !isReadMode && (
        <p className="text-xs text-muted-foreground">{props.description}</p>
      )}
    </div>
  );
}

function DurationView<T extends FieldValues>({ name }: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();
  const value = useWatch({ control, name }) as Duration | undefined;

  return (
    <div className="py-1 text-sm text-foreground font-medium">
      {value ? (
        formatDuration(value)
      ) : (
        <span className="text-muted-foreground italic">No reminder</span>
      )}
    </div>
  );
}

function DurationEdit<T extends FieldValues>({
  name,
  placeholder,
}: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const current = (field.value ?? undefined) as Duration | undefined;
        const unit = current?.unit ?? DurationUnit.MINUTES;

        return (
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              step={1}
              placeholder={placeholder ?? "e.g. 30"}
              value={current?.value ?? ""}
              className={fieldState.error ? "border-destructive" : ""}
              onChange={(event) => {
                const raw = event.target.value;
                if (raw === "") {
                  field.onChange(undefined);
                  return;
                }
                const parsed = Number(raw);
                if (!Number.isFinite(parsed) || parsed <= 0) {
                  field.onChange(undefined);
                  return;
                }
                field.onChange({
                  value: Math.trunc(parsed),
                  unit,
                } satisfies Duration);
              }}
            />
            <Select
              value={unit}
              onValueChange={(nextUnit) => {
                const resolvedUnit = nextUnit as DurationUnit;
                if (!current?.value) {
                  field.onChange(undefined);
                  return;
                }
                field.onChange({
                  value: current.value,
                  unit: resolvedUnit,
                } satisfies Duration);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }}
    />
  );
}
