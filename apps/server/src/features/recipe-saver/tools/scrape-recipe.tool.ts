// src/tools/default/scrape-recipe.tool.ts
import { z } from "zod";
import * as puppeteer from "puppeteer";
import * as fs from "fs/promises";
import * as path from "path";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { AppConfigService } from "src/core/services/app-config.service";
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";

const ScrapeRecipeToolSchema = z.object({
  url: z.string().url().describe("The full URL of the recipe webpage"),
});

export interface ScrapeRecipeResult {
  success: boolean;
  title?: string;
  content?: string; // We'll return one clean block of text
  temporaryPdfPath: string;
  message: string;
}

@Tool()
@Injectable()
export class ScrapeRecipeTool extends ToolHandler<
  typeof ScrapeRecipeToolSchema,
  ScrapeRecipeResult
> {
  readonly name = "scrape-recipe";
  readonly description =
    "Extracts the clean, ad-free text content of a recipe webpage. " +
    "Removes navigation, ads, and footers, returning only the title and core recipe text.";

  readonly parameters = ScrapeRecipeToolSchema;

  constructor(private readonly appConfigService: AppConfigService) {
    super();
  }

  async execute(
    params: z.infer<typeof ScrapeRecipeToolSchema>,
  ): Promise<ScrapeRecipeResult> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    try {
      // Set a realistic user agent to avoid being blocked
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      );
      await page.goto(params.url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Save PDF for archival (keep your existing logic)
      const temporaryPdfPath = await this.generatePdf(page, params.url);

      // Get the raw HTML and pass it to Readability
      const html = await page.content();
      const dom = new JSDOM(html, { url: params.url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!article) {
        throw new Error("Could not parse content from this URL.");
      }

      return {
        success: true,
        title: article.title ?? undefined,
        content: article.textContent?.trim(), // This is the "magic" clean text
        temporaryPdfPath,
        message: `Successfully extracted clean content from ${article.title}`,
      };
    } catch (err: any) {
      return {
        success: false,
        temporaryPdfPath: "",
        message: `Scrape failed: ${err.message}`,
      };
    } finally {
      await browser.close();
    }
  }

  private async generatePdf(
    page: puppeteer.Page,
    url: string,
  ): Promise<string> {
    const attachmentsDir = this.appConfigService.getFromEnv<string>(
      "ATTACHMENTS_DIRECTORY",
    );
    const recipeOriginalsDir = path.join(attachmentsDir, "recipes");
    await fs.mkdir(recipeOriginalsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeTitle = url.split("/").filter(Boolean).pop() || "recipe";
    const pdfPath = path.join(
      recipeOriginalsDir,
      `${timestamp}-${safeTitle}.pdf`,
    );

    await page.pdf({ path: pdfPath, format: "A4", printBackground: true });
    return pdfPath;
  }
}
