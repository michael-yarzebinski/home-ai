import { AppConfigService } from "../entities/app-config/app-config.service";
// apps/server/src/core/homeassistant/home-assistant.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createConnection, subscribeEntities, subscribeServices, HassEntities, HassEntity, Connection } from 'home-assistant-js-websocket';
import { LogService } from "../entities/monitoring/log/log.serice";

export interface HomeAssistantDevice {
    entityId: string;
    friendlyName: string;
    state?: string;
    deviceClass?: string;
}

export interface HomeAssistantState {
    entity_id: string;
    state: string;
    attributes: Record<string, any>;
    last_changed: string;
    last_reported: string;
    last_updated: string;
    context: Record<string, any>;
}

export interface HomeAssistantEvent {
    eventType: string;
    data?: {
        entity_id: string;
        old_state?: HomeAssistantState;
        new_state?: HomeAssistantState;
    }
}


export abstract class HomeAssistantBase implements OnModuleDestroy {
    protected connection: Connection | undefined;
    // private entities: HassEntities = {};

    constructor(protected readonly appConfig: AppConfigService, protected readonly logService: LogService) { 
        this.connect();
    }

    protected async connect() {
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
        } catch (error) {

        }
    }

    protected async subscribeToEvents(callback: (event: HomeAssistantEvent) => {}) {
        if (!this.connection) {
            await this.connect()
        }

        this.connection?.subscribeEvents(callback);
    }

    protected async subscribeToEntities(callback: (entities:HassEntities) => {}) {
        if (!this.connection) {
            await this.connect();
        }
        
        subscribeEntities(this.connection!, callback)
    }

    async onModuleDestroy() {
        if (this.connection) {
          this.connection.close();
        }
      }

}