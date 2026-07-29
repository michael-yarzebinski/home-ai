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
import { AutomationRuleStore } from "../../../stores/automation-rule/automation-rule.store";
import { Roles } from "../../../../common/decorators/roles.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import {
  InsertableAutomationRuleSchema,
  type InsertableAutomationRule,
} from "@home-ai/shared/domain/automation-rule/automation-rule";
import { AuthUser } from "../../../auth/jwt.strategy";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator";

@Controller("v1/admin/automation-rules")
@Roles(Role.ADMIN)
export class AutomationRulesAdminController {
  constructor(private readonly automationRuleStore: AutomationRuleStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.automationRuleStore.search(dto, authUser);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const item = await this.automationRuleStore.getById(id, authUser, true);
    if (!item) throw new NotFoundException(`AutomationRule ${id} not found`);
    return item;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(InsertableAutomationRuleSchema))
    dto: InsertableAutomationRule,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.automationRuleStore.create(dto, authUser);
  }

  @Post(":id/restore")
  async restore(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    await this.automationRuleStore.restore(id, authUser);
    return this.automationRuleStore.getById(id, authUser);
  }
}
