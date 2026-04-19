import { User } from 'src/core/entities/user/user.domain';
import { ChatMessage } from 'src/core/entities/conversation-state/conversation-state.service';
import { TaskRequest } from 'src/core/entities/task-request/task-request.domain';
import { TaskWithSchema } from 'src/core/task-registry/registry/task-registry.service';

export interface TaskHandlerContext {
  task: TaskWithSchema;
  taskRequest: TaskRequest
  user: User;
  parameters: any;
  chatHistory: ChatMessage[];
  metadata?: Record<string, any>;
}
