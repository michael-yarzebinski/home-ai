// src/facts/fact.service.ts
import { Injectable } from '@nestjs/common';
import { FactDto, SearchRequestDto, SearchResponseDto, SearchUtils } from '@home-ai/shared';
import { FactStore } from './fact.store';
import { Fact } from './fact.domain';
import { toFactDto } from './fact.mapper';

@Injectable()
export class FactService {
  constructor(private readonly factStore: FactStore) {}

  reader(): Pick<FactStore, 'getAll' | 'getById' | 'getFactsByUser'> {
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

  async search(
    criteria: SearchRequestDto,
  ): Promise<SearchResponseDto<FactDto>> {
    const { skip, take } = SearchUtils.toSkipTake(criteria);
    const result = await this.factStore.search(
      criteria.search,
      skip,
      take,
      criteria.includeInactive,
    );
    const factDtos = result.data.map((f) => toFactDto(f));
    return SearchUtils.toSearchResponseDto(criteria, factDtos, result.total);
  }
}