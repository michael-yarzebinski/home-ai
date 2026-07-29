import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { RecipeStore } from "../../stores/recipe.store";
import { Roles } from "../../../../common/decorators/roles.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";

import { CurrentUser } from "../../../../common/decorators/current-user.decorator";
import type { AuthUser } from "../../../../core/auth/jwt.strategy";

@Controller("v1/admin/recipes")
@Roles(Role.ADMIN)
export class RecipesAdminController {
  constructor(private readonly recipeStore: RecipeStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.recipeStore.search(dto, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const item = await this.recipeStore.getById(id, authUser, false);
    if (!item) throw new NotFoundException(`Recipe ${id} not found`);
    return item;
  }

  @Post(":id/restore")
  async restore(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    await this.recipeStore.restore(id, authUser);
    return this.recipeStore.getById(id, authUser, false);
  }
}
