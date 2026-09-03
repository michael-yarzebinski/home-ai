import { Role } from '@home-ai/shared/domain/role/role';
import type { User } from '@home-ai/shared/domain/user/user';
import type { Device } from '@home-ai/shared/domain/device/device';
import type { Fact } from '@home-ai/shared/domain/fact/fact';
import type { Recipe } from '@home-ai/shared/domain/recipe/recipe';
import type { Calendar } from '@home-ai/shared/domain/calendar/calendar';
import type { Tool } from '@home-ai/shared/domain/tool/tool';
import type { Note } from '@home-ai/shared/domain/note/note';
import type { AIAudit } from '@home-ai/shared/domain/ai-audit/ai-audit';
import type { Audit } from '@home-ai/shared/domain/audit/audit';
import type { Log } from '@home-ai/shared/domain/log/log';
import type { NotificationLog } from '@home-ai/shared/domain/notification-log/notification-log';
import type { NotificationQueue } from '@home-ai/shared/domain/notification-queue/notification-queue';
import type { AppConfig } from '@home-ai/shared/domain/app-config/app-config';
import { type AutomationRule, ActionType, TriggerType } from '@home-ai/shared/domain/automation-rule/automation-rule';

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
const minsAgo = (n: number) => new Date(now.getTime() - n * 60_000);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const MOCK_USERS: User[] = [
  { id: 'usr_001', role: Role.ADMIN, name: 'Home Admin', phoneNumber: '+15555550100', accessCodeHash: '$2b$10$hash1', timezone: 'America/Chicago', quietHoursStart: '22:00', quietHoursEnd: '07:00', active: true, createdAt: daysAgo(180), updatedAt: daysAgo(5) },
  { id: 'usr_002', role: Role.PARENT, name: 'Jane Smith', phoneNumber: '+15555550101', accessCodeHash: '$2b$10$hash2', timezone: 'America/Chicago', quietHoursStart: '23:00', quietHoursEnd: '07:00', active: true, createdAt: daysAgo(120), updatedAt: daysAgo(10) },
  { id: 'usr_003', role: Role.PARENT, name: 'John Smith', phoneNumber: '+15555550102', accessCodeHash: '$2b$10$hash3', timezone: 'America/Chicago', active: true, createdAt: daysAgo(120), updatedAt: daysAgo(15) },
  { id: 'usr_004', role: Role.CHILD, name: 'Emma Smith', accessCodeHash: '$2b$10$hash4', timezone: 'America/Chicago', active: true, createdAt: daysAgo(90), updatedAt: daysAgo(3) },
  { id: 'usr_005', role: Role.CHILD, name: 'Liam Smith', accessCodeHash: '$2b$10$hash5', timezone: 'America/Chicago', active: true, createdAt: daysAgo(90), updatedAt: daysAgo(7) },
  { id: 'usr_006', role: Role.GUEST, name: 'Guest User', accessCodeHash: '$2b$10$hash6', timezone: 'America/New_York', active: false, createdAt: daysAgo(30), updatedAt: daysAgo(30) },
];

// ---------------------------------------------------------------------------
// Devices
// ---------------------------------------------------------------------------

