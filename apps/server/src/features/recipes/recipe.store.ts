// src/recipes/recipe.store.ts
import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/knex.constants';
import { AbstractEntityStore } from 'src/core/entities/abstract-entity.store';
import { AuditService } from 'src/core/entities/monitoring/audit/audit.service';
import { Recipe } from './recipe.domain';

// src/recipes/recipe.record.ts
export interface RecipeRecord {
    id: string;
    readable_id: number;
    title: string;
    source_url: string;
    pdf_path: string;
    raw_text?: string | null;
    metadata: Record<string, any>;
    active: boolean;
    created_at: Date;
    updated_at: Date;
  }

@Injectable()
export class RecipeStore extends AbstractEntityStore<RecipeRecord, Recipe> {
  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
    auditService: AuditService,
  ) {
    super(knex, auditService, {
      tableName: 'recipes',
      auditEntityType: 'Recipe',
      primaryKey: 'id',
      hasUpdatedAt: true,
      hasActiveFlag: true,
    });
  }

  protected domainToRecord(domain: Partial<Recipe>): Partial<RecipeRecord> {
    return {
      id: domain.id,
      readable_id: domain.readableId,
      title: domain.title,
      source_url: domain.sourceUrl,
      pdf_path: domain.pdfPath,
      raw_text: domain.rawText,
      metadata: domain.metadata ?? {},
      active: domain.active ?? true,
    };
  }

  protected recordToDomain(record: RecipeRecord): Recipe {
    return {
      id: record.id,
      readableId: record.readable_id,
      title: record.title,
      sourceUrl: record.source_url,
      pdfPath: record.pdf_path,
      rawText: record.raw_text ?? undefined,
      metadata: record.metadata ?? {},
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  async getByReadableId(readableId: number) : Promise<Recipe | null> {
    const recipe = await this.knex<RecipeRecord>(this.tableName).where('readable_id' , readableId).first();
    if (!recipe) {
        return null;
    }

    return this.recordToDomain(recipe);
  }

  async getByReadableIds(readableIds: number[]): Promise<Recipe[]> {
    if (readableIds.length === 0) {
        return [];
    }

    const recipes = await this.knex<RecipeRecord>(this.tableName).whereIn('readable_id' , readableIds);

    return recipes.map(r => this.recordToDomain(r));
  }
}