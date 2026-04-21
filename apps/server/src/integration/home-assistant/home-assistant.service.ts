// apps/server/src/core/homeassistant/home-assistant.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { AppConfigService } from '../../core/entities/app-config/app-config.service';
import { createConnection, subscribeEntities, subscribeServices, HassEntities, HassEntity, Connection } from 'home-assistant-js-websocket';
import { HomeAssistantBase } from 'src/core/home-assistant/home-assistant.base';
import { LogService } from 'src/core/entities/monitoring/log/log.serice';

export interface HomeAssistantDevice {
  deviceSlug: string;
  entityId?: string;
  context: any;
}

@Injectable()
export class HomeAssistantService extends HomeAssistantBase implements OnModuleDestroy {
  private entities: HassEntities = {};

  constructor(
    protected readonly appConfig: AppConfigService,
    protected readonly logService: LogService,
  ) {
    super(appConfig, logService);
    this.subscribeToEntities(this.onEntities.bind(this));
  }

  protected onEntities(entities:HassEntities) {
    this.entities = entities;
  }

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

  /**
   * Human-readable rows for admin UI (in-memory HA entity map).
   */
  getEntitySummaries(): Array<{
    entityId: string;
    friendlyName?: string;
    state?: string;
    deviceClass?: string;
  }> {
    return Object.values(this.entities)
      .map((e) => ({
        entityId: e.entity_id,
        friendlyName: e.attributes?.friendly_name as string | undefined,
        state: e.state,
        deviceClass: e.attributes?.device_class as string | undefined,
      }))
      .sort((a, b) => a.entityId.localeCompare(b.entityId));
  }

  /** Base URL for opening Home Assistant in a browser (from HOME_ASSISTANT_URL). */
  getWebUiBaseUrl(): string | null {
    try {
      const raw = this.appConfig.getFromEnv<string>('HOME_ASSISTANT_URL')?.trim();
      if (!raw) {
        return null;
      }
      let u = raw;
      if (u.startsWith('ws:')) {
        u = `http:${u.slice(3)}`;
      } else if (u.startsWith('wss:')) {
        u = `https:${u.slice(4)}`;
      }
      u = u.replace(/\/api\/websocket\/?$/i, '').replace(/\/$/, '');
      return u || null;
    } catch {
      return null;
    }
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