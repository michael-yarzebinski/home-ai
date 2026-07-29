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

const sectionHeadingClass =
  'text-[10px] font-bold uppercase tracking-widest text-muted-foreground';

const submitButtonClassName =
  'px-6 py-2 h-9 bg-primary text-primary-foreground rounded-md text-xs font-bold uppercase tracking-widest shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors';

type RecurringChecklistItemFormProps = EntityFormProps<
  InsertableRecurringChecklistItem,
  RecurringChecklistItem
> & {
  lockChecklistId?: boolean;
};

export function RecurringChecklistItemForm({ 
  initialData, 
  viewMode, 
  onSubmit, 
  isLoading,
  lockChecklistId = false,
}: RecurringChecklistItemFormProps) {
  
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <EntityIdField value={initialData?.id} />

        <div className="space-y-4">
          <TextInput name="title" label="Blueprint Title" placeholder="Monthly HVAC Check" viewMode={viewMode} />
          <TextInput
            name="description"
            label="Default Description"
            viewMode={viewMode}
          />
          <ChecklistSelectInput
            name="checklistId"
            label="Parent Checklist"
            viewMode={lockChecklistId ? 'READ' : viewMode}
          />
        </div>

        <div className="rounded-lg border border-border/50 bg-muted/30 p-5 space-y-5">
          <h3 className={sectionHeadingClass}>Recurrence & logic</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5 border-t border-border/50">
            {selectedTriggerType === RecurringChecklistItemTriggerType.CRON ? (
              <CronInput name="triggerConfig.cron" label="Schedule" viewMode={viewMode} />
            ) : (
              <TextInput name="triggerConfig.eventTag" label="Event Tag" placeholder="system.startup" viewMode={viewMode} />
            )}
            <NumberInput name="triggerConfig.dueInDays" label="Days to Complete" description="How many days until the generated item is due" viewMode={viewMode} />
          </div>
        </div>

        <div className="space-y-4 border-t border-border/50 pt-6">
          <h3 className={sectionHeadingClass}>Dependencies & tags</h3>
          <ChecklistItemMultiSelectInput
            name="dependsOnRecurringIds"
            label="Depends On (Recurring Blueprints Only)"
            checklistId={selectedChecklistId}
            itemType="RECURRING"
            viewMode={viewMode}
          />
          <ArrayInput name="tags" label="Default Tags" viewMode={viewMode} />
        </div>

        <div className="space-y-4 border-t border-border/50 pt-6">
          <h3 className={sectionHeadingClass}>Resource template</h3>
          <div className="grid grid-cols-1 gap-5">
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
          <div className="flex justify-end border-t border-border/50 pt-4">
            <button type="submit" disabled={isLoading} className={submitButtonClassName}>
              {isLoading ? 'Saving...' : viewMode === 'CREATE' ? 'Add recurring item' : 'Save changes'}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}