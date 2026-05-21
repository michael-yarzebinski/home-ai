import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  InsertableNotificationQueueSchema, 
  type InsertableNotificationQueue, 
  type NotificationQueue 
} from '@home-ai/shared/domain/notification-queue/notification-queue';

import { EntityFormProps } from '../types';

// Field Components
import { TextInput } from '@/components/form/fields/general/text-input';
import { SelectInput } from '@/components/form/fields/general/select-input';
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';
import { UserSelectInput } from '@/components/form/fields/domain/user-select-input';

export type NotificationQueueFormProps = EntityFormProps<InsertableNotificationQueue, NotificationQueue>;

export function NotificationQueueForm({ initialData, viewMode, onSubmit, isLoading }: NotificationQueueFormProps) {
  const form = useForm<InsertableNotificationQueue>({
    resolver: zodResolver(InsertableNotificationQueueSchema),
    defaultValues: {
      userId: initialData?.userId || '',
      message: initialData?.message || '',
      importance: initialData?.importance || 'normal',
      // Ensure we have a valid ISO string or Date for the input
      scheduledFor: initialData?.scheduledFor ? new Date(initialData.scheduledFor) : new Date(),
    },
  });

  const importanceOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Normal', value: 'normal' },
    { label: 'High', value: 'high' },
  ];

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Record ID only shows in Edit/Read modes */}
        <EntityIdField value={initialData?.id} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UserSelectInput
            name="userId"
            label="Recipient"
            viewMode={viewMode}
            description="The user who will receive this notification."
          />
          
          <SelectInput
            name="importance"
            label="Importance"
            options={importanceOptions}
            viewMode={viewMode}
          />
        </div>

        <TextInput
          name="message"
          label="Message Content"
          placeholder="Enter the notification text..."
          viewMode={viewMode}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextInput
            name="scheduledFor"
            label="Schedule Delivery"
            viewMode={viewMode}
            description="When the system should send this alert."
          />
        </div>

        {viewMode !== 'CREATE' && (
          <div className="pt-4 space-y-1 border-t">
            <EntityTimestampField 
              createdAt={initialData?.createdAt} 
              updatedAt={initialData?.updatedAt} 
            />
          </div>
        )}

        {viewMode !== 'READ' && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : viewMode === 'CREATE' ? 'Schedule Notification' : 'Update Notification'}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}