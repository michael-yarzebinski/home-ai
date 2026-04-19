// src/features/memory/retrieve-fact.handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { TaskHandlerBase, TaskHandlerMetadata } from '../task-handler.base';
import type { TaskHandlerContext } from '../interfaces/task-handler-context';
import { TaskHandlerStatus, type TaskHandlerResult } from '../interfaces/task-handler-result';
import { IsDefined, IsString } from 'class-validator';
import { FactService } from '../../core/fact/fact.service';
import { TaskName } from 'src/core/entities/task/task-name';
import { RegisterTask } from 'src/core/task-registry/decorators/register-task.decorator';
import { TaskRegistryService } from 'src/core/task-registry/registry/task-registry.service';
import { LLMServiceBase } from 'src/ai/llm-services/llm.service.base';
import { LLMAction, LLMEventType } from 'src/ai/llm.dtos';

export class RetrieveFactParams {
  @IsString()
  @IsDefined()
  query: string;   // Natural language query from the user
}

export const RetrieveFactParamsSchema = `
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "The user's natural language question or request to recall a fact"
    }
  },
  "required": ["query"]
}
`;

@Injectable()
@RegisterTask(TaskName.RetrieveFact)
export class RetrieveFactTool extends TaskHandlerBase {
  private readonly logger = new Logger(RetrieveFactTool.name);

  readonly metadata: TaskHandlerMetadata = {
    taskName: TaskName.RetrieveFact,
    description: 'Retrieve and recall a previously stored fact or preference using natural language',
    parameters: RetrieveFactParams,
    parametersSchema: RetrieveFactParamsSchema,
    hints: ['what did i say about', 'recall', 'remember what', 'what was', 'what is', 'tell me about', 'do i have any info on'],
    actionType: 'retrieve_fact',
  };

  constructor(
    protected taskRegistryService: TaskRegistryService,
    private readonly factsService: FactService,
    private readonly llmService: LLMServiceBase,
  ) {
    super(taskRegistryService);
  }

  async execute(request: TaskHandlerContext): Promise<TaskHandlerResult> {
    const { parameters: params, user } = request;
    const typedParams = params as RetrieveFactParams;

    if (!typedParams.query?.trim()) {
      return {
        status: TaskHandlerStatus.CLARIFICATION_NEEDED,
        reply: 'What would you like me to recall?',
      };
    }

    try {
      // 1. Get all facts the user is allowed to see
      const visibleFacts = await this.factsService.reader().getFactsByUser(user);

      if (visibleFacts.length === 0) {
        return {
          status: TaskHandlerStatus.CLARIFICATION_NEEDED,
          reply: "You haven't stored any facts yet.",
        };
      }

      // 2. Build a rich prompt for the LLM
      const factsList = visibleFacts
        .map(f => `• ${f.key}: ${f.value}`)
        .join('\n');

      const prompt = `
You are a precise memory assistant for a family.

Here are all the facts currently stored for this user:

${factsList}

User's request: "${typedParams.query}"

Return a JSON object with the following structure:
{
  "found": true or false,
  "key": "the exact key of the matching fact (if found)",
  "value": "the exact value of the matching fact (if found)",
  "answer": "a natural, friendly, and concise response to the user"
}

Only return the JSON. No extra text.
`;

      // 3. Query the LLM
      const llmResult = await this.llmService.queryLLM<{
        action: LLMAction;
        key?: string;
        value?: string;
        answer: string;
      }>({
        prompt,
        userId: user.id,
        eventType: LLMEventType.TASK_FOLLOWUP,
      });

      const result = llmResult; // already parsed by your LLMServiceBase

      if (result.action === LLMAction.CLARIFY || !result.value) {
        return {
          status: TaskHandlerStatus.CLARIFICATION_NEEDED,
          reply: result.answer || `I couldn't find anything matching "${typedParams.query}".`,
        };
      }

      return {
        status: TaskHandlerStatus.SUCCESS,
        reply: result.answer,
        data: {
          key: result.key,
          value: result.value,
          query: typedParams.query,
        },
      };
    } catch (error: any) {
      this.logger.error('RetrieveFactTool error:', error);
      return {
        status: TaskHandlerStatus.ERROR,
        error: 'Sorry, I couldn’t look that up right now.',
      };
    }
  }
}