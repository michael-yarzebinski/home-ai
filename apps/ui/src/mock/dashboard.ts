import type { Log } from '@home-ai/shared/domain/log/log';
import type { PendingAction } from '@home-ai/shared/domain/pending-action/pending-action';

// ---------------------------------------------------------------------------
// Trend chart data
// ---------------------------------------------------------------------------

export type TimePeriod = '1H' | '12H' | '24H' | '7D' | '30D';

export interface TrendPoint {
  label: string;
  ai: number;
  logs: number;
}

const p = (label: string, ai: number, logs: number): TrendPoint => ({ label, ai, logs });

export const TREND_DATA: Record<TimePeriod, TrendPoint[]> = {
  '1H': [
    p('0m', 8, 42), p('5m', 12, 55), p('10m', 7, 38), p('15m', 15, 68),
    p('20m', 11, 52), p('25m', 18, 75), p('30m', 14, 61), p('35m', 22, 88),
    p('40m', 16, 71), p('45m', 25, 94), p('50m', 19, 82), p('55m', 28, 105),
  ],
  '12H': [
    p('8h', 42, 188), p('9h', 68, 275), p('10h', 85, 342), p('11h', 92, 368),
    p('12h', 78, 312), p('13h', 95, 382), p('14h', 88, 352), p('15h', 76, 305),
    p('16h', 82, 328), p('17h', 65, 261), p('18h', 48, 192), p('19h', 35, 140),
  ],
  '24H': [
    p('0h', 4, 28),   p('1h', 3, 22),   p('2h', 2, 18),   p('3h', 2, 15),
    p('4h', 3, 20),   p('5h', 5, 35),   p('6h', 18, 88),  p('7h', 45, 165),
    p('8h', 62, 220), p('9h', 78, 285), p('10h', 85, 310), p('11h', 92, 342),
    p('12h', 88, 328), p('13h', 95, 356), p('14h', 87, 318), p('15h', 76, 276),
    p('16h', 68, 248), p('17h', 55, 195), p('18h', 42, 152), p('19h', 35, 128),
    p('20h', 22, 88), p('21h', 15, 65), p('22h', 9, 45),  p('23h', 6, 32),
  ],
  '7D': [
    p('Mon', 842, 3240), p('Tue', 1105, 4320), p('Wed', 978, 3850),
    p('Thu', 1284, 4680), p('Fri', 1156, 4320), p('Sat', 445, 1820),
    p('Sun', 328, 1340),
  ],
  '30D': [
    p('1', 654, 2540), p('2', 712, 2780), p('3', 688, 2680), p('4', 745, 2920),
    p('5', 821, 3180), p('6', 756, 2940), p('7', 445, 1820), p('8', 892, 3420),
    p('9', 945, 3680), p('10', 978, 3820), p('11', 1024, 3980), p('12', 1087, 4240),
    p('13', 1142, 4480), p('14', 892, 3480), p('15', 1198, 4680), p('16', 1156, 4520),
    p('17', 1087, 4280), p('18', 1024, 4020), p('19', 978, 3840), p('20', 1045, 4120),
    p('21', 892, 3480), p('22', 1112, 4360), p('23', 1178, 4620), p('24', 1245, 4880),
    p('25', 1284, 5020), p('26', 1156, 4560), p('27', 1024, 4020), p('28', 945, 3720),
    p('29', 1087, 4280), p('30', 1142, 4480),
  ],
};

// ---------------------------------------------------------------------------
// Summary statistics
// ---------------------------------------------------------------------------

export const TEMPORAL_STATS = {
  aiQueries: { value: 1284, trend: 12 },
  logsProcessed: { value: 42100, isLive: true },
};

// ---------------------------------------------------------------------------
// AI tool call audit breakdown
// ---------------------------------------------------------------------------

export interface ToolCallStat {
  name: string;
  count: number;
  /** percentage change; null = stable */
  trend: number | null;
}

export const TOOL_CALL_STATS: ToolCallStat[] = [
  { name: 'light_control()', count: 142, trend: 12 },
  { name: 'thermostat_adj()', count: 89, trend: -1 },
  { name: 'calendar_query()', count: 64, trend: 5 },
  { name: 'recipe_search()', count: 31, trend: null },
  { name: 'media_play()', count: 12, trend: 1 },
];

