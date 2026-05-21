import { useForm, FormProvider } from 'react-hook-form';
import { type Audit } from '@home-ai/shared/domain/monitoring/audit/audit';
import { EntityFormProps } from '../../types';

// General Fields
import { TextInput } from '@/components/form/fields/general/text-input';

// Domain Fields
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';
import { UserSelectInput } from '@/components/form/fields/domain/user-select-input';

// UI Components
import { Badge } from '@/components/ui/badge';
import { History, Fingerprint, Database } from 'lucide-react';

export function AuditForm({ 
  initialData, 
}: EntityFormProps<any, Audit>) {
  
  const form = useForm<Audit>({
    defaultValues: initialData,
  });

  return (
    <FormProvider {...form}>
      <form className="space-y-8">
        {/* Header Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg bg-slate-50/50">
          <div className="flex items-center gap-6">
            <EntityIdField value={initialData?.id}/>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Action</span>
              <Badge variant="outline" className="bg-background font-mono uppercase tracking-tight">
                {initialData?.action || 'UNKNOWN_ACTION'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Entity Type</span>
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Database className="w-3.5 h-3.5 text-blue-500" />
                {initialData?.entityType}
              </div>
            </div>
          </div>
        </div>

        {/* Association Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <UserSelectInput name="userId" label="Performed By" viewMode="READ" />
            <p className="text-xs text-muted-foreground italic">
              Note: If "Performed By" is empty, this action was likely triggered by a system process or automation.
            </p>
          </div>
          <TextInput 
            name="entityId" 
            label="Target Entity ID" 
            viewMode="READ" 
            placeholder="N/A"
            className="font-mono text-xs"
          />
        </div>

        {/* Change Set */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
            <History className="w-4 h-4" />
            Diff / Change Data
          </div>
          <div className="rounded-md bg-slate-900 p-4 border border-slate-800 shadow-inner">
            <pre className="text-xs text-blue-300 font-mono leading-relaxed overflow-x-auto">
              {initialData?.changes 
                ? JSON.stringify(initialData.changes, null, 2) 
                : "// No change data recorded"}
            </pre>
          </div>
        </div>

        {/* Optional Notes */}
        {initialData?.notes && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Fingerprint className="w-4 h-4" /> System Notes
            </label>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded text-sm text-amber-900 italic">
              {initialData.notes}
            </div>
          </div>
        )}

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