// import { Injectable } from '@nestjs/common';
// import { LlmRunnerService } from 'src/ai/runner/llm-runner.service';
// import { ToolHandler } from 'src/tools/abstract/tool-handler';
// import { Tool } from 'src/tools/decorators/tool.decorator';
// import { ToolContext } from 'src/tools/types/tool-context';
// import { z } from 'zod';

// const GetWeeklyBriefingToolSchema = z.object({
//   startDate: z
//     .string()
//     .optional()
//     .describe('Optional start date in YYYY-MM-DD format. If omitted, uses today.'),
// });

// export interface GetWeeklyBriefingResult {
//   briefing: string;
//   message: string;
// }

// @Tool()
// @Injectable()
// export class GetWeeklyBriefingTool extends ToolHandler<
//   typeof GetWeeklyBriefingToolSchema,
//   GetWeeklyBriefingResult
// > {
//   readonly name = 'get-weekly-briefing';
//   readonly filterOnIsRecursiveCall = true;

//   readonly description =
//     'Generate a forward-looking weekly briefing for the user. ' +
//     'Includes upcoming calendar events for the next 7 days, weather trends, device highlights, shopping list items, and other relevant information.';

//   readonly parameters = GetWeeklyBriefingToolSchema;

//   constructor(private readonly llmRunnerService: LlmRunnerService) {
//     super();
//   }

//   async execute(
//     params: z.infer<typeof GetWeeklyBriefingToolSchema>,
//     context: ToolContext,
//   ): Promise<GetWeeklyBriefingResult> {
//     const dateStr = params.startDate || 'today';

//     const input = `Generate a helpful weekly briefing starting from ${dateStr}.

// Please include:
// - Major calendar events for the next 7 days
// - Weather trends and any notable forecasts
// - Important device statuses or changes expected this week
// - Any shopping list or note items that need attention
// - Any other relevant information the user should know for the upcoming week

// Be concise, natural, and actionable. Focus on what the user needs to know for planning.`;

//     const result = await this.llmRunnerService.handleEvent(
//       context.user,
//       input,
//       context.chatSessionId,
//       true,
//     );

//     return {
//       briefing: result.content || 'No weekly briefing available.',
//       message: `Weekly briefing starting from ${dateStr} generated.`,
//     };
//   }
// }
