import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  InsertableRecipeSchema, 
  type InsertableRecipe, 
  type Recipe 
} from '@home-ai/shared/domain/recipe/recipe';

import { EntityFormProps } from '../types';

// Field Components
import { TextInput } from '@/components/form/fields/general/text-input';
import { EntityIdField } from '@/components/form/fields/domain/entity-id-field';
import { EntityTimestampField } from '@/components/form/fields/domain/entity-timestamp-field';
import { NumberInput } from '../../fields/general/number-input';

export type RecipeFormProps = EntityFormProps<InsertableRecipe, Recipe>;

export function RecipeForm({ initialData, viewMode, onSubmit, isLoading }: RecipeFormProps) {
  const form = useForm<InsertableRecipe>({
    resolver: zodResolver(InsertableRecipeSchema),
    defaultValues: {
      title: initialData?.title || '',
      url: initialData?.url || '',
      servings: initialData?.servings || undefined,
      prepTimeMinutes: initialData?.prepTimeMinutes || undefined,
      cookTimeMinutes: initialData?.cookTimeMinutes || undefined,
    },
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex justify-between items-start">
          <EntityIdField value={initialData?.id} />
          {initialData?.readableId && (
            <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
              RECIPE #{initialData.readableId}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <TextInput
            name="title"
            label="Recipe Title"
            placeholder="e.g. Grandma's Famous Lasagna"
            viewMode={viewMode}
          />

          <TextInput
            name="url"
            label="Source URL"
            placeholder="https://..."
            viewMode={viewMode}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NumberInput
            name="servings"
            label="Servings"
            placeholder="4"
            viewMode={viewMode}
          />
          <NumberInput
            name="prepTimeMinutes"
            label="Prep Time (mins)"
            placeholder="15"
            viewMode={viewMode}
          />
          <NumberInput
            name="cookTimeMinutes"
            label="Cook Time (mins)"
            placeholder="45"
            viewMode={viewMode}
          />
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
              {isLoading ? 'Saving...' : viewMode === 'CREATE' ? 'Create Recipe' : 'Update Recipe'}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}