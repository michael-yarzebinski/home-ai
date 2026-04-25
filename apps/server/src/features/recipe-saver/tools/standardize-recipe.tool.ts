import { z } from "zod";
import { Injectable } from "@nestjs/common";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ToolContext } from "src/tools/types/tool-context";
import { Tool } from "src/tools/decorators/tool.decorator";
import { IngredientStore } from "../stores/ingredients.store";
import { LLMServiceBase } from "../../../ai/abstract/llm.service.base";

const StandardizeRecipeSchema = z.object({
  rawText: z
    .string()
    .describe(
      "The clean text content extracted from the webpage via the scrape-recipe tool",
    ),
});

export interface StructuredRecipe {
  title: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  ingredients: {
    quantity?: number;
    unit?: string;
    name: string;
    notes?: string;
  }[];
  instructions: string;
}

@Tool()
@Injectable()
export class StandardizeRecipeTool extends ToolHandler<
  typeof StandardizeRecipeSchema,
  StructuredRecipe
> {
  readonly name = "standardize-recipe";
  
  readonly description =
    "Converts raw scraped text into a fully structured JSON format. Output ingredients in the EXACT format required by add-recipe.";

  readonly parameters = StandardizeRecipeSchema;

  constructor(
    private readonly llm: LLMServiceBase,
    private readonly ingredientStore: IngredientStore,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof StandardizeRecipeSchema>,
    context: ToolContext,
  ): Promise<StructuredRecipe> {
    const existing = await this.ingredientStore.getAll();
    const knownNames = existing
      .map((i) => i.name)
      .slice(0, 100)
      .join(", ");

    const systemPrompt = `
      You are a specialized recipe extraction engine. 
      Target User: ${context.userName || "User"}
      Preferred Units: ${context.preferences?.units || "Imperial"}

      TASK: 
      Convert raw recipe text into a strictly valid JSON object.
      
      CONSTRAINTS:
      - Return ONLY the JSON object. 
      - Quantities and Times MUST be numbers.
      - Each ingredient MUST have a field named "name".
      - PREFER these known ingredient names: ${knownNames || "None"}.

      OUTPUT SCHEMA:
      {
        "title": "string",
        "servings": number,
        "prepTimeMinutes": number,
        "cookTimeMinutes": number,
        "ingredients": [
          { "quantity": number, "unit": "string", "name": "string", "notes": "string" }
        ],
        "instructions": "string"
      }
    `;

    const response = await this.llm.query({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: params.rawText },
      ],
      jsonMode: true,
      context: {
        userId: context.userId,
        chatSessionId: context.chatSessionId,
        originalPrompt: `Standardizing recipe extraction`,
      },
    });

    try {
      // The Orchestrator handles the heavy lifting, so we just parse the response
      const parsed = typeof response.content === 'string' 
        ? JSON.parse(response.content) 
        : response.content;

      return {
        title: parsed.title,
        servings: parsed.servings,
        prepTimeMinutes: parsed.prepTimeMinutes,
        cookTimeMinutes: parsed.cookTimeMinutes,
        instructions: Array.isArray(parsed.instructions) 
          ? parsed.instructions.join("\n") 
          : parsed.instructions,
        ingredients: parsed.ingredients,
      };
    } catch (err: any) {
      throw new Error(`Standardization failed: ${err.message}`);
    }
  }
}