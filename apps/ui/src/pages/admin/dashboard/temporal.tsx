import { useState } from 'react';
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
import { cn } from '@/lib/utils';
import {
  LOG_SEVERITY,
  TEMPORAL_STATS,
  TOOL_CALL_STATS,
  TREND_DATA,
  type TimePeriod,
} from '@/mock/dashboard';

// ---------------------------------------------------------------------------
// Chart colour palette (CSS vars don't work inside SVG fill attrs)
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
const TIME_PERIODS: TimePeriod[] = ['1H', '12H', '24H', '7D', '30D'];

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export function TemporalIntelligence() {
  const [period, setPeriod] = useState<TimePeriod>('24H');

  return (
    <section>
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 flex-shrink-0">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground leading-tight">
              Temporal Intelligence
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              System-wide metrics and AI-audit telemetry
            </p>
          </div>
        </div>
        <TimeFilter period={period} onChange={setPeriod} />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          <StatCard
            label="AI QUERIES"
            value={TEMPORAL_STATS.aiQueries.value.toLocaleString()}
            trend={TEMPORAL_STATS.aiQueries.trend}
            icon={<Brain size={14} />}
          />
          <StatCard
            label="LOGS PROCESSED"
            value={fmtCompact(TEMPORAL_STATS.logsProcessed.value)}
            badge="Live"
            icon={<Activity size={14} />}
          />
          <ToolAuditList />
        </div>

        {/* Middle: trend chart */}
        <div className="md:col-span-2">
          <TrendChart period={period} />
        </div>

        {/* Right: health gauge */}
        <div>
          <HealthGauge />
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
  period: TimePeriod;
  onChange: (p: TimePeriod) => void;
}) {
  return (
    <div className="flex rounded-md border border-border overflow-hidden flex-shrink-0">
      {TIME_PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            'px-3 py-1.5 text-[11px] font-medium transition-colors',
            p === period
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent',
          )}
        >
          {p}
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
}: {
  label: string;
  value: string;
  trend?: number;
  badge?: string;
  icon: React.ReactNode;
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
        <span className="text-2xl font-bold text-foreground tabular-nums">{value}</span>
        {trend !== undefined && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              trend > 0 ? 'text-green-500' : 'text-red-500',
            )}
          >
            {trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
        {badge && (
          <span className="text-[10px] font-semibold text-green-500 uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool audit list
// ---------------------------------------------------------------------------

function ToolAuditList() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex-1">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Audit: Tool Calls
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {TOOL_CALL_STATS.map((tool) => (
          <div key={tool.name} className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-muted-foreground truncate">
              .{tool.name}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs font-semibold text-foreground tabular-nums">
                {tool.count}
              </span>
              {tool.trend === null ? (
                <span className="text-[10px] text-muted-foreground/50">stable</span>
              ) : (
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    tool.trend > 0 ? 'text-green-500' : 'text-red-500',
                  )}
                >
                  {tool.trend > 0 ? '+' : ''}{tool.trend}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trend chart (bar / line toggle, AI / Logs data source toggle)
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

function TrendChart({ period }: { period: TimePeriod }) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [source, setSource] = useState<DataSource>('ai');

  const data = TREND_DATA[period];
  const dataKey = source === 'ai' ? 'ai' : 'logs';
  const color = source === 'ai' ? C.primary : C.cyan;
  const label = source === 'ai' ? 'AI Queries' : 'Logs';

  const axisProps = {
    tick: { fill: C.axis, fontSize: 10 },
    axisLine: false as const,
    tickLine: false as const,
  };

  const chartContent =
    chartType === 'bar' ? (
      <BarChart data={data} barCategoryGap="35%">
        <CartesianGrid vertical={false} stroke={C.grid} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={32} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey={dataKey} name={label} fill={color} radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    ) : (
      <LineChart data={data}>
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
    );

  return (
    <div className="rounded-lg border border-border bg-card p-4 h-full flex flex-col">
      {/* Chart header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Trend Analysis
        </span>
        <div className="flex items-center gap-2">
          {/* Data source toggle */}
          <div className="flex rounded border border-border overflow-hidden">
            {(['ai', 'logs'] as DataSource[]).map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={cn(
                  'px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors',
                  s === source
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {s === 'ai' ? 'AI' : 'Logs'}
              </button>
            ))}
          </div>
          {/* Chart type toggle */}
          <div className="flex gap-0.5">
            <button
              onClick={() => setChartType('bar')}
              title="Bar chart"
              className={cn(
                'p-1.5 rounded transition-colors',
                chartType === 'bar'
                  ? 'text-foreground bg-accent'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <BarChart2 size={13} />
            </button>
            <button
              onClick={() => setChartType('line')}
              title="Line chart"
              className={cn(
                'p-1.5 rounded transition-colors',
                chartType === 'line'
                  ? 'text-foreground bg-accent'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LineChartIcon size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartContent}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Log severity gauge
// ---------------------------------------------------------------------------

function HealthGauge() {
  const errorTotal = LOG_SEVERITY.error + LOG_SEVERITY.critical;
  const total = LOG_SEVERITY.info + LOG_SEVERITY.warn + errorTotal;
  const pct = (n: number) => ((n / total) * 100).toFixed(1);

  const segments = [
    { name: 'INFO', count: LOG_SEVERITY.info, fill: C.primary },
    { name: 'WARN', count: LOG_SEVERITY.warn, fill: C.amber },
    { name: 'ERROR', count: errorTotal, fill: C.red },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4 h-full flex flex-col">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-4 block">
        Log Severity
      </span>

      <div className="flex flex-col items-center gap-4 flex-1">
        {/* Donut */}
        <div className="relative w-[156px] h-[156px] flex-shrink-0">
          <PieChart width={156} height={156}>
            <Pie
              data={segments.map((s) => ({ name: s.name, value: s.count }))}
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

          {/* Center: total count */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-foreground leading-none tabular-nums">
              {fmtCompact(total)}
            </span>
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wide mt-0.5">
              total logs
            </span>
          </div>
        </div>

        {/* Legend: name | % | count */}
        <div className="flex flex-col gap-2.5 w-full">
          {segments.map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
                style={{ background: s.fill }}
              />
              <span className="text-[11px] text-muted-foreground flex-1">{s.name}</span>
              <span className="text-[10px] text-muted-foreground/50 tabular-nums w-10 text-right">
                {pct(s.count)}%
              </span>
              <span
                className="text-xs font-semibold tabular-nums w-12 text-right"
                style={{ color: s.fill }}
              >
                {s.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
