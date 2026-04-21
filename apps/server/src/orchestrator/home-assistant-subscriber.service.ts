import { Injectable, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { AppConfigService } from 'src/core/entities/app-config/app-config.service';
import { LogService } from 'src/core/entities/monitoring/log/log.serice';
import { HomeAssistantBase, HomeAssistantEvent } from 'src/core/home-assistant/home-assistant.base';
import { AIOrchestratorService } from '../orchestrator/ai-orchestrator.service';
import { DeviceService } from 'src/core/entities/device/device.service';
import { Device } from 'src/core/entities/device/device.domain';
import { MessageRequest, MessageSource } from '../orchestrator/interfaces/message-request';

@Injectable()
export class HomeAssistantSubscriberService extends HomeAssistantBase implements OnApplicationBootstrap, OnModuleDestroy {
    private readonly automationUserId;

    constructor(
        private readonly deviceService: DeviceService,
        private readonly orchestrationService: AIOrchestratorService,
        protected readonly appConfig: AppConfigService,
        protected readonly logService: LogService,
    ) {
        super(appConfig, logService);
        this.automationUserId = this.appConfig.getFromEnv('AUTOMATION_USER_ID');
    }

    async onApplicationBootstrap(): Promise<void> {
        console.error('Home Assistant Subscriber Service is up and running!!!')
        await this.subscribeToEvents(this.onEvent.bind(this));
    }

    protected async onEvent(event: HomeAssistantEvent): Promise<void> {
        await this.logService.log({
            severity: 'info',
            message: `Received an event for Home Assistant entity ${event.data?.entity_id}`,
        });

        if (!event.data?.entity_id) {
            await this.logService.log({
                severity: 'warn',
                message: `Entity Id is invalid.`,
                data: {
                    event,
                }
            });
            return;
        }

        const relevantDevice = await this.getRelevantDevice(event.data?.entity_id ?? '');
        if (!relevantDevice) {
            await this.logService.log({
                severity: 'info',
                message: `Could not find relevant entity for event`,
                data: {
                    event,
                }
            });
            return;
        }

        const changeDescription = `Home Assistant Device Update.  Triggering event to perform notify for device event.  HA device update: ${relevantDevice?.friendlyName} (${event.data?.entity_id}) changed from "${event.data?.old_state ? JSON.stringify(event.data?.old_state) : 'unknown'}" to "${event.data?.new_state ? JSON.stringify(event.data.new_state) : 'unknown'}". Attributes: ${JSON.stringify(event.data?.new_state?.attributes ?? {})}`;

        const syntheticRequest = {
            userIdentifier: this.automationUserId,
            messageText: changeDescription,
            source: MessageSource.DEVICE,
            pretypedParameters: {
                device: relevantDevice,
                entityId: event.data.entity_id,
                oldState: event.data.old_state,
                newState: event.data.new_state,
                attributes: event.data.new_state?.attributes,
            }
        };

        await this.orchestrationService.processMessage(syntheticRequest);
        await this.logService.log({
            severity: 'info',
            message: `Called Orchestration to process message`,
            data: {
                event,
            }
        });
    }

    private async getRelevantDevice(entityId: string): Promise<Device | undefined> {
        const activeDevices = await this.deviceService.reader().getAll();

        return activeDevices.find(ad => entityId.includes(ad.deviceIdSlug));
    }
}
