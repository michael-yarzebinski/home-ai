import { promises as fs } from "fs";
import { basename, resolve, sep } from "path";
import { z } from "zod";
import { Injectable } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { ToolHandler } from "../../abstract/tool-handler";
import type { ToolContext } from "../../types/tool-context";
import { Tool } from "src/tools/decorators/tool.decorator";
import { AppConfigService } from "src/core/services/app-config.service";
import { TURN_IMAGE, type TurnImage } from "./tool-result-images";

const SaveImageToolSchema = z.object({
  filename: z
    .string()
    .min(1)
    .describe(
      "File name for the image already fetched in this turn, such as front_door_person_20261012_172805.jpg. Only the file name is used.",
    ),
});

export interface SaveImageResult {
  success: boolean;
  fileName: string;
  message: string;
}

@Tool()
@Injectable()
export class SaveImageTool extends ToolHandler<
  typeof SaveImageToolSchema,
  SaveImageResult
> {
  readonly name = "save-image";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Save an image that call-home-assistant has already returned. Pass only a file name. " +
    "Make sure you have received the image before attempting to save. " +
    "Call this on a later step, after that image is attached. " +
    "Call it only when the rule says to keep the image.";

  readonly parameters = SaveImageToolSchema;

  constructor(
    private readonly cls: ClsService,
    private readonly appConfigService: AppConfigService,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof SaveImageToolSchema>,
    _context: ToolContext,
  ): Promise<SaveImageResult> {
    const image = this.cls.get<TurnImage>(TURN_IMAGE);
    if (!image?.bytes?.length) {
      throw new Error(
        "No image is available in this turn. Call call-home-assistant first.",
      );
    }

    const fileName = basename(params.filename.trim());
    if (!fileName || fileName === "." || fileName === "..") {
      throw new Error("Image filename is required.");
    }

    const snapshotsDir = resolve(
      this.appConfigService.getFromEnv<string>("ATTACHMENTS_DIRECTORY"),
      "snapshots",
    );
    const filePath = resolve(snapshotsDir, fileName);
    if (!filePath.startsWith(snapshotsDir + sep)) {
      throw new Error("Snapshot path is outside the snapshots directory.");
    }

    await fs.mkdir(snapshotsDir, { recursive: true });
    await fs.writeFile(filePath, image.bytes);

    return {
      success: true,
      fileName,
      message: `Saved the image as ${fileName}.`,
    };
  }
}
