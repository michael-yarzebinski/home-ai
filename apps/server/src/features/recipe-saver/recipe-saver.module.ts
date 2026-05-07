import { Module } from "@nestjs/common";
import { RecipeStore } from "./stores/recipe.store";
import { IngredientStore } from "./stores/ingredients.store";
import { CoreModule } from "src/core/core.module";
import { StandardizeIngredientsTool } from "./tools/standardize-ingredients.tool";
import { AddRecipeTool } from "./tools/add-recipe.tool";
import { ScrapeRecipeTool } from "./tools/scrape-recipe.tool";
import { AIModule } from "../../ai/ai.module";
import { StandardizeRecipeTool } from "./tools/standardize-recipe.tool";
import { RecipeController } from "./controllers/recipe.controller";
import { IngredientsController } from "./controllers/ingredients.controller";
import { RecipesAdminController } from "./controllers/admin/recipes.admin.controller";
import { IngredientsAdminController } from "./controllers/admin/ingredients.admin.controller";

@Module({
  imports: [CoreModule, AIModule],
  controllers: [
    RecipesAdminController,
    IngredientsAdminController,
    RecipeController,
    IngredientsController,
  ],
  providers: [
    RecipeStore,
    IngredientStore,
    AddRecipeTool,
    ScrapeRecipeTool,
    StandardizeIngredientsTool,
    StandardizeRecipeTool,
  ],
  exports: [
    RecipeStore,
    IngredientStore,
    AddRecipeTool,
    ScrapeRecipeTool,
    StandardizeIngredientsTool,
    StandardizeRecipeTool,
  ],
})
export class RecipeSaverModule {}
