// src/features/recipes/recipes.store.ts
import type { Knex } from 'knex';
import { AbstractEntityStore } from '../../../core/stores/abstract/abstract-entity.store';
import type { Recipe, InsertableRecipe, UpdatableRecipe } from '@home-ai/shared/domain/recipe/recipe';
import { AuditStore } from '../../../core/stores/audit/audit.store';
import { Inject, Injectable } from '@nestjs/common';

export interface RecipeRecord {
  id: string;
  readable_id: number;
  url?: string;
  title: string;
  servings?: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class RecipeStore extends AbstractEntityStore<Recipe, RecipeRecord, InsertableRecipe, UpdatableRecipe> {
  constructor(@Inject('KNEX_CONNECTION') knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, { tableName: 'recipes', entityType: 'recipes' });
  }

  protected validateForRead(query: Knex.QueryBuilder): Knex.QueryBuilder {
    return query; // Admin-managed library content.
  }

  protected validateForWrite(query: Knex.QueryBuilder): Knex.QueryBuilder {
    return query;
  }

  protected applyTextSearch(query: Knex.QueryBuilder, search: string): Knex.QueryBuilder {
    const like = `%${search.toLowerCase()}%`;
    return query.where((b) =>
      b.whereILike('title', like).orWhereILike('url', like),
    );
  }

  protected recordToDomain(record: RecipeRecord): Recipe {
    return {
      id: record.id,
      readableId: record.readable_id,
      url: record.url,
      title: record.title,
      servings: record.servings,
      prepTimeMinutes: record.prep_time_minutes,
      cookTimeMinutes: record.cook_time_minutes,
      active: record.active,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  protected domainToRecord(domain: Recipe): RecipeRecord {
    return {
      id: domain.id,
      readable_id: domain.readableId,
      url: domain.url,
      title: domain.title,
      servings: domain.servings,
      prep_time_minutes: domain.prepTimeMinutes,
      cook_time_minutes: domain.cookTimeMinutes,
      active: domain.active,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }
}