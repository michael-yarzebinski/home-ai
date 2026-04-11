import { DispatchResult } from './dispatch-result';

/**
 * Standardized result from a tool execution.
 * Extends DispatchResult but can be specialized per tool if needed.
 */
export interface ToolResult extends DispatchResult {}
