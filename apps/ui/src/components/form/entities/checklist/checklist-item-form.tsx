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
import { ArrayInput } from '@/components/form/fields/general/array-input';

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

type ChecklistItemFormProps = EntityFormProps<InsertableChecklistItem, ChecklistItem> & {
  /** When true, parent checklist cannot be changed (e.g. editing from checklist details). */
  lockChecklistId?: boolean;
};

export function ChecklistItemForm({ 
  initialData, 
  viewMode, 
  onSubmit, 
  isLoading,
  lockChecklistId = false,
}: ChecklistItemFormProps) {
  
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <EntityIdField value={initialData?.id} />

        <div className="space-y-4">
          <TextInput name="title" label="Title" viewMode={viewMode} />
          <TextInput
            name="description"
            label="Description"
            viewMode={viewMode}
          />
          <ChecklistSelectInput
            name="checklistId"
            label="Parent Checklist"
            viewMode={lockChecklistId ? 'READ' : viewMode}
          />
        </div>

        <div className="rounded-lg border border-border/50 bg-muted/30 p-5 space-y-5">
          <h3 className={sectionHeadingClass}>Status & scheduling</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
            <div className="sm:col-span-2 pb-1">
              <ArrayInput name="tags" label="Tags" viewMode={viewMode} />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-border/50 pt-6">
          <h3 className={sectionHeadingClass}>Task logic</h3>
          <ChecklistItemMultiSelectInput
            name="dependsOn"
            label="Depends On (Blocking Tasks)"
            checklistId={selectedChecklistId}
            itemType="STANDARD"
            viewMode={viewMode}
          />
        </div>

        <div className="space-y-4 border-t border-border/50 pt-6">
          <h3 className={sectionHeadingClass}>Reference materials</h3>
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
            <TextInput name="metadata.manualUrl" label="Manual URL" viewMode={viewMode} />
          </div>
        </div>

        {viewMode !== 'CREATE' && (
          <EntityTimestampField createdAt={initialData?.createdAt} updatedAt={initialData?.updatedAt} />
        )}

        {viewMode !== 'READ' && (
          <div className="flex justify-end border-t border-border/50 pt-4">
            <button type="submit" disabled={isLoading} className={submitButtonClassName}>
              {isLoading ? 'Saving...' : viewMode === 'CREATE' ? 'Add item' : 'Save item'}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
