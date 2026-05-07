import { InjectRedis } from "@nestjs-modules/ioredis";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import Redis from "ioredis";
import { DeviceStore } from "../../../core/stores/device/device.store";
import { OrchestratorService } from "../../../ai/orchestrator/orchestrator.service";
import { Job } from "bullmq";
import { TriggerConfigDevice } from "@home-ai/shared/domain/automation-rule/automation-rule";
import { LLMModelTypes } from "../../../ai/llm/llm.provider.sevice";
import { LogStore } from "../../../core/stores/monitoring/log/log.store";
import { UserStore } from "../../../core/stores/user/user.store";
import { OnModuleInit } from "@nestjs/common";
import { AppConfigService } from "../../../core/services/app-config.service";
import { User } from "@home-ai/shared/domain/user/user";
import { AutomationRuleStore } from "../../../core/stores/automation-rule/automation-rule.store";
import { HomeAssistantService } from "./home-assistant.service";
import { EventQueueBuffer } from "../types/event-queue";

@Processor("ha-events")
export class HomeAssistantProcessor extends WorkerHost implements OnModuleInit {
  private automationUserId: string;
  private automationUser: User | null = null;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly orchestratorService: OrchestratorService,
    private readonly deviceStore: DeviceStore,
    private readonly userStore: UserStore,
    private readonly logStore: LogStore,
    private readonly appConfigService: AppConfigService,
    private readonly automationRuleStore: AutomationRuleStore,
    private readonly homeAssistantService: HomeAssistantService,
  ) {
    super();

    this.automationUserId =
      this.appConfigService.getFromEnv("AUTOMATION_USER_ID");
  }

  async onModuleInit() {
    this.automationUser = await this.userStore.getById(this.automationUserId);
  }

  async process(job: Job<{ deviceId: string }>): Promise<void> {
    const redisKey = `ha_event:${job.data.deviceId}`;
    const rawBuffer = await this.redis.get(redisKey);
    const device = await this.deviceStore.getById(job.data.deviceId);
    if (!device || !rawBuffer || !this.automationUser) {
      await this.logStore.create({
        severity: "error",
        message:
          "Could not process device event: Device, Buffer, or Automation User not found",
        metadata: {
          deviceId: device?.id,
          buffer: rawBuffer,
          automationUserId: this.automationUser?.id,
        },
      });
      return;
    }
    const buffer = JSON.parse(rawBuffer) as EventQueueBuffer;
    const automationRules = await this.automationRuleStore.getByIds(
      buffer.ruleIds,
    );
    const deviceState =
      await this.homeAssistantService.getDeviceStateAndServices(device.slug);

    // Should be safe to delete the buffer at this point
    await this.redis.del(redisKey);

    const entitiesCurrentState = buffer.events.reduce(
      (acc, e) => {
        const entity = deviceState.entities.find(
          (es) => es.entityId === e.entityId,
        );
        if (!entity) {
          return acc;
        }

        acc.set(entity.entityId, {
          entityId: entity.entityId,
          state: entity.state,
          attributes: entity.attributes,
        });

        return acc;
      },
      new Map<
        string,
        {
          entityId: string;
          state: string;
          attributes: Record<string, any>;
        }
      >(),
    );

    const automationRulesPrompt = automationRules
      .map(
        (ar) =>
          `Name: ${ar.name}User ID: ${ar.userId}\nDescription: ${ar.description}\nTrigger: ${(ar.trigger as TriggerConfigDevice).intent}\nActions: ${ar.actions.map((a) => `Instruction: ${a.instruction}\n Metadata: ${JSON.stringify(a.metadata)}`).join("\n")}`,
      )
      .join("\n");

    const prompt = `
    ## System Role
    You are the Orchestration Engine for "Home AI." Your goal is to evaluate real-time IoT state transitions and execute the appropriate reactions (Notifications or Tasks) based on user-defined preferences.

    ## Context: Home Assistant State Transition
    The device "${device.friendlyName}" (${device.slug}) has changed state.  Current time is ${new Date().toISOString()}.

    ## Changes
    ${buffer.events.map((e) => `- Old State: ${e.oldState} - New State: ${e.newState}`).join("\n")}

    ## Current State
    ${JSON.stringify(Array.from(entitiesCurrentState.values()))}

    ## Automation Rules
    ${automationRulesPrompt}

    ## Objective
    Evaluate the event and execute only valid rule-based actions.

    1. Match rules strictly:
      - A rule is eligible only if its trigger matches this event exactly.
      - DEVICE match requires:
        - rule.trigger.type = "DEVICE"
        - rule.trigger.deviceId = "${device.id}"

    2. Ignore noise:
      - Do not react to insignificant state jitter.
      - Only react when transition is meaningful for the rule intent.

    3. Execute actions:
      - Execute only actions defined in matched rules.
      - Do not invent tools, fields, or rule logic.
      - For notifications, use the rule message/instructions and include relevant current values.
      - For tasks, call the explicit tool required by the rule action.

    4. Safety behavior:
      - If no rule matches, call no tools.
      - If required fields are missing or ambiguous, skip and explain briefly.
    
    Decision Logic: Concise. Prioritize safety and convenience.
    `;

    await this.orchestratorService.handleEvent(
      this.automationUser,
      prompt,
      `automation:${device.slug}`,
      LLMModelTypes.SOON,
    );
  }
}
