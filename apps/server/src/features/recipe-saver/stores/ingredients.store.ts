// features/ingredients/ingredients.store.ts
import type { Knex } from 'knex';
import { AbstractEntityStore } from '../../../core/stores/abstract/abstract-entity.store';
import type { Ingredient, InsertableIngredient, UpdatableIngredient } from '@home-ai/shared/domain/ingredient/ingredient';
import { AuditStore } from '../../../core/stores/audit/audit.store';
import { Inject, Injectable } from '@nestjs/common';

export interface IngredientRecord {
  id: string;
  recipe_id: string;
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class IngredientStore extends AbstractEntityStore<Ingredient, IngredientRecord, InsertableIngredient, UpdatableIngredient> {
  constructor(@Inject('KNEX_CONNECTION') knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, { tableName: 'ingredients', entityType: 'ingredients' });
  }

  protected validateForRead(query: Knex.QueryBuilder): Knex.QueryBuilder {
    return query; // Scoped to recipe via recipeId — no separate user filtering needed.
  }

  protected validateForWrite(query: Knex.QueryBuilder): Knex.QueryBuilder {
    return query;
  }

  protected applyTextSearch(query: Knex.QueryBuilder, search: string): Knex.QueryBuilder {
    const like = `%${search.toLowerCase()}%`;
    return query.where((b) =>
      b.whereILike('name', like).orWhereILike('notes', like),
    );
  }

  protected recordToDomain(record: IngredientRecord): Ingredient {
    return {
      id: record.id,
      recipeId: record.recipe_id,
      name: record.name,
      quantity: record.quantity,
      unit: record.unit,
      notes: record.notes,
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: Ingredient): IngredientRecord {
    return {
      id: domain.id,
      recipe_id: domain.recipeId,
      name: domain.name,
      quantity: domain.quantity,
      unit: domain.unit,
      notes: domain.notes,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }
}