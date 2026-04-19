import { Module } from "@nestjs/common";
import { RecipeStore } from "./recipe.store";
import { RecipesService } from "./recipe.service";
import { IngredientStore } from "./ingredient.store";
import { IngredientsService } from "./ingredient.service";
import { CoreModule } from "src/core/core.module";
import { SaveRecipeHandler } from "./save-recipe.handler";
import { AIModule } from "src/ai/ai.module";


@Module({
    imports: [CoreModule, AIModule,],
    providers: [
        RecipeStore,
        RecipesService,
        IngredientStore,
        IngredientsService,
        SaveRecipeHandler,
    ],
    exports: [RecipesService, IngredientsService, SaveRecipeHandler]
})
export class RecipeModule {}