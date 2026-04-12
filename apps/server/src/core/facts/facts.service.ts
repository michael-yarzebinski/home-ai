import { Injectable } from '@nestjs/common';
import { FactStore } from './fact.store';
import { Fact } from './fact.domain';

@Injectable()
export class FactsService {
  constructor(private readonly factStore: FactStore) {}

  reader(): Pick<FactStore, 'findAll' | 'retrieveFact'> {
    return this.factStore;
  }

  async storeFact(
    key: string,
    value: string,
    ownerUserId?: string | null,
    visibilityRoles: string = 'parent,child',
  ): Promise<Fact> {
    return this.factStore.storeFact(key, value, ownerUserId, visibilityRoles);
  }

  async retrieveFact(key: string): Promise<Fact | null> {
    return this.factStore.retrieveFact(key);
  }

  async findAll(): Promise<Fact[]> {
    return this.factStore.findAll();
  }

  async deleteFact(key: string): Promise<boolean> {
    return this.factStore.deleteFact(key);
  }
}
