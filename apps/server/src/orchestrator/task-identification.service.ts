import { Injectable } from "@nestjs/common";
import { LLMServiceBase } from "src/ai/llm-services/llm.service.base";
import { LLMAction, LLMEventType } from "src/ai/llm.dtos";
import { ChatMessage } from "src/core/entities/conversation-state/conversation-state.service";
import { TaskRegistryService, TaskWithSchema } from "src/core/task-registry/registry/task-registry.service";
import type { TaskPipelineResult } from "./task-pipeline-result";
import { LogService } from "src/core/entities/monitoring/log/log.serice";

interface AITask {
    taskName: string;
    description: string;
    parametersSchema: any
}

type LLMTaskIdentificationResult = {
    action: LLMAction.CLARIFY,
    clarifyingQuestion: string;
    pendingParameters: Record<string, any>
} |
{
    action: LLMAction.EXECUTE;
    taskName: string;
    parameters: Record<string, any>;
} |
{
    action: LLMAction.UNSUPPORTED;
};

export type IdentifiedTaskResult = {
    action: LLMAction.EXECUTE,
    task: TaskWithSchema,
    parameters: Record<string, any>;
}

export type TaskIdentificationResult = IdentifiedTaskResult |
{
    action: LLMAction.CLARIFY | LLMAction.UNSUPPORTED,
    taskPipelineResult: TaskPipelineResult
}

@Injectable()
export class TaskIdentificationService {

    constructor(
        private readonly taskRegistryService: TaskRegistryService,
        private readonly llmService: LLMServiceBase,
        private readonly logService: LogService,
    ) { }

    async identifyTask(userId: string, chatHistory: ChatMessage[]): Promise<TaskIdentificationResult> {
        const tasks = await this.taskRegistryService.getTasksAndParameters();
        const aiTasks = await this.generateAITasks(tasks);
        const prompt = this.generateTaskPrompt(aiTasks);

        const taskIdentificationResult = await this.llmService.queryLLM<LLMTaskIdentificationResult>({
            prompt,
            userId,
            chatHistory,
            eventType: LLMEventType.TASK_CATEGORIZATION
        });

        if (taskIdentificationResult.action === LLMAction.UNSUPPORTED) {
            await this.logService.log({
                message: `AI was prompted to perform a task that is not supported`,
                severity: 'warn',
                data: {
                    prompt,
                    response: 'Sorry.  I cannot support the specific task requested.  Can you rephrase your prompt?'
                },
                userId,
            });

            return {
                action: LLMAction.UNSUPPORTED,
                taskPipelineResult:
                {
                    response: 'Sorry.  I cannot support the specific task requested.  Can you rephrase your prompt?',
                    status: LLMAction.UNSUPPORTED,
                }
            }
        }
        else if (taskIdentificationResult.action === LLMAction.CLARIFY || !tasks.find((t) => t.taskName === taskIdentificationResult.taskName)) {
            const clarifyingQuestion = taskIdentificationResult.action === LLMAction.CLARIFY ? taskIdentificationResult.clarifyingQuestion : 'Sorry.  I did not understand the task you want me to perform.  Can you rephrase your prompt?';

            await this.logService.log({
                message: `AI requested clarification for Task Categorization`,
                severity: 'info',
                data: {
                    prompt,
                    response: clarifyingQuestion
                },
                userId
            });

            return {
                action: LLMAction.CLARIFY,
                taskPipelineResult: {
                    response: clarifyingQuestion,
                    status: LLMAction.CLARIFY,
                }
            };
        }
        const identifiedTask = tasks.find((t) => t.taskName === taskIdentificationResult.taskName)!;

        return {
            action: LLMAction.EXECUTE,
            task: identifiedTask,
            parameters: taskIdentificationResult.parameters,
        }
    }


    private generateTaskPrompt(tasks: AITask[]): string {
        let taskSection = 'AVAILABLE TASKS:\n\n';

        tasks.forEach((task) => {
            taskSection += `TASK NAME: ${task.taskName}\n`;
            taskSection += `DESCRIPTION: ${task.description || 'No description provided'}\n`;

            if (task.parametersSchema) {
                try {
                    const schema = typeof task.parametersSchema === 'string'
                        ? JSON.parse(task.parametersSchema)
                        : task.parametersSchema;

                    taskSection += `SCHEMA (YOU MUST FOLLOW THIS EXACTLY):\n`;
                    taskSection += JSON.stringify(schema, null, 2) + '\n\n';
                } catch (e) {
                    taskSection += `SCHEMA: (unavailable)\n\n`;
                }
            } else {
                taskSection += `SCHEMA: (no parameters required)\n\n`;
            }
        });

        return `You are a strict, precise Home AI task extractor.
      
      ${taskSection}
      
      STRICT RULES:
      - If the user's request clearly matches one of the available tasks above, choose "execute".
      - If the request does NOT match any available task (e.g. "get latest news", "play music", "what's the weather"), set "action": "unsupported".
      - Only use "clarify" when you are close to performing a task but are missing required parameters.
      - Never guess. Never invent tasks that are not in the list.
      - Return ONLY valid JSON. No explanations, no markdown, no extra text.
      
      OUTPUT FORMAT (exactly this structure):
      
      {
        "action": "execute" | "clarify" | "unsupported",
        "taskName": "exact taskName from the list (or null if unsupported)",
        "parameters": { ...must strictly match the schema... } or {},
        "clarifyingQuestion": "natural question to ask the user" or null,
        "pendingParameters": { ...missing required fields... } or {},
        "conversationSummary": "very brief summary" or null
      }
      
      Now process the user's latest message.`;
    }

    private async generateAITasks(tasks: TaskWithSchema[]): Promise<AITask[]> {
        return tasks.map(t => ({
            taskName: t.taskName,
            description: t.description,
            parametersSchema: t.parametersSchema
        }));
    }
}