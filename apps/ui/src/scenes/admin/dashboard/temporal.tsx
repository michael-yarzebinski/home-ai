import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  BarChart2,
  Brain,
  Clock,
  LineChart as LineChartIcon,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { DashboardPeriod, DashboardResult, TimeBucket } from '@home-ai/shared/domain/admin/dashboard/dashboard';

// ---------------------------------------------------------------------------
// Chart colour palette
// ---------------------------------------------------------------------------
const C = {
  primary: '#3b9eff',
  cyan: '#06b6d4',
  green: '#22c55e',
  red: '#ef4444',
  amber: '#f59e0b',
  grid: 'rgba(255,255,255,0.06)',
  axis: '#64748b',
};

type ChartType = 'bar' | 'line';
type DataSource = 'ai' | 'logs';

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TemporalIntelligenceProps {
  period: DashboardPeriod;
  onPeriodChange: (p: DashboardPeriod) => void;
  data: DashboardResult['temporal'] | null;
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBucketLabel(timestamp: string, period: DashboardPeriod): string {
  const d = new Date(timestamp);
  if (period === '1h') return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (period === '24h') return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (period === '7d') return d.toLocaleDateString('en-US', { weekday: 'short' });
  if (period === '30d') return String(d.getDate());
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function bucketsToChartData(buckets: TimeBucket[], period: DashboardPeriod) {
  return buckets.map((b) => ({
    label: formatBucketLabel(b.timestamp, period),
    ai: b.aiAudit,
    logs: b.logs,
  }));
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export function TemporalIntelligence({
  period,
  onPeriodChange,
  data,
  loading,
}: TemporalIntelligenceProps) {
  const aiTotal = data?.buckets.reduce((s, b) => s + b.aiAudit, 0) ?? 0;
  const logsTotal = data?.logsBySeverity.total ?? 0;

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 flex-shrink-0">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground leading-tight">Temporal Intelligence</h2>
            <p className="text-xs text-muted-foreground mt-0.5">System-wide metrics and AI-audit telemetry</p>
          </div>
        </div>
        <TimeFilter period={period} onChange={onPeriodChange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          <StatCard
            label="AI QUERIES"
            value={aiTotal.toLocaleString()}
            icon={<Brain size={14} />}
            loading={loading}
          />
          <StatCard
            label="LOGS PROCESSED"
            value={fmtCompact(logsTotal)}
            badge="Live"
            icon={<Activity size={14} />}
            loading={loading}
          />
          <AuditBreakdown data={data} loading={loading} />
        </div>

        {/* Middle: trend chart */}
        <div className="md:col-span-2">
          <TrendChart data={data} period={period} loading={loading} />
        </div>

        {/* Right: health gauge */}
        <div>
          <HealthGauge data={data} loading={loading} />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Time filter
// ---------------------------------------------------------------------------

function TimeFilter({
  period,
  onChange,
}: {
  period: DashboardPeriod;
  onChange: (p: DashboardPeriod) => void;
}) {
  return (
    <div className="flex rounded-md border border-border overflow-hidden flex-shrink-0">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={cn(
            'px-3 py-1.5 text-[11px] font-medium transition-colors',
            p.value === period
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent',
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat cards
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  trend,
  badge,
  icon,
  loading,
}: {
  label: string;
  value: string;
  trend?: number;
  badge?: string;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          {label}
        </span>
        <span className="text-muted-foreground/50">{icon}</span>
      </div>
      <div className="flex items-baseline gap-2">
        {loading ? (
          <span className="h-7 w-16 rounded bg-border/60 animate-pulse inline-block" />
        ) : (
          <>
            <span className="text-2xl font-bold text-foreground tabular-nums">{value}</span>
            {trend !== undefined && (
              <span className={cn('flex items-center gap-0.5 text-xs font-medium', trend > 0 ? 'text-green-500' : 'text-red-500')}>
                {trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
            {badge && (
              <span className="text-[10px] font-semibold text-green-500 uppercase tracking-wide">{badge}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audit breakdown (replaces tool call list)
// ---------------------------------------------------------------------------

function AuditBreakdown({
  data,
  loading,
}: {
  data: DashboardResult['temporal'] | null;
  loading: boolean;
}) {
  const rows = data ? [
    { name: 'AI queries', count: data.buckets.reduce((s, b) => s + b.aiAudit, 0) },
    { name: 'System audit', count: data.buckets.reduce((s, b) => s + b.audit, 0) },
    { name: 'Notification logs', count: data.buckets.reduce((s, b) => s + b.notificationLog, 0) },
  ] : [];

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex-1">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Audit Breakdown
        </span>
      </div>
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 rounded bg-border/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.name} className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground truncate">{row.name}</span>
              <span className="text-xs font-semibold text-foreground tabular-nums">{row.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trend chart
// ---------------------------------------------------------------------------

function TrendChart({
  data,
  period,
  loading,
}: {
  data: DashboardResult['temporal'] | null;
  period: DashboardPeriod;
  loading: boolean;
}) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [source, setSource] = useState<DataSource>('ai');

  const chartData = data ? bucketsToChartData(data.buckets, period) : [];
  const dataKey = source === 'ai' ? 'ai' : 'logs';
  const color = source === 'ai' ? C.primary : C.cyan;
  const label = source === 'ai' ? 'AI Queries' : 'Logs';

  const axisProps = {
    tick: { fill: C.axis, fontSize: 10 },
    axisLine: false as const,
    tickLine: false as const,
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Trend Analysis
        </span>
        <div className="flex items-center gap-2">
          <div className="flex rounded border border-border overflow-hidden">
            {(['ai', 'logs'] as DataSource[]).map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={cn(
                  'px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors',
                  s === source ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {s === 'ai' ? 'AI' : 'Logs'}
              </button>
            ))}
          </div>
          <div className="flex rounded border border-border overflow-hidden">
            <button
              onClick={() => setChartType('bar')}
              className={cn(
                'p-1.5 transition-colors',
                chartType === 'bar' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <BarChart2 size={12} />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={cn(
                'p-1.5 transition-colors',
                chartType === 'line' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LineChartIcon size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[160px]">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full h-32 rounded bg-border/40 animate-pulse" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground/50">
            No data for selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} barCategoryGap="35%">
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} width={32} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey={dataKey} name={label} fill={color} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} width={32} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  dataKey={dataKey}
                  name={label}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: color }}
                  isAnimationActive={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Health / severity gauge
// ---------------------------------------------------------------------------

function HealthGauge({
  data,
  loading,
}: {
  data: DashboardResult['temporal'] | null;
  loading: boolean;
}) {
  const sev = data?.logsBySeverity ?? { info: 0, warn: 0, error: 0, total: 0 };
  const total = sev.total || 1;
  const pct = (n: number) => ((n / total) * 100).toFixed(1);

  const segments = [
    { name: 'INFO', count: sev.info, fill: C.primary },
    { name: 'WARN', count: sev.warn, fill: C.amber },
    { name: 'ERROR', count: sev.error, fill: C.red },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4 h-full flex flex-col">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-4 block">
        Log Severity
      </span>

      {loading ? (
        <div className="flex flex-col items-center gap-4 flex-1">
          <div className="w-[156px] h-[156px] rounded-full bg-border/40 animate-pulse" />
          <div className="flex flex-col gap-2.5 w-full">
            {[1, 2, 3].map((i) => <div key={i} className="h-4 rounded bg-border/40 animate-pulse" />)}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 flex-1">
          <div className="relative w-[156px] h-[156px] flex-shrink-0">
            <PieChart width={156} height={156}>
              <Pie
                data={segments.map((s) => ({ name: s.name, value: s.count || 1 }))}
                cx={78}
                cy={78}
                innerRadius={50}
                outerRadius={70}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                paddingAngle={3}
                strokeWidth={0}
                isAnimationActive={false}
              >
                {segments.map((s, i) => (
                  <Cell key={i} fill={s.fill} />
                ))}
              </Pie>
            </PieChart>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-foreground leading-none tabular-nums">
                {fmtCompact(sev.total)}
              </span>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wide mt-0.5">
                total logs
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 w-full">
            {segments.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: s.fill }} />
                <span className="text-[11px] text-muted-foreground flex-1">{s.name}</span>
                <span className="text-[10px] text-muted-foreground/50 tabular-nums w-10 text-right">
                  {pct(s.count)}%
                </span>
                <span className="text-xs font-semibold tabular-nums w-12 text-right" style={{ color: s.fill }}>
                  {s.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
