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
import { AutomationRuleStore } from "../../stores/automation-rule/automation-rule.store";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import {
  InsertableAutomationRuleSchema,
  UpdatableAutomationRuleSchema,
  type InsertableAutomationRule,
  type UpdatableAutomationRule,
} from "@home-ai/shared/domain/automation-rule/automation-rule";
import type { AuthUser } from "../../auth/jwt.strategy";

@Controller("v1/automation-rules")
export class AutomationRulesController {
  constructor(private readonly automationRuleStore: AutomationRuleStore) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.automationRuleStore.search(
      { ...dto, includeInactive: false },
      authUser,
    );
  }

  @Get(":id")
  async getById(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const item = await this.automationRuleStore.getById(id, authUser);
    if (!item) throw new NotFoundException(`Automation rule ${id} not found`);
    return item;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(InsertableAutomationRuleSchema))
    dto: InsertableAutomationRule,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.automationRuleStore.create(
      { ...dto, userId: authUser.id },
      authUser,
    );
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatableAutomationRuleSchema))
    dto: UpdatableAutomationRule,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.automationRuleStore.update(
      id,
      { ...dto, userId: authUser.id },
      authUser,
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    return this.automationRuleStore.softDelete(id, authUser);
  }
}
