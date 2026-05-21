import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  InsertablePendingActionSchema, 
  type InsertablePendingAction, 
  type PendingAction 
} from '@home-ai/shared/domain/pending-action/pending-action';

import { EntityFormProps } from '../types';

// Field Components
import { TextInput } from '@/components/form/fields/general/text-input';
import { SelectInput } from '@/components/form/fields/general/select-input';
import { JsonInput } from '@/components/form/fields/general/json-input';
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';
import { UserSelectInput } from '@/components/form/fields/domain/user-select-input';

export type PendingActionFormProps = Omit<EntityFormProps<InsertablePendingAction, PendingAction>, 'viewMode'> & {
    viewMode: 'EDIT' | 'READ';
};

export function PendingActionForm({ initialData, viewMode, onSubmit, isLoading }: PendingActionFormProps) {
  const form = useForm<InsertablePendingAction>({
    resolver: zodResolver(InsertablePendingActionSchema),
    defaultValues: {
      toolId: initialData?.toolId || '',
      requesterId: initialData?.requesterId || '',
      proposedArgs: initialData?.proposedArgs || {},
      status: initialData?.status || 'pending',
      reason: initialData?.reason || '',
      executedBy: initialData?.executedBy || '',
    },
  });

  const statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex justify-between items-start">
          <EntityIdField value={initialData?.id} />
          {initialData?.readableId && (
            <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
              REF: #{initialData.readableId}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextInput
            name="toolId"
            label="Tool to Execute"
            viewMode={viewMode}
            forceReadMode={true}
            description="The specific AI tool requested."
          />
          <SelectInput
            name="status"
            label="Current Status"
            options={statusOptions}
            viewMode={viewMode}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UserSelectInput
            name="requesterId"
            label="Requested By"
            viewMode={viewMode}
            forceReadMode={true}
          />
          <UserSelectInput
            name="executedBy"
            label="Decision Made By"
            viewMode={viewMode}
            description="The admin who approved or rejected this."
          />
        </div>

        <TextInput
          name="reason"
          label="Status Reason / Feedback"
          placeholder="e.g. Too late at night to play loud music."
          viewMode={viewMode}
        />

        <JsonInput
          name="proposedArgs"
          label="Proposed Arguments"
          viewMode={viewMode}
          forceReadMode={true} // Arguments shouldn't be edited, only approved or rejected
        />

        <div className="pt-4 space-y-1 border-t">
          <EntityTimestampField 
            createdAt={initialData?.createdAt} 
            updatedAt={initialData?.updatedAt} 
          />
        </div>

        {viewMode === 'EDIT' && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Submit Decision'}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}