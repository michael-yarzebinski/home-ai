# Tech Debt

General backlog of things to tackle — focused on tech debt and correctness, not a product roadmap.

**How to use**
- Add new items under **Open**
- Each item needs a **title**, **date added**, and a collapsible **description**
- Move finished items to **Done** (keep the original date added; optionally note completed date in the description)
- Cursor agents should maintain this file when debt is found or resolved

---

## Open

### Automation notifications are too slow
- **Added:** 2026-07-29
- **Status:** open

<details>
<summary>Description</summary>

Device events wait `HOME_ASSISTANT_DEVICE_COOLDOWN_MINUTES` (default 5) before the LLM runs, then notifications sit in Postgres `notification_queue` until a cron that runs every 10 minutes. End-to-end can feel like 5–15+ minutes.

Desired direction (not implemented):
- ~30s per-device coalesce so related HA entity changes compile into one evaluation
- Per-rule `cooldownMinutes` + persisted `lastRun` as the anti-flood throttle
- Faster notification delivery (shorter cron or immediate send for automation alerts)
- In-memory buffer is enough for single-process; Redis only if multi-instance later

Related: closed speculative PR #1 in favor of tracking here first.

</details>

### Rule cooldown (`lastRun`) never persists
- **Added:** 2026-07-29
- **Status:** open

<details>
<summary>Description</summary>

`HomeAssistantUtils.isRulePassedCoolDown` checks `automation_rules.last_run`, but nothing writes `lastRun` after a rule is evaluated. Cooldown is effectively dead. Stamp `lastRun` before the LLM call and re-filter at flush time so concurrent events cannot double-fire.

</details>

### Device service-call cooldown suppresses all automations
- **Added:** 2026-07-29
- **Status:** open

<details>
<summary>Description</summary>

If `device.lastTriggeredService` is within `HOME_ASSISTANT_DEVICE_COOLDOWN_MINUTES`, *all* DEVICE rules for that device are skipped. That fights the point of automation rules (e.g. AI or user turns something on, then a follow-up state change cannot notify). Likely remove device-level suppression and keep only per-rule cooldown.

</details>

### Automation `deviceId` UUID vs slug mismatch
- **Added:** 2026-07-29
- **Status:** open

<details>
<summary>Description</summary>

Rule lookup uses device UUID (`getForDevice(matchingDevice.id)`), but the orchestration prompt tells the LLM that `rule.trigger.deviceId` should equal `device.slug`. Creation guidance also says to use list-devices for deviceId. Pick one canonical id and make store, tools, and prompts agree.

</details>

### TIME and SYSTEM automation triggers are unwired
- **Added:** 2026-07-29
- **Status:** open

<details>
<summary>Description</summary>

Schemas and CRUD tools allow `TIME` (cron) and `SYSTEM` (eventName) triggers, but only HA `state_changed` → DEVICE rules actually fire. Either implement schedulers/emitters or stop advertising those trigger types until they work.

</details>

### Notification queue cron comment is wrong
- **Added:** 2026-07-29
- **Status:** open

<details>
<summary>Description</summary>

`notification-queue.processor.ts` comment says it runs every minute; code uses `CronExpression.EVERY_10_MINUTES`. Fix the comment when changing the schedule, and decide the real desired interval as part of notification latency work.

</details>

### ActionType is advisory only
- **Added:** 2026-07-29
- **Status:** open

<details>
<summary>Description</summary>

Automation actions have `ActionType` (`NOTIFICATION`, `TASK`, `HA_SERVICE`, `SCRIPT`) but execution is whatever tools the Automation user can call via the LLM. Decide whether ActionType should map to real executors or remain natural-language guidance.

</details>

---

## Done

<!--
### Example completed item
- **Added:** YYYY-MM-DD
- **Status:** done (YYYY-MM-DD)

<details>
<summary>Description</summary>

What it was and how it was resolved.

</details>
-->
