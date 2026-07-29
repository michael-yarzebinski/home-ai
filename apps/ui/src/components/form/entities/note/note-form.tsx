import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  InsertableNoteSchema, 
  type InsertableNote, 
  type Note 
} from '@home-ai/shared/domain/note/note';

import { EntityFormProps } from '../types';

// Field Components
import { TextInput } from '@/components/form/fields/general/text-input';
import { ArrayInput } from '@/components/form/fields/general/array-input';
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';
import { MultiRoleSelectInput } from '@/components/form/fields/domain/multi-role-select-input';

export type NoteFormProps = Omit<EntityFormProps<InsertableNote, Note>, 'viewMode'> & {
    viewMode: 'EDIT' | 'READ';
};

export function NoteForm({ initialData, viewMode, onSubmit, isLoading }: NoteFormProps) {
  const form = useForm<InsertableNote>({
    resolver: zodResolver(InsertableNoteSchema),
    defaultValues: {
      name: initialData?.name || '',
      friendlyName: initialData?.friendlyName || '',
      aliases: initialData?.aliases || [],
      readRoles: initialData?.readRoles || [],
      writeRoles: initialData?.writeRoles || [],
    },
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Admin ID at the top */}
        <EntityIdField value={initialData?.id} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextInput
            name="friendlyName"
            label="Display Title"
            placeholder="e.g. Wi-Fi Password"
            viewMode={viewMode}
          />
          <TextInput
            name="name"
            label="Internal Name"
            viewMode={viewMode}
            forceReadMode={true} // System reference managed by AI
            description="The unique key the AI uses to index this note."
          />
        </div>

        <ArrayInput
          name="aliases"
          label="Voice Aliases"
          description="Alternative titles you might use when asking the AI to 'show me the ...' note."
          viewMode={viewMode}
        />

        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-4 opacity-70 uppercase tracking-tight">Security & Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

        {/* Unified Timestamp Field Footer */}
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
              {isLoading ? 'Updating...' : 'Update Note'}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}