import { useForm, FormProvider, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { 
  InsertableAutomationRuleSchema, 
  type InsertableAutomationRule, 
  type AutomationRule,
  TriggerType,
  ActionType
} from '@home-ai/shared/domain/automation-rule/automation-rule';

import { EntityFormProps } from '../types';

// General Fields
import { TextInput } from '@/components/form/fields/general/text-input';
import { NumberInput } from '@/components/form/fields/general/number-input';
import { SelectInput } from '@/components/form/fields/general/select-input';
import { JsonInput } from '@/components/form/fields/general/json-input';

// Domain Fields
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';
import { UserSelectInput } from '@/components/form/fields/domain/user-select-input';
import { DeviceSelectInput } from '@/components/form/fields/domain/device-select-input';
import { ToolSelectInput } from '@/components/form/fields/domain/tool-select-input';
import { CronInput } from '@/components/form/fields/general/cron-input';

export function AutomationRuleForm({ initialData, viewMode, onSubmit, isLoading }: EntityFormProps<InsertableAutomationRule, AutomationRule>) {
  const form = useForm<InsertableAutomationRule>({
    resolver: zodResolver(InsertableAutomationRuleSchema),
    defaultValues: initialData || {
      name: '',
      userId: '',
      cooldownMinutes: 5,
      trigger: { type: TriggerType.TIME, cron: '0 * * * *', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      actions: []
    },
  });

  const { control, handleSubmit } = form;

  // 1. Handle Dynamic Actions Array
  const { fields, append, remove } = useFieldArray({
    control,
    name: "actions"
  });

  // 2. Watch trigger type to conditionally render fields
  const selectedTriggerType = useWatch({ control, name: 'trigger.type' });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <EntityIdField value={initialData?.id} />

        {/* --- SECTION: Basic Info --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <TextInput name="name" label="Rule Name" placeholder="Nightly Lockdown" viewMode={viewMode} />
            <UserSelectInput name="userId" label="Owner / Context User" viewMode={viewMode} />
          </div>
          <div className="space-y-4">
            <NumberInput name="cooldownMinutes" label="Cooldown (Minutes)" viewMode={viewMode} />
            <TextInput name="description" label="Description" placeholder="Optional notes on why this exists..." viewMode={viewMode} />
          </div>
        </div>

        {/* --- SECTION: Trigger Configuration --- */}
        <div className="p-6 border rounded-lg bg-slate-50/50 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-lg font-semibold">Trigger Configuration</h3>
            <div className="w-64">
              <SelectInput
                name="trigger.type"
                label="Trigger Type"
                viewMode={viewMode}
                options={Object.values(TriggerType).map(t => ({ label: t, value: t }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedTriggerType === TriggerType.DEVICE && (
              <>
                <DeviceSelectInput name="trigger.deviceId" label="Target Device" viewMode={viewMode} />
                <TextInput name="trigger.intent" label="Trigger Intent" placeholder="When temp is > 80" viewMode={viewMode} />
              </>
            )}

            {selectedTriggerType === TriggerType.TIME && (
              <>
                <CronInput name="trigger.cron" label="Schedule (CRON)" viewMode={viewMode} />
                <TextInput name="trigger.timezone" label="Timezone" viewMode={viewMode} />
              </>
            )}

            {selectedTriggerType === TriggerType.SYSTEM && (
              <>
                <TextInput name="trigger.eventName" label="System Event" placeholder="startup" viewMode={viewMode} />
                <TextInput name="trigger.intent" label="Intent Filter" viewMode={viewMode} />
              </>
            )}

            {selectedTriggerType === TriggerType.TOOL_EVENT && (
              <ToolSelectInput name="trigger.toolName" label="Linked Tool" viewMode={viewMode} />
            )}
          </div>
        </div>

        {/* --- SECTION: Actions --- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Execution Actions</h3>
            {viewMode !== 'READ' && (
              <button
                type="button"
                onClick={() => append({ id: crypto.randomUUID(), type: ActionType.NOTIFICATION, instruction: '' })}
                className="flex items-center gap-2 text-sm bg-secondary px-3 py-1.5 rounded-md hover:bg-secondary/80 transition-colors"
              >
                <Plus size={16} /> Add Action
              </button>
            )}
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="relative p-6 border rounded-lg bg-white shadow-sm space-y-4">
              {viewMode !== 'READ' && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                >
                  <Trash2 size={18} />
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SelectInput
                  name={`actions.${index}.type`}
                  label="Action Type"
                  viewMode={viewMode}
                  options={Object.values(ActionType).map(a => ({ label: a, value: a }))}
                />
                <div className="md:col-span-2">
                  <TextInput
                    name={`actions.${index}.instruction`}
                    label="AI Instruction"
                    placeholder="Tell the user the house is secure."
                    viewMode={viewMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  name={`actions.${index}.conditionOverride`}
                  label="Execution Condition (Natural Language)"
                  placeholder="Only if the user is home"
                  viewMode={viewMode}
                />
                <JsonInput
                  name={`actions.${index}.metadata`}
                  label="Action Metadata (JSON)"
                  viewMode={viewMode}
                />
              </div>
            </div>
          ))}
          {fields.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
              No actions defined. This rule will trigger but do nothing.
            </div>
          )}
        </div>

        {viewMode !== 'CREATE' && (
          <div className="pt-4 space-y-1 border-t">
            <EntityTimestampField createdAt={initialData?.createdAt} updatedAt={initialData?.updatedAt} />
          </div>
        )}

        {viewMode !== 'READ' && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50"
            >
              {isLoading ? 'Saving Rule...' : viewMode === 'CREATE' ? 'Create Automation' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}