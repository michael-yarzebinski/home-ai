import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  InsertableAppConfigSchema, 
  type InsertableAppConfig,
  type AppConfig 
} from '@home-ai/shared/domain/app-config/app-config';

import { EntityFormProps } from '../types';

// Field Components
import { TextInput } from '@/components/form/fields/general/text-input';
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';

export type AppConfigFormProps = EntityFormProps<InsertableAppConfig, AppConfig>;

export function AppConfigForm({ initialData, viewMode, onSubmit, isLoading }: AppConfigFormProps) {
  const form = useForm<InsertableAppConfig>({
    resolver: zodResolver(InsertableAppConfigSchema),
    defaultValues: {
      key: initialData?.key || '',
      value: initialData?.value || '',
      description: initialData?.description || '',
    },
  });

  return (
    <FormProvider {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Admin ID Header */}
      <EntityIdField value={initialData?.id} />

      <div className="space-y-4">
        <TextInput
          name="key"
          label="Configuration Key"
          placeholder="e.g. system.theme.primary"
          viewMode={viewMode}
          // Keys are usually unique identifiers; lock them after creation
          forceReadMode={viewMode === 'EDIT'}
          description="The unique key used to look up this setting in the app."
        />

        <TextInput
          name="value"
          label="Value"
          placeholder="Enter configuration value..."
          viewMode={viewMode}
        />

        <TextInput
          name="description"
          label="Description"
          placeholder="What is this setting for?"
          viewMode={viewMode}
        />
      </div>

      {/* Admin Metadata Footer */}
      <div className="pt-4 border-t space-y-1">
        <EntityTimestampField createdAt={initialData?.createdAt} updatedAt={initialData?.updatedAt} />
      </div>

      {/* Action Footer */}
      {viewMode !== 'READ' && (
        <div className="flex justify-end gap-3 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : viewMode === 'CREATE' ? 'Create Config' : 'Save Changes'}
          </button>
        </div>
      )}
    </form>
    </FormProvider>
  );
}