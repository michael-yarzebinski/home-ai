# Home AI — Working Todo

Maintained by Cursor agents. Update this file when priorities change, items complete, or new work is discovered. Prefer editing in place over creating parallel lists.

Last updated: 2026-07-29

---

## Active focus: Automation latency vs event stacking

**Dilemma:** Notifications feel too slow, but removing delay risks floods and loses the ability to compile related HA entity changes into one evaluation.

**Current direction (not implemented — prior PR scraped):**
- Short per-device coalesce window (~30s) to stack events
- Per-rule `cooldownMinutes` + persisted `lastRun` as the anti-flood throttle
- Fast notification delivery (do not leave alerts sitting on a long cron)
- In-memory buffer first; Redis only if multi-instance / durability is needed later
- No device-level `lastTriggeredService` suppression of automations (that fights the point of rules)

**What exists on `main` today:**
- HA `state_changed` → match Device by slug-in-entity_id → load DEVICE rules
- Per-device event buffer waits `HOME_ASSISTANT_DEVICE_COOLDOWN_MINUTES` (default 5) before LLM
- Device service-call cooldown can suppress *all* rules for that device
- Rule `lastRun` is filtered but **never written** → rule cooldown is ineffective
- Automation path uses SOON (free/slower) model
- `send-notification` enqueues to Postgres `notification_queue`
- Notification cron is every **10 minutes** (comment incorrectly says every minute)
- No Redis in this repo for device events (buffer is in-memory `Map` + timer)

---

## Todo

### P0 — Make the intended controls work

- [ ] Persist `automation_rules.last_run` when a rule is evaluated (stamp before LLM call)
- [ ] Re-filter rules by `lastRun` / `cooldownMinutes` at flush time so concurrent events cannot double-fire
- [ ] Confirm existing rules have sensible `cooldownMinutes` (create tool defaults to 60)

### P1 — Coalesce without multi-minute lag

- [ ] Replace multi-minute HA debounce with a short per-device coalesce window (**target: 30 seconds**)
- [ ] On flush: one SOON orchestrator call with compiled transitions + eligible rules
- [ ] Keep buffer in-memory for single-process home-ai; document Redis as a later option only
- [ ] Stop using `HOME_ASSISTANT_DEVICE_COOLDOWN_MINUTES` as the event compile delay
- [ ] Remove or stop using device `lastTriggeredService` suppression for automation eligibility
- [ ] Update `.env.example` comments so cooldown knobs match real behavior

### P2 — Timely notification delivery

- [ ] Speed up notification drain (e.g. every 30s) **or** bypass the queue for automation alerts and send via BlueBubbles immediately
- [ ] Keep quiet-hours behavior for non-urgent / queued messages
- [ ] Fix misleading cron comment in `notification-queue.processor.ts`

### P3 — Correctness / friction already found

- [ ] Resolve `deviceId` mismatch: store lookup uses UUID; automation prompt tells LLM to match slug
- [ ] Decide fate of `TIME` / `SYSTEM` triggers (schema exists; nothing fires them)
- [ ] Decide whether `ActionType` should drive real executors or stay advisory NL for the LLM
- [ ] Consider whether `isTimeSensitive` on devices should affect coalesce / delivery priority

### P4 — Optional later architecture

- [ ] If running multiple server replicas: move per-device event buffer to Redis (or similar) with TTL = coalesce window
- [ ] Per-rule or per-user digest mode (“stack 3 fridge events → one message”) beyond single coalesce flush
- [ ] Metrics/logging: event → flush → LLM → notify enqueue → send (latency breakdown)

---

## Decisions log

| Date | Decision |
|------|----------|
| 2026-07-29 | Scrapbed latency PR (`#1` closed). Capture work here instead of merging speculative code. |
| 2026-07-29 | Prefer ~30s event compile over 5-minute device cooldown. |
| 2026-07-29 | Rule `lastRun` cooldown = anti-flood; coalesce window = event stacking. Separate knobs. |
| 2026-07-29 | No Redis required for device events in current single-process setup. |

---

## Agent maintenance notes

When working this area:
1. Check boxes / move items as status changes.
2. Add newly discovered issues under the right priority.
3. Append notable decisions to the decisions log.
4. Do not re-open large speculative refactors without updating this file first.
