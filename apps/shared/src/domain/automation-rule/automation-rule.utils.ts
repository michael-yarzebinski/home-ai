import type { AutomationRule } from "./automation-rule";

export class AutomationRuleUtils {
  /**
   * True when the rule has never run, has no cooldown (≤0 min), or the cooldown interval has passed since lastRun.
   */
  static isOffCooldown(
    rule: Pick<AutomationRule, "lastRun" | "cooldownMinutes">,
    now: Date = new Date(),
  ): boolean {
    const cooldownMs = rule.cooldownMinutes * 60_000;
    if (cooldownMs <= 0) {
      return true;
    }
    if (!rule.lastRun) {
      return true;
    }
    return now.getTime() - rule.lastRun.getTime() >= cooldownMs;
  }
}