// ---------------------------------------------------------------------------
// Log severity breakdown (Log.severity counts across the selected period)
// ---------------------------------------------------------------------------

export const LOG_SEVERITY = {
  info: 1200,
  warn: 45,
  error: 12,
  critical: 2,
};

// ---------------------------------------------------------------------------
// Critical error feed (Log schema with typed metadata)
// ---------------------------------------------------------------------------

export type ErrorLogEntry = Omit<Log, 'metadata'> & {
  metadata: { errorCode: string; domain: string };
};

export const MOCK_ERROR_LOGS: ErrorLogEntry[] = [
  {
    id: 'log_001',
    severity: 'ERROR',
    message: 'Living Room TV: Request timed out',
    metadata: { errorCode: 'ECONNRESET', domain: 'DEVICE' },
    createdAt: new Date(Date.now() - 2 * 60_000),
  },
  {
    id: 'log_002',
    severity: 'ERROR',
    message: 'Context window exceeded for query_id_291',
    metadata: { errorCode: 'MEM_LMT', domain: 'AI' },
    createdAt: new Date(Date.now() - 14 * 60_000),
  },
  {
    id: 'log_003',
    severity: 'CRITICAL',
    message: 'NLP Parser: Ambiguous command detected',
    metadata: { errorCode: 'NLP_AMB', domain: 'SYSTEM' },
    createdAt: new Date(Date.now() - 60 * 60_000),
  },
  {
    id: 'log_004',
    severity: 'ERROR',
    message: 'Thermostat schedule sync failed after 3 retries',
    metadata: { errorCode: 'SYNC_ERR', domain: 'DEVICE' },
    createdAt: new Date(Date.now() - 2 * 60 * 60_000),
  },
  {
    id: 'log_005',
    severity: 'ERROR',
    message: 'Database connection pool exhausted',
    metadata: { errorCode: 'POOL_EXH', domain: 'SYSTEM' },
    createdAt: new Date(Date.now() - 3 * 60 * 60_000),
  },
  {
    id: 'log_006',
    severity: 'CRITICAL',
    message: 'AI model response timeout exceeded 30s threshold',
    metadata: { errorCode: 'AI_TIMEOUT', domain: 'AI' },
    createdAt: new Date(Date.now() - 5 * 60 * 60_000),
  },
];

// ---------------------------------------------------------------------------
// Notification queue (outbound delivery)
// ---------------------------------------------------------------------------

export const NOTIFICATION_QUEUE_STATS = {
  pending: 14,
  retry: 2,
  activeProvider: 'BlueBubbles',
  providerActive: true,
};

// ---------------------------------------------------------------------------
// Pending actions (PendingAction schema)
// ---------------------------------------------------------------------------

export const MOCK_PENDING_ACTIONS: PendingAction[] = [
  {
    id: 'pa_001',
    readableId: 1,
    toolId: 'calendar_add_event',
    requesterId: 'usr_child_001',
    proposedArgs: { title: 'Soccer practice', date: '2026-05-03' },
    status: 'pending',
    reason: 'Child requested calendar event',
    active: true,
    createdAt: new Date(Date.now() - 30 * 60_000),
    updatedAt: new Date(Date.now() - 30 * 60_000),
  },
  {
    id: 'pa_002',
    readableId: 2,
    toolId: 'device_control',
    requesterId: 'usr_child_001',
    proposedArgs: { entityId: 'light.living_room', action: 'turn_on' },
    status: 'pending',
    active: true,
    createdAt: new Date(Date.now() - 45 * 60_000),
    updatedAt: new Date(Date.now() - 45 * 60_000),
  },
  {
    id: 'pa_003',
    readableId: 3,
    toolId: 'send_notification',
    requesterId: 'usr_child_002',
    proposedArgs: { message: 'Can I have a snack?', recipients: ['parent'] },
    status: 'pending',
    active: true,
    createdAt: new Date(Date.now() - 60 * 60_000),
    updatedAt: new Date(Date.now() - 60 * 60_000),
  },
];
