import type { Tool } from '@home-ai/shared/domain/tool/tool';
import type { ToolHandler } from '../abstract/tool-handler';

export type RegisteredTool = Tool & {
  /** The actual executable handler */
  handler: ToolHandler;


  // TODO:
  // Get rid of these
  /** Can this user request / see this tool? */
  canRequest?: boolean;

  /** Can this user perform write actions with this tool? */
  canWrite?: boolean;
}