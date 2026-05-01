import { Injectable } from '@nestjs/common';
import { ToolHandler } from 'src/tools/abstract/tool-handler';
import { Tool } from 'src/tools/decorators/tool.decorator';
import { ToolContext } from 'src/tools/types/tool-context';
import { AutomationRuleStore } from 'src/core/stores/automation-rule/automation-rule.store';
import { ToolParameterUtils } from 'src/tools/utils/tool-parameter-utils';
import { z } from 'zod';
import { TriggerType } from '@home-ai/shared/domain/automation-rule/automation-rule';

const GetAutomationRulesSchema = z.object({
  triggerType: z
    .preprocess((v) => {
      const s = ToolParameterUtils.stripQuotes(v);
      return typeof s === 'string' ? s.toUpperCase() : s;
    }, z.nativeEnum(TriggerType))
    .describe('The type of trigger to filter by (e.g., DEVICE, TIME)'),
  entityId: z
    .preprocess(
      (v) => (ToolParameterUtils.isEmptyOptionalInput(v) ? undefined : ToolParameterUtils.stripQuotes(v)),
      z.string().optional(),
    )
    .describe('Optional: Filter by a specific entityId or deviceId within the trigger config'),
});

@Tool()
@Injectable()
export class GetAutomationRulesTool extends ToolHandler<typeof GetAutomationRulesSchema> {
  readonly name = 'get-automation-rules';
  readonly description = 'Retrieve active automation rules filtered by trigger type and optionally a specific entity/device ID.';
  readonly parameters = GetAutomationRulesSchema;

  constructor(private readonly automationStore: AutomationRuleStore) {
    super();
  }

  async execute(params: z.infer<typeof GetAutomationRulesSchema>, context: ToolContext) {
    // We pass the filters to the store. 
    // The store will handle the complex JSONB querying logic.
    const rules = await this.automationStore.getForTool(
      params.triggerType,
      params.entityId
    );

    return {
      count: rules.length,
      rules: rules.map(r => ({
        id: r.id,
        name: r.name,
        trigger: r.trigger,
        actions: r.actions // We include actions so the LLM knows what it's supposed to evaluate
      })),
    };
  }
}