export const MOCK_DEVICES: Device[] = [
  { id: 'dev_001', slug: 'light.living_room', friendlyName: 'Living Room Light', aliases: ['living room', 'main light'], room: 'Living Room', category: 'lights', readRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], writeRoles: [Role.ADMIN, Role.PARENT], extraMetadata: {}, isTimeSensitive: false, llmModelType: 'soon', active: true, createdAt: daysAgo(150), updatedAt: daysAgo(1) },
  { id: 'dev_002', slug: 'light.kitchen', friendlyName: 'Kitchen Light', aliases: ['kitchen'], room: 'Kitchen', category: 'lights', readRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], writeRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], extraMetadata: {}, isTimeSensitive: false, llmModelType: 'soon', active: true, createdAt: daysAgo(150), updatedAt: daysAgo(2) },
  { id: 'dev_003', slug: 'climate.bedroom_thermo', friendlyName: 'Bedroom Thermostat', aliases: ['bedroom temp', 'thermostat'], room: 'Bedroom', category: 'climate', readRoles: [Role.ADMIN, Role.PARENT], writeRoles: [Role.ADMIN, Role.PARENT], extraMetadata: { minTemp: 60, maxTemp: 85 }, isTimeSensitive: true, llmModelType: 'immediate', active: true, createdAt: daysAgo(140), updatedAt: daysAgo(0) },
  { id: 'dev_004', slug: 'lock.front_door', friendlyName: 'Front Door Lock', aliases: ['front door', 'main door'], room: 'Entryway', category: 'security', readRoles: [Role.ADMIN, Role.PARENT], writeRoles: [Role.ADMIN], extraMetadata: {}, isTimeSensitive: true, llmModelType: 'immediate', active: true, createdAt: daysAgo(130), updatedAt: daysAgo(1) },
  { id: 'dev_005', slug: 'cover.garage_door', friendlyName: 'Garage Door', aliases: ['garage'], room: 'Garage', category: 'garage', readRoles: [Role.ADMIN, Role.PARENT], writeRoles: [Role.ADMIN, Role.PARENT], extraMetadata: {}, isTimeSensitive: true, llmModelType: 'immediate', active: true, createdAt: daysAgo(130), updatedAt: daysAgo(3) },
  { id: 'dev_006', slug: 'media_player.tv', friendlyName: 'Living Room TV', aliases: ['tv', 'television'], room: 'Living Room', category: 'media', readRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], writeRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], extraMetadata: {}, isTimeSensitive: false, llmModelType: 'soon', active: true, createdAt: daysAgo(120), updatedAt: daysAgo(0) },
  { id: 'dev_007', slug: 'appliance.dishwasher', friendlyName: 'Dishwasher', aliases: ['dishes'], room: 'Kitchen', category: 'appliance', readRoles: [Role.ADMIN, Role.PARENT], writeRoles: [Role.ADMIN, Role.PARENT], extraMetadata: {}, isTimeSensitive: false, llmModelType: 'soon', active: true, createdAt: daysAgo(100), updatedAt: daysAgo(5) },
  { id: 'dev_008', slug: 'appliance.washer', friendlyName: 'Washing Machine', aliases: ['washer', 'laundry'], room: 'Laundry Room', category: 'appliance', readRoles: [Role.ADMIN, Role.PARENT], writeRoles: [Role.ADMIN, Role.PARENT], extraMetadata: {}, isTimeSensitive: false, llmModelType: 'soon', active: false, createdAt: daysAgo(90), updatedAt: daysAgo(20) },
];

// ---------------------------------------------------------------------------
// Calendars
// ---------------------------------------------------------------------------

export const MOCK_CALENDARS: Calendar[] = [
  { id: 'cal_001', name: 'family', friendlyName: 'Family Calendar', aliases: ['family', 'home'], readRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], writeRoles: [Role.ADMIN, Role.PARENT], color: '#3b9eff', active: true, createdAt: daysAgo(180), updatedAt: daysAgo(1) },
  { id: 'cal_002', name: 'school', friendlyName: 'School Calendar', aliases: ['school', 'kids'], readRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], writeRoles: [Role.ADMIN, Role.PARENT], color: '#22c55e', active: true, createdAt: daysAgo(90), updatedAt: daysAgo(7) },
  { id: 'cal_003', name: 'work', friendlyName: 'Work Calendar', aliases: ['work', 'office'], readRoles: [Role.ADMIN, Role.PARENT], writeRoles: [Role.ADMIN, Role.PARENT], color: '#f59e0b', active: true, createdAt: daysAgo(60), updatedAt: daysAgo(2) },
  { id: 'cal_004', name: 'health', friendlyName: 'Health & Appointments', aliases: ['appointments', 'doctor'], readRoles: [Role.ADMIN, Role.PARENT], writeRoles: [Role.ADMIN], color: '#ef4444', active: false, createdAt: daysAgo(30), updatedAt: daysAgo(25) },
];

