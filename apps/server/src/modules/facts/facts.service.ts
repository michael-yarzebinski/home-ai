import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';

export interface FactRecord {
  id?: number;
  key: string;
  value: string;
  owner_user_id?: string | null;
  visibility_roles?: string;
  created_at?: Date;
  updated_at?: Date;
}

@Injectable()
export class FactsService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  /**
   * Store or update a fact/preference.
   * Uses key as unique identifier (UPSERT pattern).
   */
  async storeFact(
    key: string,
    value: string,
    ownerUserId?: string | null,
    visibilityRoles: string = 'parent,child'
  ): Promise<FactRecord> {
    const normalizedKey = key.toLowerCase().trim();

    const [fact] = await this.knex('facts')
      .insert({
        key: normalizedKey,
        value: value.trim(),
        owner_user_id: ownerUserId || null,
        visibility_roles: visibilityRoles,
      })
      .onConflict('key')
      .merge()
      .returning('*');

    return fact;
  }

  /**
   * Retrieve a fact by key.
   */
  async retrieveFact(key: string): Promise<FactRecord | null> {
    const normalizedKey = key.toLowerCase().trim();

    const fact = await this.knex('facts')
      .where('key', normalizedKey)
      .first<FactRecord>();

    return fact || null;
  }

  /**
   * Get all facts (optionally filtered by owner or visibility).
   */
  async findAll(): Promise<FactRecord[]> {
    return this.knex('facts')
      .orderBy('key')
      .select('*');
  }

  /**
   * Delete a fact by key.
   */
  async deleteFact(key: string): Promise<boolean> {
    const normalizedKey = key.toLowerCase().trim();
    const deleted = await this.knex('facts')
      .where('key', normalizedKey)
      .del();

    return deleted > 0;
  }
}
