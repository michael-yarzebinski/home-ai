import { Inject, Injectable } from "@nestjs/common";
import type { Knex } from "knex";
import {
  type DashboardPeriod,
  type DashboardResult,
  type TimeBucket,
} from "@home-ai/shared/admin/dashboard/dashboard";
import { LogStore } from "../stores/monitoring/log/log.store";
import { Trace } from "src/common/decorators/trace.decorator";

// Truncation unit drives how many data points appear in the chart.
const PERIOD_CONFIG: Record<
  DashboardPeriod,
  { intervalSql: string; truncUnit: string; periodMs: number }
> = {
  "1h": {
    intervalSql: "1 hour",
    truncUnit: "minute",
    periodMs: 60 * 60 * 1000,
  },
  "24h": {
    intervalSql: "24 hours",
    truncUnit: "hour",
    periodMs: 24 * 60 * 60 * 1000,
  },
  "7d": {
    intervalSql: "7 days",
    truncUnit: "day",
    periodMs: 7 * 24 * 60 * 60 * 1000,
  },
  "30d": {
    intervalSql: "30 days",
    truncUnit: "day",
    periodMs: 30 * 24 * 60 * 60 * 1000,
  },
  "90d": {
    intervalSql: "90 days",
    truncUnit: "week",
    periodMs: 90 * 24 * 60 * 60 * 1000,
  },
};

@Injectable()
export class DashboardService {
  constructor(
    @Inject("KNEX_CONNECTION") private readonly knex: Knex,
    private readonly logStore: LogStore,
  ) {}

  @Trace()
  async get(period: DashboardPeriod): Promise<DashboardResult> {
    const { intervalSql, truncUnit, periodMs } = PERIOD_CONFIG[period];
    const to = new Date();
    const from = new Date(Date.now() - periodMs);

    const [
      logBuckets,
      aiAuditBuckets,
      auditBuckets,
      notifLogBuckets,
      severityRows,
      recentErrors,
      queueStats,
      pendingStats,
    ] = await Promise.all([
      this.timeBuckets("logs", "created_at", truncUnit, intervalSql),
      this.timeBuckets("ai_audit", "created_at", truncUnit, intervalSql),
      this.timeBuckets("audit", "created_at", truncUnit, intervalSql),
      this.timeBuckets(
        "notification_log",
        "created_at",
        truncUnit,
        intervalSql,
      ),
      this.knex("logs")
        .select("severity")
        .count("* as count")
        .where(
          "created_at",
          ">=",
          this.knex.raw(`NOW() - INTERVAL '${intervalSql}'`),
        )
        .groupBy("severity") as Promise<
        Array<{ severity: string; count: string }>
      >,
      this.knex("logs")
        .select("id", "message", "created_at as createdAt", "metadata")
        .where("severity", "error")
        .where(
          "created_at",
          ">=",
          this.knex.raw(`NOW() - INTERVAL '${intervalSql}'`),
        )
        .orderBy("created_at", "desc")
        .limit(10) as Promise<
        Array<{
          id: string;
          message: string;
          createdAt: Date;
          metadata: unknown;
        }>
      >,
      this.knex("notification_queue")
        .select(
          this.knex.raw("COUNT(*)::int AS total"),
          this.knex.raw(
            `COUNT(*) FILTER (WHERE active = true AND scheduled_for > NOW())::int AS pending`,
          ),
        )
        .first() as Promise<{ total: number; pending: number }>,
      this.knex("pending_actions")
        .select("status")
        .count("* as count")
        .groupBy("status") as Promise<Array<{ status: string; count: string }>>,
    ]);

    // Merge all four sources into a single timeline keyed by truncated timestamp.
    const bucketMap = new Map<string, TimeBucket>();
    const mergeBuckets = (
      rows: Array<{ bucket: string; count: string }>,
      key: keyof Pick<
        TimeBucket,
        "logs" | "aiAudit" | "audit" | "notificationLog"
      >,
    ) => {
      for (const row of rows) {
        const ts = new Date(row.bucket).toISOString();
        const entry = bucketMap.get(ts) ?? {
          timestamp: ts,
          aiAudit: 0,
          audit: 0,
          logs: 0,
          notificationLog: 0,
        };
        entry[key] = Number(row.count);
        bucketMap.set(ts, entry);
      }
    };
    mergeBuckets(logBuckets, "logs");
    mergeBuckets(aiAuditBuckets, "aiAudit");
    mergeBuckets(auditBuckets, "audit");
    mergeBuckets(notifLogBuckets, "notificationLog");
    const buckets = Array.from(bucketMap.values()).sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp),
    );

    // Severity summary
    const sev: Record<string, number> = {};
    for (const row of severityRows)
      sev[row.severity.toLowerCase()] = Number(row.count);
    const logsBySeverity = {
      info: sev["info"] ?? 0,
      warn: sev["warn"] ?? 0,
      error: sev["error"] ?? 0,
      total: Object.values(sev).reduce((sum, n) => sum + n, 0),
    };

    // Pending actions breakdown by status
    const paMap: Record<string, number> = {};
    for (const row of pendingStats) paMap[row.status] = Number(row.count);
    const pendingActionsTotal = Object.values(paMap).reduce(
      (sum, n) => sum + n,
      0,
    );

    return {
      temporal: {
        period,
        from,
        to,
        buckets,
        logsBySeverity,
      },
      system: {
        notificationQueue: {
          total: queueStats?.total ?? 0,
          pending: queueStats?.pending ?? 0,
        },
        pendingActions: {
          total: pendingActionsTotal,
          pending: paMap["pending"] ?? 0,
          approved: paMap["approved"] ?? 0,
          rejected: paMap["rejected"] ?? 0,
        },
        recentErrors: recentErrors.map((r) => ({
          id: r.id,
          message: r.message,
          createdAt: r.createdAt,
          metadata: r.metadata,
        })),
      },
    };
  }

  private timeBuckets(
    table: string,
    tsColumn: string,
    truncUnit: string,
    intervalSql: string,
  ): Promise<Array<{ bucket: string; count: string }>> {
    return this.knex(table)
      .select(
        this.knex.raw(`date_trunc('${truncUnit}', ${tsColumn}) AS bucket`),
      )
      .count("* as count")
      .where(tsColumn, ">=", this.knex.raw(`NOW() - INTERVAL '${intervalSql}'`))
      .groupByRaw(`date_trunc('${truncUnit}', ${tsColumn})`) as any;
  }
}
