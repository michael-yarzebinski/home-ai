import { useForm, FormProvider } from 'react-hook-form';
import { type Log } from '@home-ai/shared/domain/monitoring/log/log';
import { EntityFormProps } from '../../types';

// General Fields
import { TextInput } from '@/components/form/fields/general/text-input';

// Domain Fields
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';
import { UserSelectInput } from '@/components/form/fields/domain/user-select-input';

// UI Components
import { Badge } from '@/components/ui/badge';
import { Terminal, ShieldAlert, Info, AlertTriangle, FileJson } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TextAreaInput } from '../../../fields/general/text-area-input';

export function LogForm({ 
  initialData, 
  viewMode = 'READ' 
}: EntityFormProps<any, Log>) {
  
  const form = useForm<Log>({
    defaultValues: initialData,
  });

  // Helper to determine severity styling
  const getSeverityStyles = (severity: string = '') => {
    const s = severity.toLowerCase();
    if (s.includes('err') || s.includes('crit')) return { color: 'bg-red-500/10 text-red-600 border-red-200', icon: <ShieldAlert className="w-3 h-3" /> };
    if (s.includes('warn')) return { color: 'bg-amber-500/10 text-amber-600 border-amber-200', icon: <AlertTriangle className="w-3 h-3" /> };
    return { color: 'bg-blue-500/10 text-blue-600 border-blue-200', icon: <Info className="w-3 h-3" /> };
  };

  const severityStyle = getSeverityStyles(initialData?.severity);

  return (
    <FormProvider {...form}>
      <form className="space-y-6">
        {/* Header Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-6">
            <EntityIdField value={initialData?.id} />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Severity</span>
              <Badge className={cn("gap-1.5 uppercase font-bold tracking-wider", severityStyle.color)}>
                {severityStyle.icon}
                {initialData?.severity || 'UNKNOWN'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-slate-100 px-2 py-1 rounded">
            <Terminal className="w-3 h-3" />
            System Log
          </div>
        </div>

        {/* Association */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UserSelectInput name="userId" label="Triggered By (User)" viewMode="READ" />
          <div className="flex flex-col justify-center">
             <p className="text-xs text-muted-foreground italic">
                If no user is present, this was likely an automated background task or system lifecycle event.
             </p>
          </div>
        </div>

        {/* The Message */}
        <TextAreaInput 
          name="message" 
          label="Log Message" 
          viewMode="READ" 
          className="font-mono text-sm leading-relaxed"
        />

        {/* Metadata / Context Objects */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
            <FileJson className="w-4 h-4" />
            Structured Metadata
          </div>
          <div className="rounded-md bg-[#1e1e1e] p-4 border border-slate-800">
            <pre className="text-xs text-emerald-400 font-mono overflow-x-auto leading-relaxed">
              {initialData?.metadata 
                ? JSON.stringify(initialData.metadata, null, 2) 
                : "// No additional metadata provided"}
            </pre>
          </div>
        </div>

        <div className="pt-4 border-t">
          <EntityTimestampField 
            createdAt={initialData?.createdAt} 
            updatedAt={initialData?.createdAt}
          />
        </div>
      </form>
    </FormProvider>
  );
}