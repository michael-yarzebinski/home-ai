export interface Ingredient {
    id: string;
    recipeId: string;
    name: string;                    // Standardized name
    originalName?: string | null;    // As it appeared on the page
    quantity?: string | null;
    unit?: string | null;
    notes?: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }