import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  InsertableIngredientSchema, 
  type InsertableIngredient, 
  type Ingredient 
} from '@home-ai/shared/domain/recipe/ingredient';

import { EntityFormProps } from '../types';

// Field Components
import { TextInput } from '@/components/form/fields/general/text-input';
import { NumberInput } from '@/components/form/fields/general/number-input';
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';

export type IngredientFormProps = EntityFormProps<InsertableIngredient, Ingredient>;

export function IngredientForm({ initialData, viewMode, onSubmit, isLoading }: IngredientFormProps) {
  const form = useForm<InsertableIngredient>({
    resolver: zodResolver(InsertableIngredientSchema),
    defaultValues: {
      recipeId: initialData?.recipeId || '',
      name: initialData?.name || '',
      quantity: initialData?.quantity || undefined,
      unit: initialData?.unit || '',
      notes: initialData?.notes || '',
    },
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <EntityIdField value={initialData?.id} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextInput
            name="name"
            label="Ingredient Name"
            placeholder="e.g. All-purpose Flour"
            viewMode={viewMode}
          />
          <TextInput
            name="recipeId"
            label="Recipe ID"
            viewMode={viewMode}
            forceReadMode={true} // Usually managed by the parent context
            description="The internal ID of the parent recipe."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NumberInput
            name="quantity"
            label="Quantity"
            placeholder="2.5"
            viewMode={viewMode}
          />
          <TextInput
            name="unit"
            label="Unit"
            placeholder="e.g. cups, grams, tbsp"
            viewMode={viewMode}
          />
        </div>

        <TextInput
          name="notes"
          label="Preparation Notes"
          placeholder="e.g. sifted, room temperature, diced"
          viewMode={viewMode}
        />

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
              {isLoading ? 'Saving...' : viewMode === 'CREATE' ? 'Add Ingredient' : 'Update Ingredient'}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}