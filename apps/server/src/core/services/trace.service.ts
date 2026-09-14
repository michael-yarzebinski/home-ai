import { Inject, Injectable } from "@nestjs/common";
import type { Knex } from "knex";
import type { SearchCriteriaBase } from "@home-ai/shared/search/search";
import { Paginated } from "@home-ai/shared/search/pagination";
import type {
  TurnTraceDetail,
  TurnTraceSummary,
} from "@home-ai/shared/domain/monitoring/trace/trace";
import { LogStore } from "../stores/monitoring/log/log.store";
import { AIAuditStore } from "../stores/monitoring/ai-audit/ai-audit.store";

@Injectable()
export class TraceService {
  constructor(
    @Inject("KNEX_CONNECTION") private readonly knex: Knex,
    private readonly logStore: LogStore,
    private readonly aiAuditStore: AIAuditStore,
  ) {}

  async getById(traceId: string): Promise<TurnTraceDetail | null> {
    const [logs, audits] = await Promise.all([
      this.logStore.findByTraceId(traceId),
      this.aiAuditStore.findByTraceId(traceId),
    ]);
    if (logs.length === 0 && audits.length === 0) {
      return null;
    }

    const times = [
      ...logs.map((l) => new Date(l.createdAt).getTime()),
      ...audits.map((a) => new Date(a.createdAt).getTime()),
    ];
    const firstAudit = audits[0];
    const errorCount = logs.filter((l) =>
      String(l.severity).toLowerCase().includes("error"),
    ).length;

    return {
      traceId,
      userId: firstAudit?.userId ?? logs.find((l) => l.userId)?.userId,
      chatSessionId: firstAudit?.chatSessionId,
      prompt: firstAudit?.userMessage,
      startedAt: new Date(Math.min(...times)),
      endedAt: new Date(Math.max(...times)),
      logCount: logs.length,
      auditCount: audits.length,
      errorCount,
      logs,
      audits,
    };
  }

  async search(
    criteria: SearchCriteriaBase,
  ): Promise<Paginated<TurnTraceSummary>> {
    const query = criteria.query?.trim() ?? "";
    const page = criteria.page;
    const pageSize = criteria.pageSize;
    const offset = (page - 1) * pageSize;

    const bindings: Array<string | number> = [];
    let auditFilter = "";
    let logFilter = "";
    if (query) {
      if (isUuid(query)) {
        auditFilter = "AND trace_id = ?";
        logFilter = "AND trace_id = ?";
        bindings.push(query, query);
      } else {
        auditFilter = "AND user_message ILIKE ?";
        logFilter = "AND FALSE";
        bindings.push(`%${query}%`);
      }
    }

    const fromSql = `
      FROM (
        SELECT
          COALESCE(a.trace_id, l.trace_id) AS trace_id,
          COALESCE(a.user_id, l.user_id) AS user_id,
          a.chat_session_id,
          COALESCE(a.started_at, l.started_at) AS started_at,
          COALESCE(a.ended_at, l.ended_at) AS ended_at,
          COALESCE(l.log_count, 0)::int AS log_count,
          COALESCE(a.audit_count, 0)::int AS audit_count,
          COALESCE(l.error_count, 0)::int AS error_count
        FROM (
          SELECT
            trace_id,
            MIN(created_at) AS started_at,
            MAX(created_at) AS ended_at,
            MIN(user_id::text) AS user_id,
            MIN(chat_session_id::text) AS chat_session_id,
            COUNT(*)::int AS audit_count
          FROM ai_audit
          WHERE trace_id IS NOT NULL ${auditFilter}
          GROUP BY trace_id
        ) a
        FULL OUTER JOIN (
          SELECT
            trace_id,
            MIN(created_at) AS started_at,
            MAX(created_at) AS ended_at,
            MIN(user_id::text) AS user_id,
            COUNT(*)::int AS log_count,
            COUNT(*) FILTER (WHERE lower(severity) LIKE '%error%')::int AS error_count
          FROM logs
          WHERE trace_id IS NOT NULL ${logFilter}
          GROUP BY trace_id
        ) l ON a.trace_id = l.trace_id
      ) t
    `;

    const countRow = await this.knex.raw(
      `SELECT COUNT(*)::int AS count ${fromSql}`,
      bindings,
    );
    const total = Number(countRow.rows?.[0]?.count ?? 0);

    const listBindings = [...bindings];
    const result = await this.knex.raw(
      `
      SELECT
        t.*,
        (
          SELECT user_message
          FROM ai_audit
          WHERE trace_id = t.trace_id
          ORDER BY created_at ASC
          LIMIT 1
        ) AS prompt
      ${fromSql}
      ORDER BY t.started_at DESC NULLS LAST
      LIMIT ? OFFSET ?
      `,
      [...listBindings, pageSize, offset],
    );

    const items: TurnTraceSummary[] = (result.rows as any[]).map((r) => ({
      traceId: r.trace_id,
      userId: r.user_id || undefined,
      chatSessionId: r.chat_session_id || undefined,
      prompt: r.prompt || undefined,
      startedAt: new Date(r.started_at),
      endedAt: new Date(r.ended_at),
      logCount: Number(r.log_count ?? 0),
      auditCount: Number(r.audit_count ?? 0),
      errorCount: Number(r.error_count ?? 0),
    }));

    return {
      items,
      total,
      page,
      pageSize,
      hasNext: page * pageSize < total,
      hasPrevious: page > 1,
    };
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
