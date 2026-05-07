import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { RecipeStore } from "../../stores/recipe.store";
import { Roles } from "../../../../common/decorators/roles.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import {
  InsertableRecipeSchema,
  UpdatableRecipeSchema,
  type InsertableRecipe,
  type UpdatableRecipe,
} from "@home-ai/shared/domain/recipe/recipe";

@Controller("v1/admin/recipes")
@Roles(Role.ADMIN)
export class RecipesAdminController {
  constructor(private readonly recipeStore: RecipeStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
  ) {
    return this.recipeStore.search(dto);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const item = await this.recipeStore.getById(id, true);
    if (!item) throw new NotFoundException(`Recipe ${id} not found`);
    return item;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(InsertableRecipeSchema)) dto: InsertableRecipe,
  ) {
    return this.recipeStore.create(dto);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatableRecipeSchema)) dto: UpdatableRecipe,
  ) {
    return this.recipeStore.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param("id") id: string) {
    return this.recipeStore.softDelete(id);
  }

  @Post(":id/restore")
  async restore(@Param("id") id: string) {
    await this.recipeStore.restore(id);
    return this.recipeStore.getById(id, true);
  }
}
