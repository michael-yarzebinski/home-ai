import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  InsertableToolSchema, 
  type InsertableTool, 
  type Tool 
} from '@home-ai/shared/domain/tool/tool';

import { EntityFormProps } from '../types';

// Field Components
import { TextInput } from '@/components/form/fields/general/text-input';
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';
import { MultiRoleSelectInput } from '@/components/form/fields/domain/multi-role-select-input';

export type ToolFormProps = Omit<EntityFormProps<InsertableTool, Tool>, 'viewMode'> & {
    viewMode: 'EDIT' | 'READ';
};

export function ToolForm({ initialData, viewMode, onSubmit, isLoading }: ToolFormProps) {
  const form = useForm<InsertableTool>({
    resolver: zodResolver(InsertableToolSchema),
    defaultValues: {
      name: initialData?.name || '',
      friendlyName: initialData?.friendlyName || '',
      hints: initialData?.hints || '',
      requestRoles: initialData?.requestRoles || [],
      writeRoles: initialData?.writeRoles || [],
      notifyRoles: initialData?.notifyRoles || [],
    },
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <EntityIdField value={initialData?.id} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextInput
            name="friendlyName"
            label="Tool Label"
            placeholder="e.g. Smart Lock Controller"
            viewMode={viewMode}
          />
          <TextInput
            name="name"
            label="System Function Name"
            viewMode={viewMode}
            forceReadMode={true}
            description="The internal code identifier for this tool."
          />
        </div>

        <TextInput
          name="hints"
          label="AI Instructions / Hints"
          placeholder="e.g. Use this tool only when the user explicitly asks to secure the house..."
          viewMode={viewMode}
          description="Guidelines provided to the AI to help it decide when to invoke this tool."
        />

        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-4 opacity-70 uppercase tracking-tight">Permission Matrix</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <MultiRoleSelectInput
                name="requestRoles"
                label="Can Request Execution"
                description="Roles that can ask the AI to use this tool."
                viewMode={viewMode}
              />
              <MultiRoleSelectInput
                name="writeRoles"
                label="Can Modify Config"
                description="Roles that can edit this tool's settings."
                viewMode={viewMode}
              />
            </div>
            <div className="max-w-md">
              <MultiRoleSelectInput
                name="notifyRoles"
                label="Notify on Execution"
                description="Roles that receive a notification when this tool is used."
                viewMode={viewMode}
              />
            </div>
          </div>
        </div>

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
              {isLoading ? 'Updating Tool...' : 'Save Permissions & Hints'}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}