import { AutomationRule } from "@home-ai/shared/domain/automation-rule/automation-rule";
import { Device } from "@home-ai/shared/domain/device/device";
import { AutomationRuleUtils } from "@home-ai/shared/domain/automation-rule/automation-rule.utils";

export class HomeAssistantUtils {
  static doesDeviceSlugMatchEntityId(deviceSlug: string, entityId: string) {
    return entityId.toLowerCase().includes(deviceSlug.toLowerCase());
  }

  static getMatchingDeviceByEntityId(devices: Device[], entityId: string) {
    return devices.find((d) =>
      HomeAssistantUtils.doesDeviceSlugMatchEntityId(d.slug, entityId),
    );
  }

  static filterAutomationRules(
    automationRules: AutomationRule[],
    device: Device,
    deviceCooldownMinutes: number,
  ) {
    return automationRules.filter(
      (ar) =>
        AutomationRuleUtils.isOffCooldown(ar) &&
        !HomeAssistantUtils.isDeviceTriggeredByServiceCall(
          device,
          deviceCooldownMinutes,
        ),
    );
  }

  // NOTE:
  // This method prevents ALL users from running Automation Rules if ANY user triggered the device manually.
  // This is easy to fix if needed.
  static isDeviceTriggeredByServiceCall(
    device: Device,
    cooldownMinutes: number,
  ) {
    if (!device.lastTriggeredService) {
      return false;
    }

    const nextAllowedAt =
      new Date(device.lastTriggeredService.timestamp).getTime() +
      cooldownMinutes * 60000;
    return Date.now() < nextAllowedAt;
  }
}
