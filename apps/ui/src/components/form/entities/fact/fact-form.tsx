import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  InsertableFactSchema, 
  type InsertableFact,
  type Fact 
} from '@home-ai/shared/domain/fact/fact';

import { EntityFormProps } from '../types';

// Field Components
import { TextInput } from '@/components/form/fields/general/text-input';
import { ArrayInput } from '@/components/form/fields/general/array-input';
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';
import { MultiRoleSelectInput } from '@/components/form/fields/domain/multi-role-select-input';

export type FactFormProps = Omit<EntityFormProps<InsertableFact, Fact>, 'viewMode'> & {
    viewMode: 'CREATE' | 'EDIT' | 'READ';
};

export function FactForm({ initialData, viewMode, onSubmit, isLoading, formId }: FactFormProps) {
  const form = useForm<InsertableFact>({
    resolver: zodResolver(InsertableFactSchema),
    defaultValues: {
      key: initialData?.key || '',
      value: initialData?.value || '',
      tags: initialData?.tags || [],
      readRoles: initialData?.readRoles || [],
      writeRoles: initialData?.writeRoles || [],
    },
  });

  return (
    <FormProvider {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {viewMode !== 'CREATE' && <EntityIdField value={initialData?.id} />}

        <div className="space-y-4">
          <TextInput
            name="key"
            label="Fact Key"
            placeholder="e.g. user.preferences.coffee"
            viewMode={viewMode === 'READ' ? 'READ' : 'EDIT'}
            description="The unique identifier the AI uses to recall this fact."
          />

          <TextInput
            name="value"
            label="Fact Value"
            placeholder="e.g. Black with no sugar"
            viewMode={viewMode}
          />
        </div>

        <ArrayInput
          name="tags"
          label="Tags"
          placeholder="Add tag..."
          description="Categorize this fact for better retrieval (e.g. 'preference', 'family')."
          viewMode={viewMode}
        />

        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-4 opacity-70 uppercase tracking-tight">Access Control</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <MultiRoleSelectInput
              name="readRoles"
              label="Who can recall?"
              viewMode={viewMode}
            />
            <MultiRoleSelectInput
              name="writeRoles"
              label="Who can change?"
              viewMode={viewMode}
            />
          </div>
        </div>

        {viewMode !== 'CREATE' && (
          <div className="pt-4 space-y-1 border-t">
            <EntityTimestampField 
              createdAt={initialData?.createdAt} 
              updatedAt={initialData?.updatedAt} 
            />
          </div>
        )}

        {(viewMode === 'EDIT' || viewMode === 'CREATE') && !formId && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50"
            >
              {viewMode === 'CREATE'
                ? isLoading ? 'Creating...' : 'Create Fact'
                : isLoading ? 'Updating...' : 'Update Fact'}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}