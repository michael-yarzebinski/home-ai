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
import { IngredientStore } from "../../stores/ingredients.store";
import { Roles } from "../../../../common/decorators/roles.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import {
  InsertableIngredientSchema,
  UpdatableIngredientSchema,
  type InsertableIngredient,
  type UpdatableIngredient,
} from "@home-ai/shared/domain/recipe/ingredient";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator";
import type { AuthUser } from "../../../../core/auth/jwt.strategy";

@Controller("v1/admin/ingredients")
@Roles(Role.ADMIN)
export class IngredientsAdminController {
  constructor(private readonly ingredientStore: IngredientStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.ingredientStore.search(dto, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const item = await this.ingredientStore.getById(id, authUser, true);
    if (!item) throw new NotFoundException(`Ingredient ${id} not found`);
    return item;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(InsertableIngredientSchema))
    dto: InsertableIngredient,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.ingredientStore.create(dto, authUser);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatableIngredientSchema))
    dto: UpdatableIngredient,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.ingredientStore.update(id, dto, authUser);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    return this.ingredientStore.softDelete(id, authUser);
  }

  @Post(":id/restore")
  async restore(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    await this.ingredientStore.restore(id, authUser);
    return this.ingredientStore.getById(id, authUser, false);
  }
}
