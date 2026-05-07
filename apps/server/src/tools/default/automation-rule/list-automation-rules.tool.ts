import { Injectable } from "@nestjs/common";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { Tool } from "src/tools/decorators/tool.decorator";
import { ToolContext } from "src/tools/types/tool-context";
import { AutomationRuleStore } from "src/core/stores/automation-rule/automation-rule.store";
import { z } from "zod";

const ListAutomationRulesSchema = z.object({});

@Tool()
@Injectable()
export class ListAutomationRulesTool extends ToolHandler<
  typeof ListAutomationRulesSchema
> {
  readonly name = "list-automation-rules";
  readonly description =
    "Retrieve all active automation rules for the current user.";
  readonly parameters = ListAutomationRulesSchema;

  constructor(private readonly automationStore: AutomationRuleStore) {
    super();
  }

  async execute(_params: any, context: ToolContext) {
    const rules = await this.automationStore.getByUserId(context.userId);
    return {
      count: rules.length,
      rules: rules.map((r) => ({
        id: r.id,
        name: r.name,
        active: r.active,
        trigger: r.trigger,
      })),
    };
  }
}
