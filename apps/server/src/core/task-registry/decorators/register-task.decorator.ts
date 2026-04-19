import { TaskName } from "src/core/entities/task/task-name";
import { TaskHandlerBase } from "src/tools/task-handler.base";
import { TaskRegistryService } from "../registry/task-registry.service";

/**
 * Decorator to automatically register a tool with the ToolRegistryService.
 * 
 * Usage:
 * @RegisterTool(TaskName.QueryDevice)
 * @Injectable()
 * export class QueryDeviceTool extends ToolBase { ... }
 */
export function RegisterTask(taskName: TaskName) {
  return function (target: any) {
    // Store the taskName on the class so we can access it during registration
    Reflect.defineMetadata('task:taskName', taskName, target);

    // Wrap the constructor to register the instance after it's created
    const originalConstructor = target;

    function WrappedConstructor(...args: any[]) {
      const instance = Reflect.construct(originalConstructor, args) as TaskHandlerBase;

      // Find the ToolRegistryService in the injected dependencies
      const registry = args.find(
        (arg) => arg instanceof TaskRegistryService
      ) as TaskRegistryService | undefined;

      if (registry) {
        registry.register(instance, taskName);
      } else {
        console.warn(
          `[RegisterTool] Tool ${target.name} could not find TaskRegistryService in constructor. ` +
          'Make sure ToolRegistryService is injected into the task.'
        );
      }

      return instance;
    }

    // Preserve prototype and static properties
    WrappedConstructor.prototype = originalConstructor.prototype;
    Object.setPrototypeOf(WrappedConstructor, originalConstructor);

    return WrappedConstructor as any;
  };
}