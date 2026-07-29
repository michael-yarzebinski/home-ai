import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  InsertableChecklistSchema, 
  type InsertableChecklist, 
  type Checklist 
} from '@home-ai/shared/domain/checklist/checklist';

import { EntityFormProps } from '../types';

// General Fields
import { TextInput } from '@/components/form/fields/general/text-input';

// Domain Fields
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';
import { MultiRoleSelectInput } from '@/components/form/fields/domain/multi-role-select-input';

export function ChecklistForm({ 
  initialData, 
  viewMode, 
  onSubmit, 
  isLoading,
  formId,
}: EntityFormProps<InsertableChecklist, Checklist>) {
  
  const form = useForm<InsertableChecklist>({
    resolver: zodResolver(InsertableChecklistSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      readRoles: [],
      writeRoles: [],
    },
  });

  return (
    <FormProvider {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <EntityIdField value={initialData?.id} />

        {/* --- Primary Details --- */}
        <div className="grid grid-cols-1 gap-6">
          <TextInput 
            name="name" 
            label="Checklist Name" 
            placeholder="e.g. Morning Routine" 
            viewMode={viewMode} 
          />
          
          <TextInput 
            name="description" 
            label="Description" 
            placeholder="Optional summary of this checklist..." 
            viewMode={viewMode} 
          />
        </div>

        {/* --- Permissions Section --- */}
        <div className="p-6 border border-border/50 rounded-lg bg-muted/30 space-y-6">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Access Control
          </h3>
          
          <div className="grid grid-cols-1 gap-8">
            <MultiRoleSelectInput
              name="readRoles"
              label="Read Permission"
              viewMode={viewMode}
            />
            <MultiRoleSelectInput
              name="writeRoles"
              label="Write Permission"
              viewMode={viewMode}
            />
          </div>
        </div>

        {/* --- Metadata --- */}
        {viewMode !== 'CREATE' && (
          <div className="pt-4 border-t">
            <EntityTimestampField 
              createdAt={initialData?.createdAt} 
              updatedAt={initialData?.updatedAt} 
            />
          </div>
        )}

        {/* --- Form Actions --- */}
        {viewMode !== 'READ' && !formId && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Saving...' : viewMode === 'CREATE' ? 'Create Checklist' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}