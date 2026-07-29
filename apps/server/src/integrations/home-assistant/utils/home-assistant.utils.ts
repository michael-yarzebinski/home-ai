import { AutomationRule, TriggerType } from '@home-ai/shared/domain/automation-rule/automation-rule';
import { Device } from '@home-ai/shared/domain/device/device';

export class HomeAssistantUtils {
    static doesDeviceSlugMatchEntityId(deviceSlug: string, entityId: string) {
        return entityId.toLowerCase().includes(deviceSlug.toLowerCase());
    }

    static getMatchingDeviceByEntityId(devices: Device[], entityId: string) {
        return devices.find(d => HomeAssistantUtils.doesDeviceSlugMatchEntityId(d.slug, entityId));
    }

    static filterAutomationRules(automationRules: AutomationRule[], device: Device, deviceCooldownMinutes: number) {
        return automationRules.filter(ar =>
            HomeAssistantUtils.isRulePassedCoolDown(ar) &&
            !HomeAssistantUtils.isDeviceTriggeredByServiceCall(device, deviceCooldownMinutes)
        );
    }

    static isRulePassedCoolDown(rule: AutomationRule) {
        const lastRunMs = HomeAssistantUtils.toTimestamp(rule.lastRun);
        if (lastRunMs === null) {
            return true;
        }

        const nextAllowedAt = lastRunMs + rule.cooldownMinutes * 60000;
        return Date.now() >= nextAllowedAt;
    }

    /** Coerce Date | string | undefined from DB/JSON into epoch ms. */
    static toTimestamp(value: Date | string | undefined | null): number | null {
        if (value == null) {
            return null;
        }

        const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
        return Number.isNaN(ms) ? null : ms;
    }

    // NOTE:
    // This method prevents ALL users from running Automation Rules if ANY user triggered the device manually.
    // This is easy to fix if needed.
    static isDeviceTriggeredByServiceCall(device: Device, cooldownMinutes: number) {
        if (!device.lastTriggeredService) {
            return false;
        }

        const nextAllowedAt = new Date(device.lastTriggeredService.timestamp).getTime() + cooldownMinutes * 60000;
        return Date.now() < nextAllowedAt;
    }

}