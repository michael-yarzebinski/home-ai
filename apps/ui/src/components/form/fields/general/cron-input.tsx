import { Controller, FieldValues, useFormContext, useWatch } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { CronScheduleEditor } from '@/components/form/fields/general/cron-schedule-editor';
import { getCronDisplayLabel } from '@/utils/cron.utils';

interface CronInputProps {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  viewMode: 'CREATE' | 'EDIT' | 'READ';
  forceReadMode?: boolean;
}

export function CronInput({
  name,
  label,
  description,
  viewMode,
  forceReadMode,
}: CronInputProps) {
  const isReadMode = viewMode === 'READ' || forceReadMode;

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {isReadMode ? <CronReadView name={name} /> : <CronEditView name={name} />}
      {description && !isReadMode && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function CronReadView({ name }: { name: string }) {
  const { control } = useFormContext();
  const value = useWatch({ control, name }) as string | undefined;

  return (
    <div className="py-1 text-sm text-foreground min-h-[2rem] space-y-1">
      <p className="font-medium">{getCronDisplayLabel(value)}</p>
      {value && (
        <p className="font-mono text-xs text-muted-foreground">{value}</p>
      )}
    </div>
  );
}

function CronEditView({ name }: { name: string }) {
  const { control } = useFormContext<FieldValues>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="space-y-1">
          <CronScheduleEditor
            value={typeof field.value === 'string' ? field.value : ''}
            onChange={field.onChange}
          />
          {fieldState.error?.message && (
            <p className="text-xs text-destructive">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
}
