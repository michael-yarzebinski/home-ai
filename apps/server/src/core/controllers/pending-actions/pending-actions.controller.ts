import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { z } from "zod";
import { PendingActionStore } from "../../stores/pending-action/pending-action.store";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import type { AuthUser } from "../../auth/jwt.strategy";
import { Role } from "@home-ai/shared/domain/role/role";

const RejectSchema = z.object({ reason: z.string().min(1) });
type RejectDto = z.infer<typeof RejectSchema>;

@Controller("v1/pending-actions")
export class PendingActionsController {
  constructor(private readonly pendingActionStore: PendingActionStore) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    // validateForRead in the store scopes to requester_id for non-admins.
    return this.pendingActionStore.search({ page: 1, pageSize: 50 }, user);
  }

  @Post(":id/approve")
  @HttpCode(HttpStatus.OK)
  async approve(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const action = await this.pendingActionStore.getById(id);
    if (!action) throw new NotFoundException(`Pending action ${id} not found`);

    // Only admins or the requester's parent/admin role may approve.
    const canApprove = user.role === Role.ADMIN || user.role === Role.PARENT;
    if (!canApprove)
      throw new ForbiddenException("Insufficient role to approve actions");

    return this.pendingActionStore.approve(id, user.id);
  }

  @Post(":id/reject")
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(RejectSchema)) dto: RejectDto,
    @CurrentUser() user: AuthUser,
  ) {
    const action = await this.pendingActionStore.getById(id);
    if (!action) throw new NotFoundException(`Pending action ${id} not found`);

    const canReject = user.role === Role.ADMIN || user.role === Role.PARENT;
    if (!canReject)
      throw new ForbiddenException("Insufficient role to reject actions");

    return this.pendingActionStore.update(id, {
      status: "rejected",
      reason: dto.reason,
    });
  }
}
