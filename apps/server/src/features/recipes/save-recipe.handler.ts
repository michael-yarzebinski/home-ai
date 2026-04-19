// src/features/recipes/save-recipe.handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { IsDefined, IsString, IsUrl } from 'class-validator';
import { TaskName } from 'src/core/entities/task/task-name';
import { RegisterTask } from 'src/core/task-registry/decorators/register-task.decorator';
import { TaskRegistryService } from 'src/core/task-registry/registry/task-registry.service';
import { RecipesService } from '../recipes/recipe.service';
import { IngredientsService } from './ingredient.service';
import { LLMServiceBase } from 'src/ai/llm-services/llm.service.base';
import { LLMAction, LLMEventType } from 'src/ai/llm.dtos';
import { TaskHandlerContext } from 'src/tools/interfaces/task-handler-context';
import { TaskHandlerResult, TaskHandlerStatus } from 'src/tools/interfaces/task-handler-result';
import { TaskHandlerBase, TaskHandlerMetadata } from 'src/tools/task-handler.base';
import { AppConfigService } from 'src/core/entities/app-config/app-config.service';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';

export class SaveRecipeParams {
    @IsString()
    @IsUrl()
    @IsDefined()
    url: string;
}

export const SaveRecipeParamsSchema = `
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "description": "The full URL of the recipe webpage you want to save"
    }
  },
  "required": ["url"]
}
`;

interface IngredientParam {
    name: string;
    originalName: string;
    quantity: string;
    unit: string;
    notes: string;
}

@Injectable()
@RegisterTask(TaskName.SaveRecipe)
export class SaveRecipeHandler extends TaskHandlerBase {
    private readonly logger = new Logger(SaveRecipeHandler.name);

    readonly metadata: TaskHandlerMetadata = {
        taskName: TaskName.SaveRecipe,
        description: 'Save a recipe from a webpage URL. Downloads as PDF and extracts standardized ingredients.',
        parameters: SaveRecipeParams,
        parametersSchema: SaveRecipeParamsSchema,
        hints: ['save this recipe', 'save recipe', 'add this recipe', 'remember this recipe', 'store this recipe'],
        actionType: 'save_recipe',
    };

    constructor(
        protected taskRegistryService: TaskRegistryService,
        private readonly recipesService: RecipesService,
        private readonly ingredientsService: IngredientsService,
        private readonly llmService: LLMServiceBase,
        private readonly appConfigService: AppConfigService,
    ) {
        super(taskRegistryService);
    }

    async execute(request: TaskHandlerContext): Promise<TaskHandlerResult> {
        const { parameters: params, user } = request;
        const typedParams = params as SaveRecipeParams;

        if (!typedParams.url?.trim()) {
            return {
                status: TaskHandlerStatus.CLARIFICATION_NEEDED,
                reply: 'What recipe URL would you like me to save?',
            };
        }

        try {
            // 1. Get attachments directory from config
            const attachmentsDir = this.appConfigService.getFromEnv<string>('ATTACHMENTS_DIRECTORY') || './attachments';
            const recipesDir = path.join(attachmentsDir, 'recipes');
            await fs.mkdir(recipesDir, { recursive: true });

            // 2. Generate readable filename
            const recipe = await this.recipesService.createRecipe({
                title: `Recipe from ${typedParams.url}`,
                sourceUrl: typedParams.url,
                pdfPath: '', // temporary
                rawText: '',
                metadata: { source: 'web' },
            });

            const pdfFilename = `${recipe.readableId}.pdf`;
            const pdfPath = path.join(recipesDir, pdfFilename);
            const absolutePdfPath = path.resolve(pdfPath);
        
            // 3. Download as PDF with robust error handling
            this.logger.log(`Downloading recipe as PDF: ${typedParams.url}`);
        
            let browser: puppeteer.Browser | null = await puppeteer.launch({ 
              headless: true,
              args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        
            const page = await browser.newPage();
            
            // Set a reasonable timeout
            page.setDefaultNavigationTimeout(30000); // 30 seconds
        
            await page.goto(typedParams.url, { 
              waitUntil: 'networkidle2',
              timeout: 30000 
            });

            let pageText = '';
            try {
              await page.waitForSelector('body', { timeout: 10000 });
              const html = await page.content();
              
              pageText = html
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            } catch (e) {
                throw e
            }        
            // Generate PDF
            await page.pdf({
              path: absolutePdfPath,
              format: 'A4',
              printBackground: true,
              margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' }
            });
        
            // Update recipe with real PDF path and title
            const pageTitle = await page.title() || `Recipe #${recipe.readableId}`;
            await this.recipesService.updateRecipe(recipe.id, {
              pdfPath: pdfPath,
              title: pageTitle,
            });
        
            await browser.close();
            browser = null;

            await this.extractIngredients(pageText, recipe.id);

            // 4. TODO: Extract ingredients (we can do this next)
            // For now, return success with PDF path
            return {
                status: TaskHandlerStatus.SUCCESS,
                reply: `Recipe saved successfully! PDF saved as #${recipe.readableId}.pdf`,
                data: {
                    recipeId: recipe.id,
                    readableId: recipe.readableId,
                    pdfPath: pdfPath,
                    sourceUrl: typedParams.url,
                },
            };
        } catch (error: any) {
            this.logger.error('SaveRecipeHandler error:', error);
            return {
                status: TaskHandlerStatus.ERROR,
                error: 'Sorry, I couldn’t save that recipe right now.',
            };
        }
    }

    /**
   * Extract and standardize ingredients using the LLM
   */
  private async extractIngredients(pageText: string, recipeId: string) {
    const prompt = `
Extract all ingredients from the following recipe text.
**STRICT RULES FOR STANDARDIZATION:**
- The "name" field must be the clean, base ingredient name only (e.g. "green pepper", "chicken breast", "onion")
- Remove all preparation words from the name (diced, chopped, sliced, minced, shredded, grated, etc.)
- Keep quantity and unit in their own fields
- Put any preparation instructions in the "notes" field (e.g. "diced", "finely chopped", "to taste")
- Return ONLY raw JSON. No markdown, no code blocks, no backticks, no explanations, no extra text whatsoever.
- Do not wrap the response in \`\`\`json or any other formatting.
- The JSON must start immediately with { and end with }.

Return ONLY valid JSON in this exact format:

{
  "ingredients": [
    {
      "name": "standardized ingredient name",
      "originalName": "as it appeared in the recipe",
      "quantity": "quantity if mentioned",
      "unit": "unit if mentioned",
      "notes": "any extra notes like 'chopped', 'to taste'"
    }
  ]
}

Recipe text:
${pageText.substring(0, 8000)}
`;

    try {
      const llmResult = await this.llmService.queryLLM<{action: LLMAction.EXECUTE, ingredients: IngredientParam[]}>({
        prompt,
        userId: 'system', // or pass real user if needed
        eventType: LLMEventType.TASK_FOLLOWUP,
      });

      const ingredients = llmResult.ingredients || [];

      // Save ingredients
      for (const ing of ingredients) {
        await this.ingredientsService.createIngredient({
          recipeId,
          name: ing.name,
          originalName: ing.originalName,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes,
        });
      }

      return ingredients;
    } catch (error) {
      this.logger.warn('Failed to extract ingredients', error);
      return [];
    }
  }
}