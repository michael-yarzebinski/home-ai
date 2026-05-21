import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
  Post,
} from "@nestjs/common";
import { UserStore } from "../../stores/user/user.store";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import {
  UpdatableUserApiSchema,
  type UpdatableUserApi,
} from "@home-ai/shared/domain/user/user";
import type { AuthUser } from "../../auth/jwt.strategy";
import { SearchCriteriaBase, SearchCriteriaSchema } from "../../../../../shared/dist/search/search";

@Controller("v1/users")
export class UsersController {
  constructor(private readonly userStore: UserStore) { }

  private assertSelf(id: string, authUser: AuthUser) {
    if (id !== authUser.id) {
      throw new ForbiddenException("Users can only access their own account");
    }
  }

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.userStore.search({ ...dto, includeInactive: false }, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    this.assertSelf(id, authUser);
    const item = await this.userStore.getById(id, authUser);
    if (!item) throw new NotFoundException(`User ${id} not found`);
    return item;
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatableUserApiSchema)) dto: UpdatableUserApi,
    @CurrentUser() authUser: AuthUser,
  ) {
    this.assertSelf(id, authUser);
    const existing = await this.userStore.getById(id, authUser);
    if (!existing) throw new NotFoundException(`User ${id} not found`);

    // Self-service updates must never allow role changes.
    return this.userStore.update(id, { ...dto, role: existing.role }, authUser);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    this.assertSelf(id, authUser);
    return this.userStore.softDelete(id, authUser);
  }
}
