// src/facts/fact.service.ts
import { Injectable } from '@nestjs/common';
import { FactStore } from './fact.store';
import { Fact } from './fact.domain';
import { v4 } from 'uuid';

@Injectable()
export class FactService {
  constructor(private readonly factStore: FactStore) {}

  reader(): Pick<FactStore, 'getAll' | 'getAllActive' | 'getById' | 'getFactsByUser'> {
    return this.factStore;
  }

  async createFact(data: {
    key: string;
    value: string;
    ownerUserId?: string;
    visibilityRoles?: string[];
  }): Promise<Fact> {
    return this.factStore.create({
      key: data.key,
      value: data.value,
      ownerUserId: data.ownerUserId,
      visibleToRoles: data.visibilityRoles ?? [],
    });
  }

  async updateFact(id: string, updates: Partial<Fact>): Promise<Fact> {
    return this.factStore.update(id, updates);
  }

  async deleteFact(id: string): Promise<number> {
    return this.factStore.delete(id);
  }
}