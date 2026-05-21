import { TextInput } from './text-input';

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
  placeholder, 
  description, 
  viewMode, 
  forceReadMode 
}: CronInputProps) {
  return (
    <TextInput
      name={name}
      label={label}
      // CRON is usually best viewed/edited in monospace
      placeholder={placeholder || "* * * * *"}
      description={description || "Standard CRON expression (e.g. '0 17 * * 1' for Mon at 5PM)"}
      viewMode={viewMode}
      forceReadMode={forceReadMode}
    />
  );
}