// src/tools/decorators/tool.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const TOOL_METADATA = 'TOOL_METADATA';

/**
 * Simple metadata decorator.
 * Do NOT return a new constructor — it breaks subclass typing.
 */
export const Tool = () => {
  return (target: any) => {
    SetMetadata(TOOL_METADATA, true)(target);
    // Do not return anything (or return undefined)
    // Returning a constructor causes the exact error you're seeing
  };
};