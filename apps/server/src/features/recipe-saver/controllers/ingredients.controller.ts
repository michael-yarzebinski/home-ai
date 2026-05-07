import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { IngredientStore } from "../stores/ingredients.store";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import {
  UpdatableIngredientSchema,
  type UpdatableIngredient,
} from "@home-ai/shared/domain/ingredient/ingredient";
import type { AuthUser } from "../../../core/auth/jwt.strategy";

@Controller("v1/ingredients")
export class IngredientsController {
  constructor(private readonly ingredientStore: IngredientStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ingredientStore.search(
      { ...dto, includeInactive: false },
      user,
    );
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatableIngredientSchema))
    dto: UpdatableIngredient,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ingredientStore.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.ingredientStore.softDelete(id, user);
  }
}