// ---------------------------------------------------------------------------
// Facts
// ---------------------------------------------------------------------------

export const MOCK_FACTS: Fact[] = [
  { id: 'fct_001', key: 'family.allergy.emma', value: 'Emma is allergic to peanuts and tree nuts. Always check ingredient labels.', tags: ['allergy', 'health', 'emma'], readRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], writeRoles: [Role.ADMIN, Role.PARENT], active: true, createdAt: daysAgo(90), updatedAt: daysAgo(10) },
  { id: 'fct_002', key: 'family.preference.pizza', value: 'Favorite pizza: pepperoni for adults, cheese-only for kids. Order from Marios.', tags: ['food', 'preferences'], readRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], writeRoles: [Role.ADMIN, Role.PARENT], active: true, createdAt: daysAgo(60), updatedAt: daysAgo(5) },
  { id: 'fct_003', key: 'home.wifi.guest', value: 'Guest WiFi: HomeGuest / password: WelcomeHome2025', tags: ['wifi', 'network'], readRoles: [Role.ADMIN, Role.PARENT], writeRoles: [Role.ADMIN], active: true, createdAt: daysAgo(180), updatedAt: daysAgo(30) },
  { id: 'fct_004', key: 'school.pickup.time', value: 'School pickup is at 3:15 PM Mon-Fri. Emma and Liam attend Riverside Elementary.', tags: ['school', 'schedule'], readRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], writeRoles: [Role.ADMIN, Role.PARENT], active: true, createdAt: daysAgo(45), updatedAt: daysAgo(2) },
  { id: 'fct_005', key: 'home.garage.code', value: 'Garage keypad code: 4821. Reset annually in January.', tags: ['security', 'garage'], readRoles: [Role.ADMIN, Role.PARENT], writeRoles: [Role.ADMIN], active: true, createdAt: daysAgo(120), updatedAt: daysAgo(60) },
  { id: 'fct_006', key: 'pet.info.max', value: 'Dog: Max (Golden Retriever, 4 yrs). Vet: Dr. Patel, 555-0199. Feed twice daily, 2 cups.', tags: ['pet', 'health'], readRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], writeRoles: [Role.ADMIN, Role.PARENT], active: false, createdAt: daysAgo(200), updatedAt: daysAgo(100) },
];

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export const MOCK_NOTES: Note[] = [
  { id: 'nte_001', name: 'grocery_list', friendlyName: 'Grocery List', aliases: ['groceries', 'shopping'], readRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], writeRoles: [Role.ADMIN, Role.PARENT], active: true, createdAt: daysAgo(30), updatedAt: daysAgo(1) },
  { id: 'nte_002', name: 'emergency_contacts', friendlyName: 'Emergency Contacts', aliases: ['emergency', 'contacts'], readRoles: [Role.ADMIN, Role.PARENT], writeRoles: [Role.ADMIN], active: true, createdAt: daysAgo(180), updatedAt: daysAgo(30) },
  { id: 'nte_003', name: 'home_rules', friendlyName: 'House Rules', aliases: ['rules', 'chores'], readRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], writeRoles: [Role.ADMIN, Role.PARENT], active: true, createdAt: daysAgo(90), updatedAt: daysAgo(14) },
  { id: 'nte_004', name: 'vacation_plans', friendlyName: 'Vacation Plans 2026', aliases: ['vacation', 'travel'], readRoles: [Role.ADMIN, Role.PARENT], writeRoles: [Role.ADMIN, Role.PARENT], active: false, createdAt: daysAgo(60), updatedAt: daysAgo(40) },
];

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------

