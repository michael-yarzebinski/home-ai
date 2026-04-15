import { TaskName } from "src/core/tasks/task-name";
import { ToolBase } from "src/tools/tool.base";
import { ToolRegistryService } from "../registry/tool-registry.service";

/**
 * Decorator to automatically register a tool with the ToolRegistryService.
 * 
 * Usage:
 * @RegisterTool(TaskName.QueryDevice)
 * @Injectable()
 * export class QueryDeviceTool extends ToolBase { ... }
 */
export function RegisterTool(taskName: TaskName) {
  return function (target: any) {
    // Store the taskName on the class so we can access it during registration
    Reflect.defineMetadata('tool:taskName', taskName, target);

    // Wrap the constructor to register the instance after it's created
    const originalConstructor = target;

    function WrappedConstructor(...args: any[]) {
      const instance = Reflect.construct(originalConstructor, args) as ToolBase;

      // Find the ToolRegistryService in the injected dependencies
      const registry = args.find(
        (arg) => arg instanceof ToolRegistryService
      ) as ToolRegistryService | undefined;

      if (registry) {
        registry.register(instance, taskName);
      } else {
        console.warn(
          `[RegisterTool] Tool ${target.name} could not find ToolRegistryService in constructor. ` +
          'Make sure ToolRegistryService is injected into the tool.'
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