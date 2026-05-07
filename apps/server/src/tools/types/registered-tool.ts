import type { Tool } from "@home-ai/shared/domain/tool/tool";
import type { ToolHandler } from "../abstract/tool-handler";

export type RegisteredTool = Tool & {
  handler: ToolHandler;
  canRequest?: boolean;
  canWrite?: boolean;
};
