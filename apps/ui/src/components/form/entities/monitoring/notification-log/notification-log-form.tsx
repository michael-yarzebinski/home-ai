import { useForm, FormProvider } from 'react-hook-form';
import { type NotificationLog } from '@home-ai/shared/domain/monitoring/notification-log/notification-log';
import { EntityFormProps } from '../../types';

// Domain Fields
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';
import { UserSelectInput } from '@/components/form/fields/domain/user-select-input';

// UI Components
import { Bell, Send } from 'lucide-react';
import { TextAreaInput } from '../../../fields/general/text-area-input';

export function NotificationLogForm({ 
  initialData, 
}: EntityFormProps<any, NotificationLog>) {
  
  const form = useForm<NotificationLog>({
    defaultValues: initialData,
  });

  return (
    <FormProvider {...form}>
      <form className="space-y-6">
        {/* Header Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-6">
            <EntityIdField value={initialData?.id}/>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Channel</span>
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Send className="w-3.5 h-3.5 text-primary" />
                System Dispatch
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
            <Bell className="w-3 h-3 text-blue-500" />
            Outbound Alert
          </div>
        </div>

        {/* Recipient */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <UserSelectInput 
              name="userId" 
              label="Recipient" 
              viewMode="READ" 
            />
            <p className="text-xs text-muted-foreground italic">
              This log tracks the content sent to the user via their configured notification channels.
            </p>
          </div>
        </div>

        {/* Message Content */}
        <div className="space-y-3">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Dispatched Message
          </label>
          <div className="relative">
            <TextAreaInput 
              name="message" 
              label="" 
              viewMode="READ" 
              className="bg-slate-50/50 min-h-[120px] text-base leading-relaxed border-dashed"
            />
            <div className="absolute top-2 right-2 opacity-10">
              <Bell className="w-12 h-12" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <EntityTimestampField 
            createdAt={initialData?.createdAt} 
            updatedAt={initialData?.createdAt} // Notifications are historical snapshots
          />
        </div>
      </form>
    </FormProvider>
  );
}