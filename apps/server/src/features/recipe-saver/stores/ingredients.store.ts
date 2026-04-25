// features/ingredients/ingredients.store.ts
import type { Knex } from 'knex';
import { AbstractEntityStore } from '../../../core/stores/abstract/abstract-entity.store';
import type { Ingredient } from '@home-ai/shared/domain/ingredient/ingredient';
import type { SearchCriteria } from '@home-ai/shared/search/search';
import { Paginated } from '@home-ai/shared/search/pagination';
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
export class IngredientStore extends AbstractEntityStore<Ingredient, IngredientRecord> {
  constructor(@Inject('KNEX_CONNECTION') knex: Knex, auditStore: AuditStore) {
    super(knex, auditStore, { tableName: 'ingredients', entityType: 'ingredients' });
  }

  async search(criteria: SearchCriteria): Promise<Paginated<Ingredient>> {
    return {
        items: [],
        total: 0,
        page: criteria.page,
        pageSize: criteria.pageSize,
        hasNext: false,
        hasPrevious: false,
      };
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