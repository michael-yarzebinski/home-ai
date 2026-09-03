import { Injectable, OnModuleInit } from '@nestjs/common';
import type {
  MemoryMetadata,
  MemoryRecord,
  MemorySearchCriteria,
} from '@home-ai/shared/admin/memory/memory';
import { toPaginated, type Paginated } from '@home-ai/shared/search/pagination';
import {
  ChromaClient,
  Collection,
  type GetResult,
  type QueryResult,
  type Where,
} from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';
import { AppConfigService } from '../../core/services/app-config.service';
import { LogStore } from '../../core/stores/monitoring/log/log.store';
import { Trace } from '../../common/decorators/trace.decorator';

interface ChromaMetadata {
  category: 'observation' | 'fact';
  userId?: string;
  targetEntityId?: string;
  timestamp: string;
}

@Injectable()
export class ChromaService implements OnModuleInit {
  private client: ChromaClient;
  private memoryCollection: Collection | undefined;
  private readonly embeddingFunction = new DefaultEmbeddingFunction({ dtype: 'q8' });

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly logStore: LogStore,
  ) {
    this.client = new ChromaClient({
      host: this.appConfigService.getFromEnv<string>('CHROMA_HOST'),
      port: this.appConfigService.getFromEnv<number>('CHROMA_PORT'),
    });
  }

  async onModuleInit() {
    try {
      await this.embeddingFunction.generate(['']);

      this.memoryCollection = await this.client.getOrCreateCollection({
        name: 'family-memory-space',
        embeddingFunction: this.embeddingFunction,
      });
    } catch (error) {
      await this.logStore.create({
        severity: 'error',
        message: 'Failed to initialize ChromaDB collection',
        metadata: { error: error instanceof Error ? error.message : error },
      });
    }
  }

  @Trace()
  async addRecord(params: {
    id: string;
    text: string;
    metadata: Omit<ChromaMetadata, 'timestamp'>;
  }) {
    await this.collection().add({
      ids: [params.id],
      metadatas: [{ ...params.metadata, timestamp: new Date().toISOString() }],
      documents: [params.text],
    });
  }

  @Trace()
  async search(criteria: MemorySearchCriteria): Promise<Paginated<MemoryRecord>> {

    let items: MemoryRecord[];
    let total: number;

    let where: Where | undefined;
    if (criteria.query) {
      where = {
        $or: [{ userId: criteria.query }, { targetEntityId: criteria.query }],
      };
    }

    const results = await this.collection().query({
      queryTexts: criteria.query ? [criteria.query] : undefined,
      where,
      nResults: 10000,
      include: ['documents', 'metadatas'],
    });

    const mappedResults = this.mapQueryResults(results);
    const offset = (criteria.page - 1) * criteria.pageSize;

    total = mappedResults.length;
    items = mappedResults.slice(offset, offset + criteria.pageSize);

    return toPaginated(items, total, criteria.page, criteria.pageSize);
  }

  @Trace()
  async getForUser(
    userId: string,
    query?: string,
    limit?: number,
  ): Promise<MemoryRecord[]> {

    const results = await this.collection().query({
      queryTexts: query ? [query] : undefined,
      where: { userId },
      nResults: limit ?? 10000,
      include: ['documents', 'metadatas'],
    });

    return this.mapQueryResults(results);
  }

  private mapQueryResults(results: QueryResult): MemoryRecord[] {
    const docs = results.documents?.[0];
    if (!docs?.length) return [];

    const rows: MemoryRecord[] = [];
    for (let idx = 0; idx < docs.length; idx++) {
      const doc = docs[idx];
      if (doc === null) continue;
      const distance = results.distances?.[0]?.[idx];
      rows.push({
        document: doc,
        metadata: results.metadatas[0]?.[idx] as MemoryMetadata,
        ...(distance != null ? { distance } : {}),
      });
    }
    return rows;
  }

  private collection(): Collection {
    if (!this.memoryCollection) {
      throw new Error('Chroma memory collection is not initialized');
    }
    return this.memoryCollection;
  }
}
