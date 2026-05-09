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
import { RecipeStore } from "../stores/recipe.store";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import {
  UpdatableRecipeSchema,
  type UpdatableRecipe,
} from "@home-ai/shared/domain/recipe/recipe";
import type { AuthUser } from "../../../core/auth/jwt.strategy";

@Controller("v1/recipes")
export class RecipeController {
  constructor(private readonly recipeStore: RecipeStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.recipeStore.search({ ...dto, includeInactive: false }, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const item = await this.recipeStore.getById(id, authUser, false);
    if (!item) throw new NotFoundException(`Recipe ${id} not found`);
    return item;
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatableRecipeSchema)) dto: UpdatableRecipe,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.recipeStore.update(id, dto, authUser);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    return this.recipeStore.softDelete(id, authUser);
  }
}
