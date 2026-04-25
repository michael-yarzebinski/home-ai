// import { Injectable } from '@nestjs/common';
// import { LlmRunnerService } from 'src/ai/runner/llm-runner.service';
// import { ToolHandler } from 'src/tools/abstract/tool-handler';
// import { Tool } from 'src/tools/decorators/tool.decorator';
// import { ToolContext } from 'src/tools/types/tool-context';
// import { z } from 'zod';

// const GetDailyBriefingToolSchema = z.object({
//   date: z
//     .string()
//     .optional()
//     .describe('Optional date in YYYY-MM-DD format. If omitted, uses today.'),
// });

// export interface GetDailyBriefingResult {
//   briefing: string;
//   message: string;
// }

// @Tool()
// @Injectable()
// export class GetDailyBriefingTool extends ToolHandler<
//   typeof GetDailyBriefingToolSchema,
//   GetDailyBriefingResult
// > {
//   readonly name = 'get-daily-briefing';
//   readonly filterOnIsRecursiveCall = true;

//   readonly description =
//     'Generate a forward-looking daily briefing for the user. ' +
//     'Include upcoming calendar events, weather, device status highlights, shopping list items, and any other relevant information for the day.';

//   readonly parameters = GetDailyBriefingToolSchema;

//   constructor(private readonly llmRunnerService: LlmRunnerService) {
//     super();
//   }

//   async execute(
//     params: z.infer<typeof GetDailyBriefingToolSchema>,
//     context: ToolContext,
//   ): Promise<GetDailyBriefingResult> {
//     const dateStr = params.date || 'today';

//     const input = `Generate a helpful daily briefing for ${dateStr}.

// Please include:
// - Upcoming calendar events for today
// - Current weather and forecast
// - Important device statuses (lights, doors, security, etc.)
// - Any items on shopping lists or notes that need attention
// - Any other relevant information the user should know for the day

// Be concise, natural, and actionable.`;

//     const result = await this.llmRunnerService.handleEvent(
//       context.user,
//       input,
//       context.chatSessionId,
//       true,
//     );

//     return {
//       briefing: result.content || 'No briefing available.',
//       message: `Daily briefing for ${dateStr} generated.`,
//     };
//   }
// }
