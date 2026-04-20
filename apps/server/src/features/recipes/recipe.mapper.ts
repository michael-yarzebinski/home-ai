import { RecipeCreateDto, RecipeDto, RecipeUpdateDto } from '@home-ai/shared';
import { Recipe } from './recipe.domain';

function toIso(d: Date): string {
  return d instanceof Date ? d.toISOString() : new Date(d as unknown as string).toISOString();
}

export function toRecipeDto(r: Recipe): RecipeDto {
  const dto = new RecipeDto();
  dto.id = r.id;
  dto.readableId = r.readableId;
  dto.title = r.title;
  dto.sourceUrl = r.sourceUrl;
  dto.pdfPath = r.pdfPath;
  dto.rawText = r.rawText ?? null;
  dto.metadata =
    r.metadata != null && typeof r.metadata === 'object' && !Array.isArray(r.metadata)
      ? { ...(r.metadata as Record<string, unknown>) }
      : {};
  dto.active = r.active;
  dto.createdAt = toIso(r.createdAt);
  dto.updatedAt = toIso(r.updatedAt);
  return dto;
}

export function fromRecipeCreateDto(body: RecipeCreateDto): {
  title: string;
  sourceUrl: string;
  pdfPath: string;
  rawText?: string;
  metadata?: Record<string, unknown>;
} {
  return {
    title: body.title,
    sourceUrl: body.sourceUrl,
    pdfPath: body.pdfPath,
    rawText: body.rawText,
    metadata: body.metadata,
  };
}

export function fromRecipeUpdateDto(body: RecipeUpdateDto): Partial<Recipe> {
  const out: Partial<Recipe> = {};
  if (body.title !== undefined) {
    out.title = body.title;
  }
  if (body.sourceUrl !== undefined) {
    out.sourceUrl = body.sourceUrl;
  }
  if (body.pdfPath !== undefined) {
    out.pdfPath = body.pdfPath;
  }
  if (body.rawText !== undefined) {
    out.rawText = body.rawText;
  }
  if (body.metadata !== undefined) {
    out.metadata = body.metadata;
  }
  if (body.active !== undefined) {
    out.active = body.active;
  }
  return out;
}
