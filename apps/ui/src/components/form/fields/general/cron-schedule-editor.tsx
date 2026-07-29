import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CRON_CUSTOM_VALUE,
  CRON_PRESET_GROUPS,
  findCronPreset,
  getCronPresetsByGroup,
  normalizeCronExpression,
} from '@/utils/cron.utils';

interface CronScheduleEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

export function CronScheduleEditor({
  value,
  onChange,
  disabled = false,
  id,
}: CronScheduleEditorProps) {
  const matchedPreset = useMemo(() => findCronPreset(value), [value]);
  const selectValue = matchedPreset?.cron ?? CRON_CUSTOM_VALUE;
  const showCustomInput = selectValue === CRON_CUSTOM_VALUE;

  return (
    <div className="space-y-2">
      <Select
        value={selectValue}
        onValueChange={(next) => {
          if (next === CRON_CUSTOM_VALUE) return;
          onChange(next);
        }}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Choose a schedule…" />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {CRON_PRESET_GROUPS.map((group) => (
            <SelectGroup key={group}>
              <SelectLabel>{group}</SelectLabel>
              {getCronPresetsByGroup(group).map((preset) => (
                <SelectItem key={preset.cron} value={preset.cron}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
          <SelectGroup>
            <SelectLabel>Advanced</SelectLabel>
            <SelectItem value={CRON_CUSTOM_VALUE}>Custom cron expression…</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {showCustomInput && (
        <Input
          value={value}
          onChange={(event) => onChange(normalizeCronExpression(event.target.value))}
          placeholder="0 21 * * 0-4"
          disabled={disabled}
          className="font-mono"
        />
      )}

      {value && (
        <p className="text-xs text-muted-foreground">
          Cron: <code className="font-mono text-[11px]">{normalizeCronExpression(value)}</code>
        </p>
      )}
    </div>
  );
}

interface CronScheduleFieldProps extends CronScheduleEditorProps {
  label: string;
  description?: string;
  error?: string;
}

export function CronScheduleField({
  label,
  description,
  error,
  ...editorProps
}: CronScheduleFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={editorProps.id}>{label}</Label>
      <CronScheduleEditor {...editorProps} />
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
