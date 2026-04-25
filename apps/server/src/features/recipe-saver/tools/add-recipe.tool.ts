import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ToolContext } from "src/tools/types/tool-context";
import { IngredientStore } from "../stores/ingredients.store";
import { RecipeStore } from "../stores/recipe.store";
import { AppConfigService } from "src/core/services/app-config.service";
import { Tool } from "src/tools/decorators/tool.decorator";
import { Injectable } from "@nestjs/common";

const IngredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

const AddRecipeToolSchema = z.object({
  title: z.string().min(1, "Recipe title is required"),
  ingredients: z.array(IngredientSchema).describe("The structured list of ingredients."),
  instructions: z.string().min(10, "Instructions are too short"),
  servings: z.number().optional(),
  prepTimeMinutes: z.number().optional(),
  cookTimeMinutes: z.number().optional(),
  url: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  temporaryPdfPath: z.string().min(1, "PDF path is required"),
});

export interface AddRecipeResult {
  success: boolean;
  readableId: number;
  finalPdfPath?: string;
  message: string;
}

@Tool()
@Injectable()
export class AddRecipeTool extends ToolHandler<
  typeof AddRecipeToolSchema,
  AddRecipeResult
> {
  readonly name = "add-recipe";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Create a new recipe record. IMPORTANT: You MUST call 'standardize-ingredients' or 'standardize-recipe' first.";

  readonly parameters = AddRecipeToolSchema;

  constructor(
    private readonly recipeStore: RecipeStore,
    private readonly ingredientStore: IngredientStore,
    private readonly appConfigService: AppConfigService,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof AddRecipeToolSchema>,
    context: ToolContext,
  ): Promise<AddRecipeResult> {
    try {
      // Create the base recipe record
      const recipe = await this.recipeStore.create({
        title: params.title,
        url: params.url || undefined,
        servings: params.servings,
        prepTimeMinutes: params.prepTimeMinutes,
        cookTimeMinutes: params.cookTimeMinutes,
      });

      const readableId = recipe.readableId;
      const attachmentsDir = await this.appConfigService.getFromEnv(
        "ATTACHMENTS_DIRECTORY",
      );

      // Handle PDF movement from temporary storage to permanent storage
      const finalPdfFilename = `${readableId}.pdf`;
      const finalPdfPath = path.join(attachmentsDir, "recipes", finalPdfFilename);

      try {
        await fs.access(params.temporaryPdfPath);
        await fs.rename(params.temporaryPdfPath, finalPdfPath);
      } catch (e) {
        console.warn(`[AddRecipeTool] PDF file not found at ${params.temporaryPdfPath}. Skipping rename.`);
      }

      // Save standardized ingredients
      for (const ingredient of params.ingredients) {
        await this.ingredientStore.create({
          recipeId: recipe.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          notes: ingredient.notes,
        });
      }

      return {
        success: true,
        readableId,
        finalPdfPath,
        message: `✅ Recipe #${readableId} "${params.title}" has been created with ${params.ingredients.length} ingredients.`,
      };
    } catch (err: any) {
      return {
        success: false,
        readableId: 0,
        message: `Failed to create recipe: ${err.message}`,
      };
    }
  }
}