import { AutomationRule } from "@home-ai/shared/domain/automation-rule/automation-rule";
import { Device } from "@home-ai/shared/domain/device/device";
import { AutomationRuleUtils } from "@home-ai/shared/domain/automation-rule/automation-rule.utils";

export class HomeAssistantUtils {
  static doesDeviceSlugMatchEntityId(deviceSlug: string, entityId: string) {
    return entityId.toLowerCase().includes(deviceSlug.toLowerCase());
  }

  static getMatchingDeviceByEntityId(devices: Device[], entityId: string) {
    const matches = devices.filter((device) =>
      HomeAssistantUtils.doesDeviceSlugMatchEntityId(device.slug, entityId),
    );
    matches.sort((a, b) => b.slug.length - a.slug.length);
    return matches[0];
  }

  static filterAutomationRules(
    automationRules: AutomationRule[],
  ) {
    return automationRules.filter(
      (ar) => !ar.disabled && AutomationRuleUtils.isOffCooldown(ar),
    );
  }

  /** When enabled on the device, an "off" transition is stored and does not start an automation. */
  static isOffStateSkipped(device: Pick<Device, "ignoreOffState">, newState: string) {
    return device.ignoreOffState === true && newState.trim().toLowerCase() === "off";
  }

  /**
   * True when this entity id is on the device's ignore list.
   * Matching is case-insensitive and ignores surrounding whitespace.
   */
  static isIgnoredEntity(device: Pick<Device, "ignoredEntityIds">, entityId: string) {
    const normalizedEntityId = entityId.trim().toLowerCase();
    if (!normalizedEntityId) {
      return false;
    }
    return (device.ignoredEntityIds ?? []).some(
      (id) => id.trim().toLowerCase() === normalizedEntityId,
    );
  }
}
