import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TaskHandlerBase } from '../../../tools/task-handler.base';
import { TaskName } from '../../entities/task/task-name';
import { Task } from 'src/core/entities/task/task.domain';
import { TasksService } from 'src/core/entities/task/tasks.service';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { getMetadataStorage } from 'class-validator';

export type TaskWithSchema = Task & {parametersSchema: string | undefined};

@Injectable()
export class TaskRegistryService implements OnModuleInit {
  private readonly logger = new Logger(TaskRegistryService.name);

  /** Map from TaskName → Tool Instance */
  private readonly tasks = new Map<TaskName, TaskHandlerBase>();

  constructor(private readonly taskService: TasksService) {}

  /**
   * Register a tool for a specific task.
   * Called automatically by the @RegisterTool decorator.
   */
  register(task: TaskHandlerBase, taskName: TaskName): void {
    if (this.tasks.has(taskName)) {
      this.logger.warn(`Overwriting existing task for task: ${taskName}`);
    }

    this.tasks.set(taskName, task);
    this.logger.log(`✅ Registered task for task: ${taskName}`);
  }

  /**
   * Get the tool instance for a given task name
   */
  getTaskHandlerForTask(taskName: TaskName | string): TaskHandlerBase | undefined {
    return this.tasks.get(taskName as TaskName);
  }

  /**
   * Get metadata for a task (useful for AI prompt building)
   */
  getMetadataForTask(taskName: TaskName | string): TaskHandlerBase['metadata'] | undefined {
    const taskHandler = this.getTaskHandlerForTask(taskName);
    return taskHandler?.getMetadata();
  }

  /**
   * Get all registered task names
   */
  getAllRegisteredTaskNames(): TaskName[] {
    return Array.from(this.tasks.keys());
  }

  /**
   * Get all registered tools
   */
  getAllTasks(): TaskHandlerBase[] {
    return Array.from(this.tasks.values());
  }

  async getTasksAndParameters(): Promise<TaskWithSchema[]> {
    const tasks = await this.taskService.reader().getAll();

  return tasks.map(t => {
      const handlerForTask = this.getTaskHandlerForTask(t.taskName);

      return {
        ...t,
        parameters: handlerForTask?.metadata.parameters,
        parametersSchema: handlerForTask?.metadata.parametersSchema
      }});
    }

  async getTaskByName(taskName: string): Promise<TaskWithSchema> {
    const task = await this.taskService.reader().getByTaskName(taskName) as Task;
    const taskHandler = this.getTaskHandlerForTask(task.taskName);

    return {
      ...task,
      parameters: taskHandler?.metadata.parameters,
      parametersSchema: taskHandler?.metadata.parametersSchema,
    }


  } 
  onModuleInit() {
    this.logger.log(`ToolRegistry initialized with ${this.tasks.size} tools`);
  }
}