export const MOCK_RECIPES: Recipe[] = [
  { id: 'rec_001', readableId: 1, title: 'Classic Spaghetti Bolognese', url: 'https://example.com/bolognese', servings: 4, prepTimeMinutes: 15, cookTimeMinutes: 45, active: true, createdAt: daysAgo(90), updatedAt: daysAgo(5) },
  { id: 'rec_002', readableId: 2, title: 'Caesar Salad', servings: 2, prepTimeMinutes: 10, cookTimeMinutes: 0, active: true, createdAt: daysAgo(60), updatedAt: daysAgo(10) },
  { id: 'rec_003', readableId: 3, title: 'Berry Smoothie', url: 'https://example.com/smoothie', servings: 1, prepTimeMinutes: 5, cookTimeMinutes: 0, active: true, createdAt: daysAgo(45), updatedAt: daysAgo(3) },
  { id: 'rec_004', readableId: 4, title: 'Chicken Stir Fry', servings: 3, prepTimeMinutes: 20, cookTimeMinutes: 15, active: true, createdAt: daysAgo(30), updatedAt: daysAgo(1) },
  { id: 'rec_005', readableId: 5, title: 'Overnight Oats', servings: 1, prepTimeMinutes: 10, cookTimeMinutes: 0, active: false, createdAt: daysAgo(20), updatedAt: daysAgo(18) },
];

// ---------------------------------------------------------------------------
// Tools (AI tools — edit-only, no create)
// ---------------------------------------------------------------------------

export const MOCK_TOOLS: Tool[] = [
  { id: 'tool_001', name: 'light_control', friendlyName: 'Light Control', hints: 'Controls smart lights. Specify room and state (on/off/dim).', requestRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], writeRoles: [Role.ADMIN, Role.PARENT], notifyRoles: [Role.ADMIN], active: true, createdAt: daysAgo(180), updatedAt: daysAgo(2) },
  { id: 'tool_002', name: 'thermostat_adj', friendlyName: 'Thermostat Adjust', hints: 'Adjusts home thermostat. Must specify target temperature (°F).', requestRoles: [Role.ADMIN, Role.PARENT], writeRoles: [Role.ADMIN, Role.PARENT], notifyRoles: [Role.ADMIN], active: true, createdAt: daysAgo(180), updatedAt: daysAgo(5) },
  { id: 'tool_003', name: 'calendar_query', friendlyName: 'Calendar Query', requestRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], writeRoles: [Role.ADMIN, Role.PARENT], notifyRoles: [], active: true, createdAt: daysAgo(160), updatedAt: daysAgo(10) },
  { id: 'tool_004', name: 'calendar_add_event', friendlyName: 'Add Calendar Event', hints: 'Adds events to a specified calendar. Requires parent approval for children.', requestRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], writeRoles: [Role.ADMIN, Role.PARENT], notifyRoles: [Role.ADMIN, Role.PARENT], active: true, createdAt: daysAgo(160), updatedAt: daysAgo(1) },
  { id: 'tool_005', name: 'recipe_search', friendlyName: 'Recipe Search', requestRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], writeRoles: [Role.ADMIN], notifyRoles: [], active: true, createdAt: daysAgo(120), updatedAt: daysAgo(14) },
  { id: 'tool_006', name: 'send_notification', friendlyName: 'Send Notification', hints: 'Sends SMS/push notification to a user. Requires write access.', requestRoles: [Role.ADMIN, Role.PARENT], writeRoles: [Role.ADMIN], notifyRoles: [Role.ADMIN], active: true, createdAt: daysAgo(100), updatedAt: daysAgo(3) },
  { id: 'tool_007', name: 'media_play', friendlyName: 'Media Playback', requestRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], writeRoles: [Role.ADMIN, Role.PARENT, Role.CHILD], notifyRoles: [], active: false, createdAt: daysAgo(80), updatedAt: daysAgo(30) },
];

// ---------------------------------------------------------------------------
// App Config (edit-only)
// ---------------------------------------------------------------------------

