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
import * as bcrypt from "bcrypt";
import { z } from "zod";
import { UserStore } from "../../../stores/user/user.store";
import { Roles } from "../../../../common/decorators/roles.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import {
  InsertableUserApiSchema,
  UpdatableUserApiSchema,
  type UpdatableUserApi,
} from "@home-ai/shared/domain/user/user";

// Admin create: API-safe fields + a plaintext accessCode that gets hashed before storage.
const AdminCreateUserSchema: ReturnType<
  typeof InsertableUserApiSchema.extend<{ accessCode: z.ZodString }>
> = InsertableUserApiSchema.extend({
  accessCode: z.string().min(4).regex(/^\d+$/, "Access code must be numeric"),
});
type AdminCreateUserDto = z.infer<typeof AdminCreateUserSchema>;

@Controller("v1/admin/users")
@Roles(Role.ADMIN)
export class UsersAdminController {
  constructor(private readonly userStore: UserStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
  ) {
    return this.userStore.search(dto);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const user = await this.userStore.getById(id, true);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(AdminCreateUserSchema)) dto: AdminCreateUserDto,
  ) {
    const { accessCode, ...rest } = dto;
    const accessCodeHash = await bcrypt.hash(accessCode, 12);
    return this.userStore.create({ ...rest, accessCodeHash } as any);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatableUserApiSchema)) dto: UpdatableUserApi,
  ) {
    return this.userStore.update(id, dto as any);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param("id") id: string) {
    return this.userStore.softDelete(id);
  }

  @Post(":id/restore")
  async restore(@Param("id") id: string) {
    await this.userStore.restore(id);
    return this.userStore.getById(id, true);
  }
}
