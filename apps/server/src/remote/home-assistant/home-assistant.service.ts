// apps/server/src/core/homeassistant/home-assistant.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { AppConfigService } from '../../core/app-config/app-config.service';
import { createConnection, subscribeEntities, subscribeServices, HassEntities, HassEntity, Connection } from 'home-assistant-js-websocket';

export interface HomeAssistantDevice {
  deviceSlug: string;
  entityId?: string;
  context: any;
}

@Injectable()
export class HomeAssistantService implements OnModuleDestroy {
  private readonly logger = new Logger(HomeAssistantService.name);
  private connection: Connection | undefined;
  private entities: HassEntities = {};

  constructor(
    private readonly appConfig: AppConfigService,
  ) {
    this.connect();
    this.subscribeToEvents();
  }

  private async connect() {
    const url = this.appConfig.getFromEnv<string>('HOME_ASSISTANT_URL');
    const token = this.appConfig.getFromEnv<string>('HOME_ASSISTANT_TOKEN');

    try {
      this.connection = await createConnection({
        auth: {
            wsUrl: url.replace('http', 'ws') + '/api/websocket',
            accessToken: token,
            expired: false,
            refreshAccessToken: function (): Promise<void> {
                throw new Error('Function not implemented.');
            },
            revoke: function (): Promise<void> {
                throw new Error('Function not implemented.');
            },
        } as any,
      });

      // Subscribe to all entity state changes
      subscribeEntities(this.connection, (entities) => {
        this.entities = entities;
      });
      

      this.logger.log('✅ Connected to Home Assistant WebSocket');
    } catch (error) {
      this.logger.error('Failed to connect to Home Assistant WebSocket', error);
    } 
  }

  // a) Get all devices/entities from HA
  private async _getAllEntities(): Promise<HassEntities> {
    if (!this.connection) {
      await this.connect();
    }
    return this.entities;
  }

  async getAllEntities(): Promise<HomeAssistantDevice[]> {
    const haEntities = await this._getAllEntities();
    return Object.entries(haEntities).map(([deviceSlug, haEntity]) => ({
      deviceSlug,
      entityId: haEntity.entity_id,
      context: haEntity.context,
    }));


  }

  private async subscribeToEvents()
  {
    if (!this.connection) {
        await this.connect();
    }

    this.connection?.subscribeEvents((event) => {
        console.log('Event:', event);
    });
  }


  // b) Get status of a specific entity (device)
  async getState(entityId: string): Promise<HassEntity | null> {
    if (!this.connection) {
      await this.connect();
    }
    return this.entities[entityId] || null;
  }

  // Helper: Find device by friendly name (fuzzy)
  async findEntityByName(name: string): Promise<HassEntity | null> {
    const lowerName = name.toLowerCase();
    const entities = await this._getAllEntities();

    for (const entityId in entities) {
      const entity = entities[entityId];
      if (
        entity.attributes?.friendly_name?.toLowerCase().includes(lowerName) ||
        entityId.toLowerCase().includes(lowerName)
      ) {
        return entity;
      }
    }
    return null;
  }

  async onModuleDestroy() {
    if (this.connection) {
      this.connection.close();
    }
  }
}