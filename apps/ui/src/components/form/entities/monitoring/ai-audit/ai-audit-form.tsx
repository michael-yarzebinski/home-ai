import { useForm, FormProvider } from 'react-hook-form';
import { type AIAudit } from '@home-ai/shared/domain/monitoring/ai-audit/ai-audit';
import { EntityFormProps } from '../../types';

// Domain Fields
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';
import { UserSelectInput } from '@/components/form/fields/domain/user-select-input';

// UI Components
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import { TextAreaInput } from '../../../fields/general/text-area-input';

export function AIAuditForm({ 
  initialData, 
}: EntityFormProps<any, AIAudit>) {
  
  const form = useForm<AIAudit>({
    defaultValues: initialData,
  });

  return (
    <FormProvider {...form}>
      <form className="space-y-8">
        {/* Header Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-6">
            <EntityIdField value={initialData?.id}/>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Status</span>
              {initialData?.success ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-emerald-200 gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Success
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="w-3 h-3" /> Failed
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Latency</span>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                {initialData?.durationMs ? `${initialData.durationMs}ms` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Identity & Session */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UserSelectInput name="userId" label="User" viewMode="READ" />
          <TextAreaInput 
            name="chatSessionId" 
            label="Chat Session ID" 
            viewMode="READ" 
            placeholder="No session associated" 
          />
        </div>

        {/* Message Content */}
        <div className="space-y-6">
          <TextAreaInput 
            name="userMessage" 
            label="User Message" 
            viewMode="READ" 
          />
          
          <TextAreaInput 
            name="finalResponse" 
            label="AI Final Response" 
            viewMode="READ" 
            className="bg-muted/30 italic"
          />
        </div>

        {/* Technical Details / Tool Calls */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Zap className="w-4 h-4" />
            Tool execution logs
          </div>
          <div className="rounded-md border border-border/50 bg-muted/50 p-4 overflow-x-auto">
            <pre className="text-xs font-mono text-foreground">
              {initialData?.toolCalls 
                ? JSON.stringify(initialData.toolCalls, null, 2) 
                : "// No tool calls recorded for this interaction"}
            </pre>
          </div>
        </div>

        <div className="pt-4 border-t">
          <EntityTimestampField 
            createdAt={initialData?.createdAt} 
            updatedAt={initialData?.createdAt} // Audits are immutable, so updated == created
          />
        </div>
      </form>
    </FormProvider>
  );
}