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
  ) {
    // Rule cooldown is the only remaining rate-limit gate for DEVICE triggers.
    return automationRules.filter((ar) => AutomationRuleUtils.isOffCooldown(ar));
  }
}
