import { z } from "zod";
import { Injectable } from "@nestjs/common";
import { ToolHandler } from "../../abstract/tool-handler";
import type { ToolContext } from "../../types/tool-context";
import { ClsService } from "nestjs-cls";
import { Tool } from "src/tools/decorators/tool.decorator";
import { HomeAssistantService } from "src/integrations/home-assistant/services/home-assistant.service";
import type { UnifiedImage } from "src/ai/types/llm-query-params";
import { TOOL_RESULT_IMAGES, TURN_IMAGE } from "./tool-result-images";

const CallHomeAssistantToolSchema = z.object({
  path: z
    .string()
    .min(1)
    .describe(
      "Home Assistant path or same-origin URL, such as /api/camera_proxy/camera.front_door_fluent?token=... or /api/states/binary_sensor.front_door_person. Keep the query string.",
    ),
  method: z
    .enum(["GET", "POST", "PUT", "DELETE"])
    .optional()
    .describe("HTTP method. Defaults to GET."),
  body: z
    .preprocess((value) => {
      if (value == null || value === "") {
        return undefined;
      }
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    }, z.unknown().optional())
    .describe("Optional JSON body for POST or PUT."),
});

export interface CallHomeAssistantResult {
  success: boolean;
  status: number;
  contentType?: string | null;
  data?: unknown;
  body?: string;
  message?: string;
  [TOOL_RESULT_IMAGES]?: UnifiedImage[];
}

@Tool()
@Injectable()
export class CallHomeAssistantTool extends ToolHandler<
  typeof CallHomeAssistantToolSchema,
  CallHomeAssistantResult
> {
  readonly name = "call-home-assistant";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Send an HTTP request to Home Assistant. Pass a path such as a camera entity_picture or /api/states/<entity_id>. " +
    "JSON and text come back as the tool result. An image response is attached on the following step. " +
    "In this step, call only this tool. Save the image with save-image on a later step, after you have received it.";

  readonly parameters = CallHomeAssistantToolSchema;

  constructor(
    private readonly haService: HomeAssistantService,
    private readonly cls: ClsService,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof CallHomeAssistantToolSchema>,
    _context: ToolContext,
  ): Promise<CallHomeAssistantResult> {
    const response = await this.haService.request({
      path: params.path,
      method: params.method,
      body: params.body,
    });

    const mimeType = imageMimeType(response.contentType, response.body);
    if (mimeType && response.status >= 200 && response.status < 300) {
      this.cls.set(TURN_IMAGE, {
        mimeType,
        bytes: response.body,
      });
      return {
        success: true,
        status: response.status,
        contentType: mimeType,
        message:
          "Home Assistant returned an image. The image is attached for the next step.",
        [TOOL_RESULT_IMAGES]: [
          {
            mimeType,
            data: response.body.toString("base64"),
          },
        ],
      };
    }

    const text = response.body.toString("utf8");
    if (response.status < 200 || response.status >= 300) {
      return {
        success: false,
        status: response.status,
        contentType: response.contentType,
        body: clip(text),
        message: `Home Assistant returned HTTP ${response.status}.`,
      };
    }

    const contentType = response.contentType?.split(";")[0]?.trim().toLowerCase();
    if (contentType?.includes("json") || looksLikeJson(text)) {
      try {
        return {
          success: true,
          status: response.status,
          contentType: response.contentType,
          data: JSON.parse(text),
        };
      } catch {
        // Fall through to text.
      }
    }

    return {
      success: true,
      status: response.status,
      contentType: response.contentType,
      body: clip(text),
    };
  }
}

export function imageMimeType(
  contentType: string | null,
  bytes: Buffer,
): string | undefined {
  const header = contentType?.split(";")[0]?.trim().toLowerCase();
  if (header === "image/jpg" || header === "image/jpeg") {
    return "image/jpeg";
  }
  if (
    header === "image/png" ||
    header === "image/webp" ||
    header === "image/gif"
  ) {
    return header;
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes.length >= 6 && bytes.subarray(0, 6).toString("ascii").startsWith("GIF8")) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return undefined;
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function clip(text: string): string {
  const limit = 100_000;
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}\n…truncated`;
}