export const MOCK_APP_CONFIGS: AppConfig[] = [
  { id: 'cfg_001', key: 'ai.model', value: 'claude-opus-4-7', description: 'Active LLM model identifier', active: true, createdAt: daysAgo(180), updatedAt: daysAgo(1) },
  { id: 'cfg_002', key: 'ai.max_tokens', value: 4096, description: 'Maximum tokens per AI response', active: true, createdAt: daysAgo(180), updatedAt: daysAgo(7) },
  { id: 'cfg_003', key: 'notifications.provider', value: 'bluebubbles', description: 'Active notification delivery provider', active: true, createdAt: daysAgo(120), updatedAt: daysAgo(5) },
  { id: 'cfg_004', key: 'system.debug_mode', value: false, description: 'Enables verbose logging across all services', active: true, createdAt: daysAgo(180), updatedAt: daysAgo(30) },
  { id: 'cfg_005', key: 'system.timezone', value: 'America/Chicago', description: 'Default system timezone for scheduling', active: true, createdAt: daysAgo(180), updatedAt: daysAgo(60) },
];

// ---------------------------------------------------------------------------
// Monitoring: AI Audit
// ---------------------------------------------------------------------------

export const MOCK_AI_AUDITS: AIAudit[] = [
  { id: 'ai_001', userId: 'usr_002', chatSessionId: 'sess_001', userMessage: 'Turn off the living room lights', toolCalls: [{ tool: 'light_control', args: { room: 'living_room', state: 'off' } }], finalResponse: 'Done! Living room lights are off.', durationMs: 420, success: true, createdAt: minsAgo(5) },
  { id: 'ai_002', userId: 'usr_003', chatSessionId: 'sess_002', userMessage: 'What\'s on the calendar today?', toolCalls: [{ tool: 'calendar_query', args: { date: 'today' } }], finalResponse: 'You have soccer practice at 4 PM and dinner at 7 PM.', durationMs: 680, success: true, createdAt: minsAgo(12) },
  { id: 'ai_003', userId: 'usr_004', userMessage: 'Add soccer practice to the calendar', toolCalls: undefined, finalResponse: undefined, durationMs: 310, success: false, createdAt: minsAgo(30) },
  { id: 'ai_004', userId: 'usr_002', chatSessionId: 'sess_003', userMessage: 'Set the thermostat to 72 degrees', toolCalls: [{ tool: 'thermostat_adj', args: { temp: 72 } }], finalResponse: 'Thermostat set to 72°F.', durationMs: 890, success: true, createdAt: minsAgo(45) },
  { id: 'ai_005', userId: 'usr_001', chatSessionId: 'sess_004', userMessage: 'Find a pasta recipe for tonight', toolCalls: [{ tool: 'recipe_search', args: { query: 'pasta' } }], finalResponse: 'Found: Classic Spaghetti Bolognese — 45 min cook time, serves 4.', durationMs: 560, success: true, createdAt: minsAgo(60) },
  { id: 'ai_006', userId: 'usr_005', userMessage: 'Can I watch TV?', toolCalls: null, finalResponse: 'Homework first — you can watch TV after 6 PM.', durationMs: 240, success: true, createdAt: minsAgo(90) },
  { id: 'ai_007', userId: 'usr_003', chatSessionId: 'sess_005', userMessage: 'Lock the front door', toolCalls: [{ tool: 'lock.front_door', args: { action: 'lock' } }], finalResponse: 'Front door locked.', durationMs: 1200, success: true, createdAt: minsAgo(120) },
  { id: 'ai_008', userId: 'usr_001', chatSessionId: 'sess_006', userMessage: 'Send a reminder to Jane about school pickup', toolCalls: [{ tool: 'send_notification', args: { userId: 'usr_002', message: 'School pickup at 3:15 PM' } }], finalResponse: 'Reminder sent to Jane.', durationMs: 740, success: true, createdAt: minsAgo(180) },
];

// ---------------------------------------------------------------------------
// Monitoring: Audit
// ---------------------------------------------------------------------------

