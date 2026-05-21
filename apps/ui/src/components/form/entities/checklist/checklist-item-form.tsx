import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  InsertableChecklistItemSchema, 
  type InsertableChecklistItem, 
  type ChecklistItem,
  ChecklistItemPriority,
  ChecklistItemStatus
} from '@home-ai/shared/domain/checklist/checklist-item';

import { EntityFormProps } from '../types';

// General Fields
import { TextInput } from '@/components/form/fields/general/text-input';
import { SelectInput } from '@/components/form/fields/general/select-input';
import { DateInput } from '@/components/form/fields/general/date-input';
import { ArrayInput } from '@/components/form/fields/general/array-input'; // Corrected name

// Domain Fields
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';
import { UserSelectInput } from '@/components/form/fields/domain/user-select-input';
import { ChecklistSelectInput } from '@/components/form/fields/domain/checklist-select-input';
import { ChecklistItemMultiSelectInput } from '@/components/form/fields/domain/checklist-item-multi-select-input';

export function ChecklistItemForm({ 
  initialData, 
  viewMode, 
  onSubmit, 
  isLoading 
}: EntityFormProps<InsertableChecklistItem, ChecklistItem>) {
  
  const form = useForm<InsertableChecklistItem>({
    resolver: zodResolver(InsertableChecklistItemSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      checklistId: '',
      priority: ChecklistItemPriority.MEDIUM,
      status: ChecklistItemStatus.PENDING,
      dependsOn: [],
      tags: [],
      metadata: {
        videoLinks: [],
        requiredItems: [],
        manualUrl: ''
      }
    },
  });

  const selectedChecklistId = useWatch({ control: form.control, name: 'checklistId' });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <EntityIdField value={initialData?.id} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <TextInput name="title" label="Title" viewMode={viewMode} />
            <ChecklistSelectInput name="checklistId" label="Parent Checklist" viewMode={viewMode} />
          </div>
          <TextInput 
            name="description" 
            label="Description" 
            viewMode={viewMode} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border rounded-lg bg-slate-50/50">
          <SelectInput 
            name="status" 
            label="Status" 
            viewMode={viewMode}
            options={Object.values(ChecklistItemStatus).map(s => ({ label: s.toUpperCase(), value: s }))} 
          />
          <SelectInput 
            name="priority" 
            label="Priority" 
            viewMode={viewMode}
            options={Object.values(ChecklistItemPriority).map(p => ({ label: p.toUpperCase(), value: p }))} 
          />
          <UserSelectInput name="assigneeId" label="Assignee" viewMode={viewMode} />
          <DateInput name="dueDate" label="Due Date" viewMode={viewMode} />
          <ArrayInput name="tags" label="Tags" viewMode={viewMode} />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Task Logic</h3>
          <ChecklistItemMultiSelectInput
            name="dependsOn"
            label="Depends On (Blocking Tasks)"
            checklistId={selectedChecklistId}
            itemType="STANDARD"
            viewMode={viewMode}
          />
        </div>

        <div className="space-y-4 border-t pt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Reference Materials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ArrayInput 
              name="metadata.requiredItems" 
              label="Required Tools/Supplies" 
              viewMode={viewMode} 
            />
            <ArrayInput 
              name="metadata.videoLinks" 
              label="Instructional Video URLs" 
              viewMode={viewMode} 
            />
            <div className="md:col-span-2">
              <TextInput name="metadata.manualUrl" label="Manual URL" viewMode={viewMode} />
            </div>
          </div>
        </div>

        {viewMode !== 'CREATE' && (
          <EntityTimestampField createdAt={initialData?.createdAt} updatedAt={initialData?.updatedAt} />
        )}

        {viewMode !== 'READ' && (
          <div className="flex justify-end">
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}