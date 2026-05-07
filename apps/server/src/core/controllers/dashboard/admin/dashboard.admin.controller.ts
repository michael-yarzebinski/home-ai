import { Controller, Get, Query } from "@nestjs/common";
import { DashboardService } from "../../../services/dashboard.service";
import { Roles } from "../../../../common/decorators/roles.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import {
  DashboardQuerySchema,
  type DashboardQuery,
} from "@home-ai/shared/domain/admin/dashboard/dashboard";

@Controller("v1/admin/dashboard")
@Roles(Role.ADMIN)
export class DashboardAdminController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  get(
    @Query(new ZodValidationPipe(DashboardQuerySchema)) query: DashboardQuery,
  ) {
    return this.dashboardService.get(query.period);
  }
}
