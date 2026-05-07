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
} from "@nestjs/common";
import { UserStore } from "../../stores/user/user.store";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import {
  UpdatableUserApiSchema,
  type UpdatableUserApi,
} from "@home-ai/shared/domain/user/user";
import type { AuthUser } from "../../auth/jwt.strategy";

@Controller("v1/users")
export class UsersController {
  constructor(private readonly userStore: UserStore) {}

  private assertSelf(id: string, user: AuthUser) {
    if (id !== user.id) {
      throw new ForbiddenException("Users can only access their own account");
    }
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    this.assertSelf(id, user);
    const item = await this.userStore.getById(id, false, user);
    if (!item) throw new NotFoundException(`User ${id} not found`);
    return item;
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatableUserApiSchema)) dto: UpdatableUserApi,
    @CurrentUser() user: AuthUser,
  ) {
    this.assertSelf(id, user);
    const existing = await this.userStore.getById(id, false, user);
    if (!existing) throw new NotFoundException(`User ${id} not found`);

    // Self-service updates must never allow role changes.
    return this.userStore.update(id, { ...dto, role: existing.role }, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    this.assertSelf(id, user);
    return this.userStore.softDelete(id, user);
  }
}
