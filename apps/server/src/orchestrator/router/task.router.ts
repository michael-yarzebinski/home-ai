import { Injectable } from '@nestjs/common';
import { TaskHandlerBase } from '../../tools/task-handler.base';
import type { TaskHandlerContext } from '../../tools/interfaces/task-handler-context';
import { TaskRegistryService } from 'src/core/task-registry/registry/task-registry.service';
import { TaskName } from 'src/core/entities/task/task-name';
import { LogService } from 'src/core/entities/monitoring/log/log.serice';
import { TaskHandlerResult, TaskHandlerStatus } from 'src/tools/interfaces/task-handler-result';

@Injectable()
export class TaskRouter {
  constructor(
    private readonly taskRegistry: TaskRegistryService,
    private readonly logService: LogService,
  ) {
  }

  async dispatch(context: TaskHandlerContext): Promise<TaskHandlerResult> {
    const matchingTaskHandler = this.getTaskHandlerForTask(context.task.taskName);
    if (!matchingTaskHandler) {
      await this.logService.log({
        message: `No matching task handler for task name ${context.task.taskName}.  Please add a handler and restart the app.`,
        severity: 'error',
        data: context.task,
      })

      return {
        status: TaskHandlerStatus.ERROR,
        error: 'Could not find a task handler associated with this task.  Please contact your administrator',
      }
    }

    return await matchingTaskHandler.execute(context);
  }

  private getTaskHandlerForTask(taskName: TaskName | string): TaskHandlerBase | undefined {
    const taskHandler = this.taskRegistry.getTaskHandlerForTask(taskName);

    if (!taskHandler) {
      return undefined;
    }

    return taskHandler;
  }
}