export const MOCK_AUDITS: Audit[] = [
  { id: 'aud_001', entityType: 'Device', entityId: 'dev_003', action: 'UPDATE', userId: 'usr_001', changes: { isTimeSensitive: [false, true] }, notes: 'Marked thermostat as time-sensitive', createdAt: minsAgo(15) },
  { id: 'aud_002', entityType: 'User', entityId: 'usr_006', action: 'DEACTIVATE', userId: 'usr_001', changes: { active: [true, false] }, createdAt: minsAgo(30) },
  { id: 'aud_003', entityType: 'Fact', entityId: 'fct_001', action: 'UPDATE', userId: 'usr_002', changes: { value: ['...', '...'] }, notes: 'Updated Emma allergy info', createdAt: minsAgo(60) },
  { id: 'aud_004', entityType: 'Tool', entityId: 'tool_007', action: 'DEACTIVATE', userId: 'usr_001', changes: { active: [true, false] }, createdAt: daysAgo(1) },
  { id: 'aud_005', entityType: 'Recipe', entityId: 'rec_001', action: 'CREATE', userId: 'usr_001', changes: {}, createdAt: daysAgo(5) },
  { id: 'aud_006', entityType: 'Calendar', entityId: 'cal_001', action: 'UPDATE', userId: 'usr_001', changes: { color: ['#4488ff', '#3b9eff'] }, createdAt: daysAgo(7) },
];

// ---------------------------------------------------------------------------
// Monitoring: System Logs
// ---------------------------------------------------------------------------

export const MOCK_LOGS: Log[] = [
  { id: 'log_001', severity: 'ERROR', message: 'Living Room TV: Request timed out', metadata: { errorCode: 'ECONNRESET', domain: 'DEVICE' }, createdAt: minsAgo(2) },
  { id: 'log_002', severity: 'ERROR', message: 'Context window exceeded for query_id_291', metadata: { errorCode: 'MEM_LMT', domain: 'AI' }, createdAt: minsAgo(14) },
  { id: 'log_003', severity: 'CRITICAL', message: 'NLP Parser: Ambiguous command detected', metadata: { errorCode: 'NLP_AMB', domain: 'SYSTEM' }, createdAt: minsAgo(60) },
  { id: 'log_004', severity: 'INFO', message: 'Scheduled task completed: daily_summary', metadata: {}, createdAt: minsAgo(90) },
  { id: 'log_005', severity: 'WARN', message: 'AI response latency exceeded 1000ms threshold', metadata: { latencyMs: 1240 }, createdAt: minsAgo(120) },
  { id: 'log_006', severity: 'INFO', message: 'User usr_002 authenticated successfully', metadata: {}, createdAt: minsAgo(150) },
  { id: 'log_007', severity: 'ERROR', message: 'Thermostat schedule sync failed after 3 retries', metadata: { errorCode: 'SYNC_ERR' }, createdAt: minsAgo(180) },
  { id: 'log_008', severity: 'INFO', message: 'Notification queue flushed: 8 messages delivered', metadata: { delivered: 8 }, createdAt: minsAgo(240) },
];

// ---------------------------------------------------------------------------
// Monitoring: Notification Log
// ---------------------------------------------------------------------------

export const MOCK_NOTIFICATION_LOGS: NotificationLog[] = [
  { id: 'nl_001', userId: 'usr_002', message: 'School pickup reminder: 3:15 PM today', createdAt: minsAgo(30) },
  { id: 'nl_002', userId: 'usr_003', message: 'Dinner reservation confirmed for 7 PM', createdAt: minsAgo(60) },
  { id: 'nl_003', userId: 'usr_004', message: 'Your request to add "Soccer practice" requires approval', createdAt: minsAgo(90) },
  { id: 'nl_004', userId: 'usr_002', message: 'Front door was unlocked remotely by John', createdAt: minsAgo(180) },
  { id: 'nl_005', userId: 'usr_001', message: 'System health report: 94% uptime in the last 24h', createdAt: minsAgo(360) },
];

// ---------------------------------------------------------------------------
// Monitoring: Notification Queue
// ---------------------------------------------------------------------------

