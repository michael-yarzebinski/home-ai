import { Injectable, Logger } from "@nestjs/common";
import { LLMServiceBase } from "src/ai/llm-services/llm.service.base";
import { ChatMessage, ConversationStateService } from "src/core/entities/conversation-state/conversation-state.service";
import { PermissionCheckResult, UserPermissionsService } from "src/core/user-permissions/user-permissions.service";
import { User } from "src/core/entities/user/user.domain";
import { UsersService } from "src/core/entities/user/user.service";
import { MessageRequest } from "./interfaces/message-request";
import { TaskRouter } from "./router/task.router";
import { LogService } from "src/core/entities/monitoring/log/log.serice";
import { TaskRegistryService, TaskWithSchema } from "src/core/task-registry/registry/task-registry.service";
import { ValidationService } from "src/core/validation/validation.service";
import { LLMAction, LLMEventType } from "src/ai/llm.dtos";
import { TaskRequestsService } from "src/core/entities/task-request/task-requests.service";
import { IdentifiedTaskResult, TaskIdentificationService } from "./task-identification.service";
import { Task } from "src/core/entities/task/task.domain";
import { TaskHandlerContext } from "src/tools/interfaces/task-handler-context";
import { TaskRequest } from "src/core/entities/task-request/task-request.domain";
import { TaskHandlerResult, TaskHandlerStatus } from "src/tools/interfaces/task-handler-result";
import { TransactionManager } from "src/core/database/transaction-manager";
import { ConversationState } from "src/core/entities/conversation-state/conversation-state.domain";
import { NotificationService } from "src/core/entities/notification/notification.service";

export interface TaskPipelineResult {
  response: string;
  status: string;
}

export interface TaskDetectionContext {
  chatHistory: ChatMessage[];
  tasks: { task_name: string; description?: string }[];
}

enum MessageClassification {
  APPROVAL = 'approval',
  TASK = 'task',
  RETRY = 'retry',
  NONE = 'none',
}

enum ValidationStatus {
  SUCCESS = 'success',
  FAILURE = 'failure'
}

interface ValidationFailure {
  status: ValidationStatus.FAILURE
  result: TaskPipelineResult;
}

