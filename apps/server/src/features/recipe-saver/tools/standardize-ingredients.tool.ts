import { z } from "zod";
import { Injectable } from "@nestjs/common";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ToolContext } from "src/tools/types/tool-context";
import { Tool } from "src/tools/decorators/tool.decorator";
import { IngredientStore } from "../stores/ingredients.store";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";
import {
  LLMModelTypes,
  LLMProviderService,
} from "../../../ai/llm/llm.provider.sevice";

const StandardizeIngredientsSchema = z.object({
  ingredients: z.preprocess(
    ToolParameterUtils.toStringArray,
    z
      .array(z.string())
      .describe(
        "An array of raw ingredient strings to be structured (e.g. ['2 cups flour', 'pinch of salt']).",
      ),
  ),
});

export interface StructuredIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
}

@Tool()
@Injectable()
export class StandardizeIngredientsTool extends ToolHandler<
  typeof StandardizeIngredientsSchema,
  StructuredIngredient[]
> {
  readonly name = "standardize-ingredients";

  readonly description =
    "Turn raw ingredient lines into structured objects for add-recipe. Use before add-recipe when saving a recipe in Home AI.";

  readonly parameters = StandardizeIngredientsSchema;

  constructor(
    private readonly llmProviderService: LLMProviderService,
    private readonly ingredientStore: IngredientStore,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof StandardizeIngredientsSchema>,
    context: ToolContext,
  ): Promise<StructuredIngredient[]> {
    const existing = await this.ingredientStore.getAll(
      context.requestUser,
      false,
    );
    const knownNames = existing
      .map((i) => i.name)
      .slice(0, 50)
      .join(", ");

    const systemPrompt = `
      You are a specialized parser for cooking ingredients.
      
      TASK:
      Convert raw strings into a strictly valid JSON array of objects.
      
      SCHEMA:
      [
        {
          "name": "string (lowercase, simple name)",
          "quantity": number or null,
          "unit": "string or null",
          "notes": "string or null"
        }
      ]

      CONSTRAINTS:
      - Return ONLY the JSON array.
      - Convert fractions (e.g., 1/2) to decimals (0.5).
      - If a quantity/unit is missing, use null.
      - PREFER these existing names if they match: ${knownNames || "None"}.
    `;

    const response = await this.llmProviderService.query(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(params.ingredients) },
        ],
        jsonMode: true,
        context: {
          userId: context.userId,
          chatSessionId: context.chatSessionId,
          originalPrompt: `Standardizing ${params.ingredients.length} ingredients`,
        },
      },
      LLMModelTypes.IMMEDIATE,
    );

    try {
      const parsed =
        typeof response.content === "string"
          ? JSON.parse(response.content)
          : response.content;

      if (!Array.isArray(parsed)) {
        throw new Error("LLM did not return an array");
      }

      // Map to ensure the final output strictly follows our interface
      return parsed.map((item: any) => ({
        name: String(item.name || "unknown"),
        quantity: typeof item.quantity === "number" ? item.quantity : null,
        unit: item.unit || null,
        notes: item.notes || null,
      }));
    } catch (err: any) {
      throw new Error(`Failed to standardize ingredients: ${err.message}`);
    }
  }
}
