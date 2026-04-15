import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ToolBase } from '../../../tools/tool.base';
import { TaskName } from '../../tasks/task-name';
import { Task } from 'src/core/tasks/task.domain';
import { TasksService } from 'src/core/tasks/tasks.service';

@Injectable()
export class ToolRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ToolRegistryService.name);

  /** Map from TaskName → Tool Instance */
  private readonly tools = new Map<TaskName, ToolBase>();

  constructor(private readonly taskService: TasksService) {}

  /**
   * Register a tool for a specific task.
   * Called automatically by the @RegisterTool decorator.
   */
  register(tool: ToolBase, taskName: TaskName): void {
    if (this.tools.has(taskName)) {
      this.logger.warn(`Overwriting existing tool for task: ${taskName}`);
    }

    this.tools.set(taskName, tool);
    this.logger.log(`✅ Registered tool for task: ${taskName}`);
  }

  /**
   * Get the tool instance for a given task name
   */
  getToolForTask(taskName: TaskName | string): ToolBase | undefined {
    return this.tools.get(taskName as TaskName);
  }

  /**
   * Get metadata for a task (useful for AI prompt building)
   */
  getMetadataForTask(taskName: TaskName | string): ToolBase['metadata'] | undefined {
    const tool = this.getToolForTask(taskName);
    return tool?.getMetadata();
  }

  /**
   * Get all registered task names
   */
  getAllRegisteredTaskNames(): TaskName[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get all registered tools
   */
  getAllTools(): ToolBase[] {
    return Array.from(this.tools.values());
  }

  async getTasksAndParameters(): Promise<Task[]> {
    const tasks = await this.taskService.reader().findEnabled();

    return tasks.map(t => {
      const toolForTask = this.getToolForTask(t.taskName);

      return {
        ...t,
        parametersSchema: toolForTask?.metadata.parameterDto
      }});
    }

  onModuleInit() {
    this.logger.log(`ToolRegistry initialized with ${this.tools.size} tools`);
  }
}