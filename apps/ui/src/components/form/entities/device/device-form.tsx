import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  type InsertableDevice,
  type Device, 
  InsertableDeviceSchema
} from '@home-ai/shared/domain/device/device';
import { LLMModelType } from '@home-ai/shared/domain/llm/llm-model-type';

import { EntityFormProps } from '../types';

import { TextInput } from '@/components/form/fields/general/text-input';
import { ArrayInput } from '@/components/form/fields/general/array-input';
import { JsonInput } from '@/components/form/fields/general/json-input';
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';
import { MultiRoleSelectInput } from '@/components/form/fields/domain/multi-role-select-input';
import { SwitchInput } from '../../fields/general/switch-input';
import { SelectInput } from '@/components/form/fields/general/select-input';

// We type against InsertableDevice for the form state, but we know initialData is a full Device
export type DeviceFormProps = Omit<EntityFormProps<InsertableDevice, Device>, 'viewMode'> & {
    viewMode: 'EDIT' | 'READ'; // Remove CREATE from allowed modes
};

const LLM_MODEL_OPTIONS = [
  { label: 'Soon (default)', value: LLMModelType.SOON },
  { label: 'Immediate (fast path)', value: LLMModelType.IMMEDIATE },
];

export function DeviceForm({ initialData, viewMode, onSubmit, isLoading, formId }: DeviceFormProps) {
  const form = useForm<InsertableDevice>({
    resolver: zodResolver(InsertableDeviceSchema), 
    defaultValues: {
      slug: initialData?.slug || '',
      friendlyName: initialData?.friendlyName || '',
      aliases: initialData?.aliases || [],
      room: initialData?.room || '',
      category: initialData?.category || '',
      readRoles: initialData?.readRoles || [],
      writeRoles: initialData?.writeRoles || [],
      isTimeSensitive: initialData?.isTimeSensitive ?? false,
      llmModelType: initialData?.llmModelType ?? LLMModelType.SOON,
      extraMetadata: initialData?.extraMetadata || {},
    },
  });

  return (
    <FormProvider {...form}>
    <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <EntityIdField value={initialData?.id} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextInput
          name="friendlyName"
          label="Friendly Name"
          viewMode={viewMode}
          description="How the AI refers to this device."
        />
        <TextInput
          name="slug"
          label="System Slug"
          viewMode={viewMode}
          forceReadMode={true} // ALWAYS locked. Slugs are managed by the AI/System.
          description="The internal identifier used by integrations."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextInput name="room" label="Room" viewMode={viewMode} />
        <TextInput name="category" label="Category" viewMode={viewMode} />
      </div>

      <ArrayInput
        name="aliases"
        label="Aliases"
        description="Add additional names for this device."
        viewMode={viewMode}
      />

      <div className="pt-4 border-t">
        <h3 className="text-sm font-semibold mb-4 opacity-70 uppercase tracking-tight">Security Overrides</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <MultiRoleSelectInput name="readRoles" label="Read Access" viewMode={viewMode} />
          <MultiRoleSelectInput name="writeRoles" label="Write Access" viewMode={viewMode} />
        </div>
      </div>

      <div className="pt-4 border-t space-y-6">
        <SwitchInput
          name="isTimeSensitive"
          label="High Priority"
          description="Treat this device as latency-critical (e.g. Motion sensors)."
          viewMode={viewMode}
        />

        <SelectInput
          name="llmModelType"
          label="Automation LLM"
          description="Which model tier to use when this device triggers automations."
          viewMode={viewMode}
          options={LLM_MODEL_OPTIONS}
        />
        
        <JsonInput
          name="extraMetadata"
          label="Integration Metadata"
          viewMode={viewMode}
        />
      </div>

      <div className="pt-4 space-y-1">
        <EntityTimestampField createdAt={initialData?.createdAt} updatedAt={initialData?.updatedAt} />
      </div>

      {viewMode === 'EDIT' && !formId && (
        <div className="flex justify-end pt-6 border-t">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium"
          >
            {isLoading ? 'Updating...' : 'Update Configuration'}
          </button>
        </div>
      )}
    </form>
    </FormProvider>
  );
}
