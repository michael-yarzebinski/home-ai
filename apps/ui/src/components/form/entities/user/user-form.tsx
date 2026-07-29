import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  InsertableUserApiSchema, 
  type InsertableUserApi, 
  type User 
} from '@home-ai/shared/domain/user/user';

import { EntityFormProps } from '../types';

// Field Components
import { TextInput } from '@/components/form/fields/general/text-input';
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';
import { RoleSelectInput } from '@/components/form/fields/domain/role-select-input';

export type UserFormProps = EntityFormProps<InsertableUserApi, User>;

export function UserForm({ initialData, viewMode, onSubmit, isLoading }: UserFormProps) {
  const form = useForm<InsertableUserApi>({
    resolver: zodResolver(InsertableUserApiSchema),
    defaultValues: {
      name: initialData?.name || '',
      role: initialData?.role || undefined,
      phoneNumber: initialData?.phoneNumber || '',
      timezone: initialData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      quietHoursStart: initialData?.quietHoursStart || '',
      quietHoursEnd: initialData?.quietHoursEnd || '',
    },
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <EntityIdField value={initialData?.id} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextInput
            name="name"
            label="Full Name"
            placeholder="John Doe"
            viewMode={viewMode}
          />
          <RoleSelectInput
            name="role"
            label="System Role"
            viewMode={viewMode}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextInput
            name="phoneNumber"
            label="Phone Number"
            placeholder="+15551234567"
            viewMode={viewMode}
            description="Used for SMS notifications."
          />
          <TextInput
            name="timezone"
            label="Timezone"
            placeholder="America/New_York"
            viewMode={viewMode}
          />
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-4 opacity-70 uppercase tracking-tight">Notification Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextInput
              name="quietHoursStart"
              label="Quiet Hours Start"
              placeholder="22:00"
              viewMode={viewMode}
              description="Format: HH:mm"
            />
            <TextInput
              name="quietHoursEnd"
              label="Quiet Hours End"
              placeholder="07:00"
              viewMode={viewMode}
              description="Format: HH:mm"
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

        {viewMode !== 'READ' && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : viewMode === 'CREATE' ? 'Create User' : 'Update User'}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}