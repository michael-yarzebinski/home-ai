import type { UnifiedImage } from "../../../ai/types/llm-query-params";

/** JSON serialization skips symbols, so image bytes stay out of logs and tool text. */
export const TOOL_RESULT_IMAGES = Symbol("toolResultImages");

/** Image bytes from the latest call-home-assistant response in this turn. */
export const TURN_IMAGE = "turnImage";

export interface TurnImage {
  mimeType: string;
  bytes: Buffer;
}

export function readToolResultImages(result: unknown): UnifiedImage[] {
  if (!result || typeof result !== "object") {
    return [];
  }
  const images = (result as Record<symbol, unknown>)[TOOL_RESULT_IMAGES];
  if (!Array.isArray(images)) {
    return [];
  }
  return images.filter(
    (image): image is UnifiedImage =>
      !!image &&
      typeof image === "object" &&
      typeof (image as UnifiedImage).mimeType === "string" &&
      typeof (image as UnifiedImage).data === "string",
  );
}
