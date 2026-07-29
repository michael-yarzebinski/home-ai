import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChefHat, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { UpdatableRecipe } from '@home-ai/shared/domain/recipe/recipe';
import { useRecipeById, useUpdateRecipe, useSoftDeleteRecipe } from '@/api/recipes/recipes.hooks';
import { useIngredientsForRecipe } from '@/api/ingredients/ingredients.hooks';
import { EntityModal } from '@/components/entity-modal/entity-modal';
import { RecipeForm } from '@/components/form/entities/recipe/recipe-form';
import { Button } from '@/components/ui/button';
import { RecipeDetailsSummary } from './recipe-details-summary';
import { IngredientsPanel } from './ingredients-panel';

export default function RecipeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: recipe, isLoading, isError, error } = useRecipeById(id);
  const {
    data: ingredients,
    isLoading: isIngredientsLoading,
    isError: isIngredientsError,
    error: ingredientsError,
  } = useIngredientsForRecipe(id);

  const { mutate: updateRecipe, isPending: isUpdating } = useUpdateRecipe();
  const { mutate: deleteRecipe, isPending: isDeleting } = useSoftDeleteRecipe();

  const handleDeleteRecipe = () => {
    if (!id) return;
    deleteRecipe(id, {
      onSuccess: () => {
        toast.success('Recipe deleted');
        navigate('/recipes/all');
      },
      onError: (e) => toast.error(e.message),
    });
  };

  const handleUpdateRecipe = (formData: UpdatableRecipe) => {
    if (!id) return;
    updateRecipe(
      { id, body: formData },
      {
        onSuccess: () => {
          toast.success('Recipe saved');
          setIsEditModalOpen(false);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  if (!id) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Missing recipe id.{' '}
        <Link to="/recipes/all" className="text-primary hover:underline">
          Back to all recipes
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin mr-2" />
        Loading recipe…
      </div>
    );
  }

  if (isError || !recipe) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-destructive">{error?.message ?? 'Recipe not found.'}</p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/recipes/all">
            <ArrowLeft className="size-4 mr-2" />
            All recipes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <div className="p-2.5 bg-accent rounded-xl border border-border/50 shrink-0">
            <ChefHat className="h-6 w-6 text-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
              {recipe.title}
            </h1>
            <p className="text-xs font-mono text-muted-foreground/80 mt-0.5">
              Recipe #{recipe.readableId}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 text-xs font-bold uppercase tracking-wider"
          onClick={() => setIsEditModalOpen(true)}
        >
          <Pencil className="size-3.5 mr-1.5" />
          Edit recipe
        </Button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <RecipeDetailsSummary recipe={recipe} />
        </div>

        <div className="min-w-0 w-full shrink-0 lg:flex lg:max-h-[calc(100vh-10rem)] lg:w-80 lg:flex-col lg:sticky lg:top-4">
          <IngredientsPanel
            ingredients={ingredients ?? []}
            isLoading={isIngredientsLoading}
            isError={isIngredientsError}
            error={ingredientsError}
          />
        </div>
      </div>

      <EntityModal
        title="Edit recipe"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        formId="edit-recipe-form"
        saveLabel="Update Recipe"
        isLoading={isUpdating}
        onDelete={handleDeleteRecipe}
        isDeleting={isDeleting}
      >
        <RecipeForm
          key={String(recipe.updatedAt ?? recipe.id)}
          formId="edit-recipe-form"
          viewMode="EDIT"
          isLoading={isUpdating}
          onSubmit={handleUpdateRecipe}
          initialData={recipe}
        />
      </EntityModal>
    </div>
  );
}
