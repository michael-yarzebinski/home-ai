import { z } from 'zod';

/**
 * Latency / priority tiers for LLM routing.
 * - IMMEDIATE: fast path for time-critical device automations (e.g. locks, motion)
 * - SOON: default path for non-urgent automations
 */
export enum LLMModelType {
  SOON = 'soon',
  IMMEDIATE = 'immediate',
}

export const LLMModelTypeSchema = z.nativeEnum(LLMModelType);
