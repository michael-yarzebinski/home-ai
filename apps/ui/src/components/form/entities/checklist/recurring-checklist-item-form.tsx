import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  InsertableRecurringChecklistItemSchema, 
  type InsertableRecurringChecklistItem, 
  type RecurringChecklistItem,
  RecurringChecklistItemTriggerType
} from '@home-ai/shared/domain/checklist/recurring-checklist-item';
import { ChecklistItemPriority } from '@home-ai/shared/domain/checklist/checklist-item';

import { EntityFormProps } from '../types';

// General Fields
import { TextInput } from '@/components/form/fields/general/text-input';
import { SelectInput } from '@/components/form/fields/general/select-input';
import { NumberInput } from '@/components/form/fields/general/number-input';
import { ArrayInput } from '@/components/form/fields/general/array-input';
import { CronInput } from '@/components/form/fields/general/cron-input';

// Domain Fields
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';
import { UserSelectInput } from '@/components/form/fields/domain/user-select-input';
import { ChecklistSelectInput } from '@/components/form/fields/domain/checklist-select-input';
import { ChecklistItemMultiSelectInput } from '@/components/form/fields/domain/checklist-item-multi-select-input';

export function RecurringChecklistItemForm({ 
  initialData, 
  viewMode, 
  onSubmit, 
  isLoading 
}: EntityFormProps<InsertableRecurringChecklistItem, RecurringChecklistItem>) {
  
  const form = useForm<InsertableRecurringChecklistItem>({
    resolver: zodResolver(InsertableRecurringChecklistItemSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      checklistId: '',
      priority: ChecklistItemPriority.MEDIUM,
      triggerType: RecurringChecklistItemTriggerType.CRON,
      triggerConfig: { cron: '0 0 * * *', dueInDays: 1 },
      tags: [],
      dependsOnRecurringIds: [],
      metadata: {
        videoLinks: [],
        requiredItems: []
      }
    },
  });

  const { control, handleSubmit } = form;

  // Watch fields for dynamic UI logic
  const selectedChecklistId = useWatch({ control, name: 'checklistId' });
  const selectedTriggerType = useWatch({ control, name: 'triggerType' });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <EntityIdField value={initialData?.id} />

        {/* --- Header Details --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <TextInput name="title" label="Blueprint Title" placeholder="Monthly HVAC Check" viewMode={viewMode} />
            <ChecklistSelectInput name="checklistId" label="Parent Checklist" viewMode={viewMode} />
          </div>
          <TextInput 
            name="description" 
            label="Default Description" 
            viewMode={viewMode} 
          />
        </div>

        {/* --- Scheduling & Assignment --- */}
        <div className="p-6 border rounded-lg bg-slate-50/50 space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Recurrence & Logic</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SelectInput 
              name="triggerType" 
              label="Trigger Logic" 
              viewMode={viewMode}
              options={Object.values(RecurringChecklistItemTriggerType).map(t => ({ label: t, value: t }))} 
            />
            <SelectInput 
              name="priority" 
              label="Default Priority" 
              viewMode={viewMode}
              options={Object.values(ChecklistItemPriority).map(p => ({ label: p.toUpperCase(), value: p }))} 
            />
            <UserSelectInput name="defaultAssigneeId" label="Default Assignee" viewMode={viewMode} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            {selectedTriggerType === RecurringChecklistItemTriggerType.CRON ? (
              <CronInput name="triggerConfig.cron" label="Schedule (CRON)" viewMode={viewMode} />
            ) : (
              <TextInput name="triggerConfig.eventTag" label="Event Tag" placeholder="system.startup" viewMode={viewMode} />
            )}
            <NumberInput name="triggerConfig.dueInDays" label="Days to Complete" description="How many days until the generated item is due" viewMode={viewMode} />
          </div>
        </div>

        {/* --- Dependencies & Categorization --- */}
        <div className="grid grid-cols-1 gap-6">
          <ChecklistItemMultiSelectInput
            name="dependsOnRecurringIds"
            label="Depends On (Recurring Blueprints Only)"
            checklistId={selectedChecklistId}
            itemType="RECURRING" // Specifically filter for recurring items as per schema
            viewMode={viewMode}
          />
          <ArrayInput name="tags" label="Default Tags" viewMode={viewMode} />
        </div>

        {/* --- Reference Metadata --- */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Resource Template</h3>
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
          </div>
        </div>

        {viewMode !== 'CREATE' && (
          <EntityTimestampField createdAt={initialData?.createdAt} updatedAt={initialData?.updatedAt} />
        )}

        {viewMode !== 'READ' && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50"
            >
              {isLoading ? 'Saving Blueprint...' : viewMode === 'CREATE' ? 'Create Recurring Item' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}