export const MOCK_NOTIFICATION_QUEUE: NotificationQueue[] = [
  { id: 'nq_001', userId: 'usr_002', message: 'Soccer practice reminder: tomorrow at 4 PM', importance: 'normal', scheduledFor: new Date(now.getTime() + 3600_000), active: true, createdAt: minsAgo(5), updatedAt: minsAgo(5) },
  { id: 'nq_002', userId: 'usr_003', message: 'Weekly meal plan suggestions ready', importance: 'low', scheduledFor: new Date(now.getTime() + 7200_000), active: true, createdAt: minsAgo(10), updatedAt: minsAgo(10) },
  { id: 'nq_003', userId: 'usr_001', message: 'System backup completed successfully', importance: 'high', scheduledFor: new Date(now.getTime() + 900_000), active: true, createdAt: minsAgo(2), updatedAt: minsAgo(2) },
  { id: 'nq_004', userId: 'usr_004', message: 'Bedtime reminder: lights out in 15 minutes', importance: 'normal', scheduledFor: new Date(now.getTime() - 600_000), active: false, createdAt: minsAgo(60), updatedAt: minsAgo(15) },
];

// ---------------------------------------------------------------------------
// Automation Rules
// ---------------------------------------------------------------------------

export const MOCK_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'ar_001',
    userId: 'usr_001',
    name: 'bedtime_reminder',
    description: 'Send bedtime reminders to kids at 9 PM on school nights',
    trigger: { type: TriggerType.TIME, cron: '0 21 * * 0-4', timezone: 'America/Chicago' },
    actions: [
      {
        id: 'act_001',
        type: ActionType.NOTIFICATION,
        instruction: 'Send a bedtime reminder to Emma and Liam that lights out is in 30 minutes.',
        metadata: { userIds: ['usr_004', 'usr_005'] },
      },
    ],
    cooldownMinutes: 1440,
    lastRun: daysAgo(1),
    active: true,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(5),
  },
  {
    id: 'ar_002',
    userId: 'usr_001',
    name: 'garage_door_alert',
    description: 'Alert when garage door is left open after 10 PM',
    trigger: { type: TriggerType.DEVICE, deviceId: 'dev_005', intent: 'When garage door has been open for more than 15 minutes after 10 PM' },
    actions: [
      {
        id: 'act_002',
        type: ActionType.NOTIFICATION,
        instruction: 'Notify the admin that the garage door has been left open.',
        metadata: { userId: 'usr_001', priority: 'high' },
      },
      {
        id: 'act_003',
        type: ActionType.HA_SERVICE,
        instruction: 'Close the garage door via Home Assistant.',
      },
    ],
    cooldownMinutes: 60,
    lastRun: daysAgo(3),
    active: true,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(2),
  },
  {
    id: 'ar_003',
    userId: 'usr_001',
    name: 'morning_summary',
    description: 'Deliver a morning briefing with weather and calendar highlights',
    trigger: { type: TriggerType.TIME, cron: '0 7 * * 1-5', timezone: 'America/Chicago' },
    actions: [
      {
        id: 'act_004',
        type: ActionType.TASK,
        instruction: 'Generate and send a morning briefing with weather, calendar events, and reminders to all parents.',
      },
    ],
    cooldownMinutes: 720,
    lastRun: daysAgo(1),
    active: true,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(1),
  },
  {
    id: 'ar_004',
    userId: 'usr_002',
    name: 'school_pickup_reminder',
    description: 'Remind parents 30 minutes before school pickup on weekdays',
    trigger: { type: TriggerType.TIME, cron: '45 14 * * 1-5', timezone: 'America/Chicago' },
    actions: [
      {
        id: 'act_005',
        type: ActionType.NOTIFICATION,
        instruction: 'Send school pickup reminder to Jane.',
      },
    ],
    cooldownMinutes: 1440,
    lastRun: daysAgo(1),
    active: false,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(10),
  },
  {
    id: 'ar_005',
    userId: 'usr_001',
    name: 'startup_health_check',
    description: 'Run a system health check on every app startup',
    trigger: { type: TriggerType.SYSTEM, eventName: 'app.startup', intent: 'On every application startup' },
    actions: [
      {
        id: 'act_006',
        type: ActionType.SCRIPT,
        instruction: 'Check connectivity to all registered devices and report any unreachable ones to the admin.',
      },
    ],
    cooldownMinutes: 5,
    active: true,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(14),
  },
];
