// src/ingredients/ingredient.store.ts
import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/knex.constants';
import { AbstractEntityStore } from 'src/core/entities/abstract-entity.store';
import { AuditService } from 'src/core/entities/monitoring/audit/audit.service';
import { Ingredient } from './ingredient.domain';

export interface IngredientRecord {
    id: string;
    recipe_id: string;
    name: string;
    original_name?: string | null;
    quantity?: string | null;
    unit?: string | null;
    notes?: string | null;
    active: boolean;
    created_at: Date;
    updated_at: Date;
  }

@Injectable()
export class IngredientStore extends AbstractEntityStore<IngredientRecord, Ingredient> {
  constructor(
    @Inject(KNEX_CONNECTION) knex: Knex,
    auditService: AuditService,
  ) {
    super(knex, auditService, {
      tableName: 'ingredients',
      auditEntityType: 'Ingredient',
      hasUpdatedAt: true,
      hasActiveFlag: true,
    });
  }

  protected domainToRecord(domain: Partial<Ingredient>): Partial<IngredientRecord> {
    return {
      id: domain.id,
      recipe_id: domain.recipeId,
      name: domain.name,
      original_name: domain.originalName,
      quantity: domain.quantity,
      unit: domain.unit,
      notes: domain.notes,
      active: domain.active ?? true,
    };
  }

  protected recordToDomain(record: IngredientRecord): Ingredient {
    return {
      id: record.id,
      recipeId: record.recipe_id,
      name: record.name,
      originalName: record.original_name ?? undefined,
      quantity: record.quantity ?? undefined,
      unit: record.unit ?? undefined,
      notes: record.notes ?? undefined,
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected searchQuery(search: string, query: Knex.QueryBuilder<IngredientRecord>): Knex.QueryBuilder<IngredientRecord> {
    const escaped = search.trim().replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    const like = `%${escaped}%`;
  
    return query.andWhere(function () {
      this.whereRaw(`name ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`COALESCE(original_name, '') ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`COALESCE(quantity, '') ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`COALESCE(unit, '') ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`COALESCE(notes, '') ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`CAST(recipe_id AS text) ILIKE ? ESCAPE '\\'`, [like])
        .orWhereRaw(`CAST(id AS text) ILIKE ? ESCAPE '\\'`, [like]);
    });
  }

  async getByRecipeIds(recipeIds: string[]) : Promise<Ingredient[]> {
    const ingredients = await this.knex<IngredientRecord>(this.tableName).whereIn('recipe_id', recipeIds);

    return ingredients.map((i) => this.recordToDomain(i));
  }
}