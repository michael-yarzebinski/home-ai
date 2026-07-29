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
import { FactsStore } from "../stores/facts.store";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import {
  InsertableFactSchema,
  UpdatableFactSchema,
  type InsertableFact,
  type UpdatableFact,
} from "@home-ai/shared/domain/fact/fact";
import type { AuthUser } from "../../../core/auth/jwt.strategy";

@Controller("v1/facts")
export class FactsController {
  constructor(private readonly factsStore: FactsStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.factsStore.search({ ...dto, includeInactive: false }, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const item = await this.factsStore.getById(id, authUser, false);
    if (!item) throw new NotFoundException(`Fact ${id} not found`);
    return item;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(InsertableFactSchema)) dto: InsertableFact,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.factsStore.create(dto, authUser);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatableFactSchema)) dto: UpdatableFact,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.factsStore.update(id, dto, authUser);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    return this.factsStore.softDelete(id, authUser);
  }
}
