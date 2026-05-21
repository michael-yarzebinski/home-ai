import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  InsertableCalendarSchema, 
  type InsertableCalendar,
  type Calendar 
} from '@home-ai/shared/domain/calendar/calendar';

import { EntityFormProps } from '../types';

// Field Components
import { TextInput } from '@/components/form/fields/general/text-input';
import { ArrayInput } from '@/components/form/fields/general/array-input';
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';
import { MultiRoleSelectInput } from '@/components/form/fields/domain/multi-role-select-input';

export type CalendarFormProps = Omit<EntityFormProps<InsertableCalendar, Calendar>, 'viewMode'> & {
    viewMode: 'EDIT' | 'READ';
};

export function CalendarForm({ initialData, viewMode, onSubmit, isLoading }: CalendarFormProps) {
  const form = useForm<InsertableCalendar>({
    resolver: zodResolver(InsertableCalendarSchema),
    defaultValues: {
      name: initialData?.name || '',
      friendlyName: initialData?.friendlyName || '',
      aliases: initialData?.aliases || [],
      readRoles: initialData?.readRoles || [],
      writeRoles: initialData?.writeRoles || [],
      color: initialData?.color || '#3b82f6', // Default blue
    },
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <EntityIdField value={initialData?.id} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextInput
            name="friendlyName"
            label="Friendly Name"
            placeholder="e.g. Family Schedule"
            viewMode={viewMode}
          />
          <TextInput
            name="name"
            label="System Name"
            viewMode={viewMode}
            forceReadMode={true} // System ID synced from source
            description="The internal identifier for this calendar."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <ArrayInput
            name="aliases"
            label="Voice Aliases"
            description="Alternate names the AI can use to identify this calendar."
            viewMode={viewMode}
          />
          <TextInput
            name="color"
            label="Calendar Color"
            placeholder="#000000"
            viewMode={viewMode}
            description="Hex code for UI display."
          />
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-4 opacity-70 uppercase tracking-tight">Access Control</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <MultiRoleSelectInput
              name="readRoles"
              label="View Events"
              viewMode={viewMode}
            />
            <MultiRoleSelectInput
              name="writeRoles"
              label="Manage Events"
              viewMode={viewMode}
            />
          </div>
        </div>

        <div className="pt-4 space-y-1">
        <EntityTimestampField createdAt={initialData?.createdAt} updatedAt={initialData?.updatedAt} />
        </div>

        {viewMode === 'EDIT' && (
          <div className="flex justify-end pt-6 border-t">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Calendar'}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}