@Injectable()
export class AIOrchestratorService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly llmService: LLMServiceBase,
    private readonly userPermissionsService: UserPermissionsService,
    protected readonly taskRouter: TaskRouter,
    protected readonly usersService: UsersService,
    protected readonly conversationStatesService: ConversationStateService,
    private readonly logService: LogService,
    private readonly validationService: ValidationService,
    private readonly taskRequestsService: TaskRequestsService,
    private readonly taskIdentificationService: TaskIdentificationService,
    private readonly taskRegistryService: TaskRegistryService,
    private readonly notificationService: NotificationService,
  ) {
  }

  async processMessage(request: MessageRequest): Promise<TaskPipelineResult> {
    this.logger.debug('processMessage: IN');

    const validationResult = await this.validateRequest(request);
    if (validationResult.status === 'failure') {
      return validationResult.result
    }

    const { user, text } = validationResult;
    const chatHistory = await this.buildChatMessages({ ...request, messageText: text }, user.id);
    const messageClassification = await this.classifyMessage(text, user, chatHistory);

    return this.transactionManager.execute(async (trx) => {
      let taskHandlerContext: TaskHandlerContext;

      if (messageClassification === MessageClassification.APPROVAL) {
        const approvalResult = await this.handleTaskRequestApproval(text, user, chatHistory);
        if (approvalResult.status === ValidationStatus.FAILURE) {
          return approvalResult.result;
        }

        taskHandlerContext = {
          parameters: approvalResult.typedParameters,
          task: approvalResult.task,
          taskRequest: approvalResult.taskRequest,
          user,
          chatHistory,
        };
        if (approvalResult.decision === 'rejected') {
          await this.persistConversationResult(request.chatGuid, user.id, taskHandlerContext, {status: TaskHandlerStatus.SUCCESS, reply: 'Task Request was successfully rejected'});
          return { status: 'success', response: 'Task Request was successfully rejected.' };
        }
      } 
      else if (messageClassification === MessageClassification.TASK) {
        const handleTaskRequestResult = await this.handleTaskRequest(user, chatHistory);
        if (handleTaskRequestResult.status === ValidationStatus.FAILURE) {
          return handleTaskRequestResult.result;
        }

        taskHandlerContext = {
          parameters: handleTaskRequestResult.typedParameters,
          task: handleTaskRequestResult.task,
          taskRequest: handleTaskRequestResult.taskRequest,
          user,
          chatHistory,
        };
      } 
      else if (messageClassification === MessageClassification.RETRY) {
        const retryResult = await this.handleTaskRetry(text, user, chatHistory);
        if (retryResult.status === ValidationStatus.FAILURE) {
          return retryResult.result;
        }

        taskHandlerContext = {
          parameters: retryResult.typedParameters,
          task: retryResult.task,
          taskRequest: retryResult.taskRequest,
          user,
          chatHistory,
        };
      } 
      else {
        return {
          status: 'failure',
          response: 'Sorry. I could not understand your request. Would you like to try again?',
        };
      }

      // Execute the task
      const taskHandlerResult = await this.taskRouter.dispatch(taskHandlerContext);

      // === FINAL STEPS (always run) ===
      await this.persistConversationResult(
        request.chatGuid,
        user.id,
        taskHandlerContext,
        taskHandlerResult
      );

      if (taskHandlerResult.status === TaskHandlerStatus.SUCCESS) {
        await this.logService.log({
          message: `Task Request ${taskHandlerContext.taskRequest.readableId} completed successfully.`,
          severity: 'info',
          userId: user.id,
          data: { task: taskHandlerContext.task, taskRequest: taskHandlerContext.taskRequest },
        });

        await this.sendNotifications(
          taskHandlerContext
        );

        return {
          status: 'success',
          response: taskHandlerResult.reply || 'Task completed successfully.',
        };
      }

      if (taskHandlerResult.status === TaskHandlerStatus.CLARIFICATION_NEEDED) {
        await this.logService.log({
          message: `Task Request ${taskHandlerContext.taskRequest.readableId} requires additional clarification.`,
          severity: 'info',
          userId: user.id,
          data: { task: taskHandlerContext.task, taskRequest: taskHandlerContext.taskRequest },
        });

        await this.taskRequestsService.updateTaskRequest(taskHandlerContext.taskRequest.id, {
          status: 'clarification-needed',
        });

        return {
          status: 'clarification-needed',
          response: taskHandlerResult.reply
        }
      }
      else {
        trx.rollback();
        return {
          status: 'error',
          response: 'Task could not be completed.',
        };
      }
    });

  }

  private async validateRequest(request: MessageRequest): Promise<{
    status: ValidationStatus.SUCCESS
    user: User,
    text: string,
  } | ValidationFailure> {
    const failureResult: ValidationFailure = { status: ValidationStatus.FAILURE, result: { status: '', response: '' } };

    if (!request.userIdentifier || request.userIdentifier.trim() === "") {
      return failureResult;
    }

    const user = await this.usersService.reader().getByUserIdOrMessagingId(request.userIdentifier.trim()) ?? undefined;;
    if (!user) {
      await this.logService.log({
        message: `User ${request.userIdentifier} not recognized`,
        severity: 'warn',
        userId: request.userIdentifier,
        data: request,
      })
      return failureResult;
    }

    const text = request.messageText?.trim();
    if (!text) {
      await this.logService.log({
        message: 'No message provided',
        severity: 'warn',
        data: request,
      })
      return failureResult;
    }

    return {
      status: ValidationStatus.SUCCESS,
      user,
      text,
    }
  }

  private async classifyMessage(messageText: string, user: User, chatHistory: ChatMessage[]): Promise<MessageClassification> {
    const prompt = `You are an intelligent routing assistant for a Home AI system.

Analyze the user's message and classify it into one of these categories:

1. "approval"   → User is approving or declining a pending task request
2. "task"       → User is requesting the AI to perform a normal task
3. "retry"      → User wants to retry a previous task
4. "none"       → Message is unrelated to any task, approval, or retry

Message: "${messageText}"

YOU MUST RETURN ONLY VALID JSON IN THIS EXACT FORMAT. NOTHING ELSE.

{
  "type": "approval" | "task" | "retry" | "none",
}

Rules:
- If the message clearly refers to approving or declining a task request, use "type": "approval"
- If the message is asking the AI to do something new, use "type": "task"
- If the message is asking to retry a previous task (especially if it mentions a number like #10 or "retry"), use "type": "retry"
- Be decisive. When in doubt between retry and task, prefer "task"
- Do not add any extra text, explanations, or markdown outside the JSON object

Now classify the message.`;

    const result = await this.llmService.queryLLM<{
      action: LLMAction.EXECUTE,
      type: 'approval' | 'task' | 'retry' | 'none';
    }>({
      prompt: prompt,
      userId: user.id,
      chatHistory,
      eventType: LLMEventType.TASK_OR_APPROVAL,
    });

    return result.type as MessageClassification;
  }

  /**
 * Handles approval/denial responses like "Approved", "Approve #17", "Decline Task 5", etc.
 */
  private async handleTaskRequestApproval(
    messageText: string,
    user: User,
    chatHistory: ChatMessage[],
  ): Promise<{
    status: ValidationStatus.SUCCESS,
    decision: 'approved' | 'rejected',
    task: TaskWithSchema,
    taskRequest: TaskRequest,
    typedParameters: any,
  } | ValidationFailure> {
    // Use LLM to parse the intent more accurately
    const prompt = `
  You are an approval handler. Analyze this message and determine if the user is approving or declining a pending task request.
  
  Message: "${messageText}"
  
  Return ONLY valid JSON in this exact format:
  {
    "decision": "approved" | "rejected" | "none",
    "readableId": number or null,
  }
  `;

    const result = await this.llmService.queryLLM<{
      action: LLMAction.EXECUTE,
      decision: 'approved' | 'rejected' | 'none';
      readableId?: number;
      reason?: string;
    }>({
      prompt: prompt,
      userId: user.id,
      chatHistory,
      eventType: LLMEventType.TASK_FOLLOWUP,
    });

    if (result.decision === 'none' || !result.readableId) {
      return {
        status: ValidationStatus.FAILURE,
        result: {
          status: 'failure',
          response: 'Sorry.  I could not identify which task you were trying to approve.  Can you please provide the task request id?'
        }
      }
    }

    const taskRequest = await this.taskRequestsService.reader().getByReadableId(result.readableId);
    if (!taskRequest) {
      await this.logService.log({
        message: `User attempted to approve a task request that did not exist.`,
        severity: 'warn',
        data: {
          message: messageText,
        },
        userId: user.id
      });

      return {
        status: ValidationStatus.FAILURE,
        result: {
          response: `I couldn't find Task Request #${result.readableId}.`,
          status: 'error',
        }
      };
    }

    if (taskRequest.approvedByUserId) {
      await this.logService.log({
        message: `User attempted to approve a task request that has already been approved.`,
        severity: 'warn',
        data: {
          readableId: taskRequest.readableId,
          message: messageText,
        },
        userId: user.id
      });

      return {
        status: ValidationStatus.FAILURE,
        result: {
          response: `Task has already been approved.`,
          status: 'error',
        }
      };
    }

    const task = await this.taskRegistryService.getTaskByName(taskRequest.taskName);
    if (!task) {
      await this.logService.log({
        message: `Task Request is not associated with any task.`,
        severity: 'error',
        data: {
          message: messageText,
        },
        userId: user.id
      });

      return {
        status: ValidationStatus.FAILURE,
        result: {
          response: `I couldn't find Task Request #${result.readableId}.`,
          status: 'error',
        }
      };
    }

    const permissionsResult = await this.validatePermissions(task, user, true);
    if (permissionsResult.status === ValidationStatus.FAILURE) {
      return permissionsResult;
    }

    const permissionResult = this.userPermissionsService.checkPermission(user, task);
    if (!permissionResult.canExecute) {
      await this.logService.log({
        message: `User attempted to approve a task they did not have permission to approve`,
        severity: 'warn',
        data: {
          message: messageText,
        },
        userId: user.id
      });


      return {
        status: ValidationStatus.FAILURE,
        result: {
          response: 'You do not have permission to approve this task',
          status: 'error'
        }
      }
    }

    let taskRequestUpdated: TaskRequest;
    const decision = result.decision;

    if (decision === 'approved') {
      taskRequestUpdated = await this.taskRequestsService.approveTaskRequest(taskRequest.id, user.id);
    } else {
      taskRequestUpdated = await this.taskRequestsService.rejectTaskRequest(taskRequest.id);
    }

    return {
      status: ValidationStatus.SUCCESS,
      decision,
      task,
      taskRequest: taskRequestUpdated,
      typedParameters: taskRequest.parameters,
    }
  }

  private async handleTaskRequest(user: User, chatHistory: ChatMessage[]): Promise<{
    status: ValidationStatus.SUCCESS
    task: TaskWithSchema,
    taskRequest: TaskRequest,
    typedParameters: any,
    requiresApproval: boolean,
  } | ValidationFailure> {
    const taskIdentificationResult = await this.taskIdentificationService.identifyTask(user.id, chatHistory);
    if (taskIdentificationResult.action === LLMAction.CLARIFY || taskIdentificationResult.action === LLMAction.UNSUPPORTED) {
      return { status: ValidationStatus.FAILURE, result: taskIdentificationResult.taskPipelineResult };
    }

    const { task, parameters } = taskIdentificationResult as IdentifiedTaskResult;

    const permissionsResult = await this.validatePermissions(task, user);
    if (permissionsResult.status === ValidationStatus.FAILURE) {
      return permissionsResult;
    }

    const { permissions } = permissionsResult;
    const requiresApproval = !permissions.canExecute;
    const typedParametersResult = await this.validateParameters(parameters, task);
    if (typedParametersResult.status === ValidationStatus.FAILURE) {
      return typedParametersResult;
    }
    const { typedParameters } = typedParametersResult;

    const taskRequest = await this.taskRequestsService.createTaskRequest({
      taskName: task.taskName,
      requesterUserId: user.id,
      executorUserId: user.id,
      parameters: typedParameters,
      status: 'in-progress',
      requiresApproval,
      quietHoursQueued: false,
    });

    return {
      status: ValidationStatus.SUCCESS,
      task,
      taskRequest,
      typedParameters,
      requiresApproval,
    }
  }

  private async handleTaskRetry(messageText: string, user: User, chatHistory: ChatMessage[],): Promise<{
    status: ValidationStatus.SUCCESS,
    task: TaskWithSchema,
    taskRequest: TaskRequest,
    typedParameters: any,
  } | ValidationFailure> {

    const prompt = `You are an expert at parsing retry requests for a Home AI system.

The user has already been classified as wanting to retry a previous task.

Your ONLY job is to extract the task request ID from this message.

Message: "${messageText}"

Return ONLY valid JSON in this exact format:

{
  "readableId": number or null,
}

Rules:
- Look for any number preceded by "#", "task", "request", or similar words (e.g. "#17", "task 17", "request #5")
- Return the number as "readableId"
- If you cannot clearly identify a number, return readableId: null
- Be very precise — only return a number if you are confident

Now extract the readableId.`;
    const result = await this.llmService.queryLLM<{
      action: LLMAction.EXECUTE,
      readableId: number | null;
    }>({
      prompt: prompt,
      userId: user.id,
      eventType: LLMEventType.TASK_FOLLOWUP,
      chatHistory,
    });

    if (!result.readableId) {
      return {
        status: ValidationStatus.FAILURE,
        result: {
          status: 'failure',
          response: 'Sorry.  I could not identify which task you were trying to retry.  Can you please provide the task request id?'
        }
      }
    }

    const taskRequest = await this.taskRequestsService.reader().getByReadableId(result.readableId);
    if (!taskRequest) {
      await this.logService.log({
        message: `User attempted to approve a task request that did not exist.`,
        severity: 'warn',
        data: {
          message: messageText,
        },
        userId: user.id
      });

      return {
        status: ValidationStatus.FAILURE,
        result: {
          response: `I couldn't find Task Request #${result.readableId}.`,
          status: 'error',
        }
      };
    }

    const task = await this.taskRegistryService.getTaskByName(taskRequest.taskName);
    if (!task) {
      await this.logService.log({
        message: `Task Request is not associated with any task.`,
        severity: 'error',
        data: {
          message: messageText,
        },
        userId: user.id
      });

      return {
        status: ValidationStatus.FAILURE,
        result: {
          response: `I couldn't find Task Request #${result.readableId}.`,
          status: 'error',
        }
      };
    }

    const permissionsResult = await this.validatePermissions(task, user, true);
    if (permissionsResult.status === ValidationStatus.FAILURE) {
      return permissionsResult;
    }

    const permissionResult = this.userPermissionsService.checkPermission(user, task);
    if (!permissionResult.canExecute) {
      await this.logService.log({
        message: `User attempted to approve a task they did not have permission to approve`,
        severity: 'warn',
        data: {
          message: messageText,
        },
        userId: user.id
      });


      return {
        status: ValidationStatus.FAILURE,
        result: {
          response: 'You do not have permission to approve this task',
          status: 'error'
        }
      }
    }

    return {
      status: ValidationStatus.SUCCESS,
      task,
      taskRequest: taskRequest,
      typedParameters: taskRequest.parameters,
    }
  }

  private async validatePermissions(task: Task, user: User, requireExecute: boolean = false): Promise<{ status: ValidationStatus.SUCCESS, permissions: PermissionCheckResult } | ValidationFailure> {
    const permissions = this.userPermissionsService.checkPermission(user, task);

    if ((requireExecute || !permissions.canRequest) && !permissions.canExecute) {
      await this.logService.log({
        message: `User did not meet the permissions to request or execute the specified task`,
        severity: 'warn',
        data: {
          task,
        },
        userId: user.id
      });
      return { status: ValidationStatus.FAILURE, result: { status: '', response: '' } };
    }

    return {
      status: ValidationStatus.SUCCESS,
      permissions
    }
  }

  private async validateParameters(parameters: Record<string, any>, task: TaskWithSchema): Promise<{ status: ValidationStatus.SUCCESS, typedParameters: any } | ValidationFailure> {
    let typedParameters: typeof task.parameters;
    try {
      typedParameters = await this.validationService.validateAndTransform(parameters, task.parameters)
    }
    catch (error) {
      await this.logService.log({
        message: `Could not validate params for task ${task.taskName}.  Please verify schema provided matches dto for specific task handler.`,
        severity: 'error',
        data: {
          taskParameters: parameters,
          error: JSON.stringify(error),
        },
      });

      return {
        status: ValidationStatus.FAILURE,
        result: {
          response: `Could not identify required task parameters: ${error?.message}.  Please contact your system administrator.`,
          status: 'failure'
        }
      }
    }

    return {
      status: ValidationStatus.SUCCESS,
      typedParameters,
    }
  }

  /**
   * After any pipeline outcome, merge assistant output into the conversation row (iMessage, chat UI, etc.).
   */
  private async persistConversationResult(
    chatGuid: string | undefined,
    userId: string,
    context: TaskHandlerContext,
    result: TaskHandlerResult,
  ): Promise<void> {
    if (!chatGuid) {
      return; // No conversation to persist (e.g. direct API call without chatGuid)
    }

    try {
      // Find or create the conversation state
      const state = await this.conversationStatesService.findOrCreateByChatGuid(chatGuid, userId);

      const updateData: Partial<ConversationState> = {
        currentTaskName: context.task.taskName,
        lastAIMessage: result.status !== TaskHandlerStatus.ERROR ? result.reply : '',
        conversationSummary: result.status !== TaskHandlerStatus.ERROR ? result.reply.substring(0,300) : '',
        relatedTaskRequestId: context.taskRequest?.id ?? state.relatedTaskRequestId,
        status: 'completed',
        lastActivityAt: new Date(),
      };

      // If we have a clarification, preserve it
      if (result.status === 'clarification-needed' && result.reply) {
        updateData.clarificationQuestion = result.reply;
        updateData.status = 'active'; // keep conversation open
      }

      await this.conversationStatesService.updateFromAIOutput(chatGuid, updateData);

      this.logger.debug(`Conversation state updated for chatGuid ${chatGuid}`);
    } catch (error) {
      this.logger.error('Failed to persist conversation result', error);
      // Never let conversation persistence break the main flow
    }
  }

  /**
   * Builds `ChatMessage[]` for the LLM: multi-turn from DB when `chatGuid` is set, otherwise one user turn.
   */
  private async buildChatMessages(
    request: MessageRequest & { messageText: string },
    resolvedUserId: string,
  ): Promise<ChatMessage[]> {
    const text = request.messageText.trim();

    if (request.chatGuid) {
      const state = await this.conversationStatesService.findOrCreateByChatGuid(
        request.chatGuid,
        resolvedUserId,
      );
      return this.conversationStatesService.buildChatHistory(state, text);
    }

    return [{ role: 'user', content: text }];
  }

  /**
 * Send notifications to the appropriate roles if the task defines notify_roles.
 * This is called only on successful task execution.
 */
  private async sendNotifications(
    context: TaskHandlerContext,
  ): Promise<void> {
    try {

      const isApproval = context.taskRequest.requiresApproval && context.taskRequest.status === 'pending'
      const rolesToNotify = isApproval ? context.task.executeRoles : context.task.notifyRoles;
      const usersToNotify = await this.usersService.reader().getByRoles(rolesToNotify);
      if (usersToNotify.length === 0) {
        return;
      }

      const messageContent = await this.generateTaskSummary(context, isApproval);

      for (const user of usersToNotify) {
        await this.notificationService.createNotification({
          recipientUserId: user.id,                    // TODO: resolve approvers by role later
          taskRequestId: context.taskRequest.id,
          messageText: messageContent,
          status: 'pending',
        });
      }
    } catch (error) {
      this.logger.error('Failed to send notifications', error);

      await this.logService.log({
        message: 'Notification delivery failed',
        severity: 'error',
        data: {
          readableId: context.taskRequest.readableId,
          taskName: context.task.taskName,
          error: error.message,
        },
        userId: context.user.id,
      });
    }
  }

  /**
* Generate a natural, friendly summary using the LLM.
* Includes context about approval vs completion and who performed the action.
*/
  private async generateTaskSummary(
    context: TaskHandlerContext,
    isApproval: boolean = false,
  ): Promise<string> {
    const actionType = isApproval ? 'requires-approval' : 'completed';

    const prompt = `
You are a helpful home AI assistant writing a notification for the family.

Context:
- Task: ${context.task.taskName}
- Description: ${context.task.description || 'No description provided'}
- Performed by: ${context.user.name}
- Task Request #: ${context.taskRequest.readableId}
- Action: ${actionType}
- Parameters: ${JSON.stringify(context.taskRequest.parameters)}

Write a short, natural, friendly summary (1-2 sentences) that can be sent as a notification or shown in chat.
Make it sound conversational and helpful. Do not use technical terms.

Return ONLY valid JSON in this exact format:

{
  "message": string,
}


Summary:
`;

    try {
      const response = await this.llmService.queryLLM<{ action: LLMAction.EXECUTE, message: string }>({
        prompt,
        userId: context.user.id,
        eventType: LLMEventType.NOTIFICATION_MESSAGE,
      });

      return response.message;
    } catch (error) {
      this.logger.warn('Failed to generate task summary with LLM, falling back to default', error);
      if (actionType === 'requires-approval') {
        return `Task ${context.taskRequest.readableId} requires your approval.
                Task Name: ${context.task.taskName}
                Parameters: ${JSON.stringify(context.task.parameters)}`
      }
      else {
        return `Task ${context.taskRequest.readableId} has been completed.
                Task Name: ${context.task.taskName}
                Parameters: ${JSON.stringify(context.task.parameters)}`
      }
    }
  }
}
