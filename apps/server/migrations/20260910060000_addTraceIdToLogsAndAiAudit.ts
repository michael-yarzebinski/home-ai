import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("logs", (t) => {
    t.uuid("trace_id").nullable();
    t.index("trace_id");
  });
  await knex.schema.alterTable("ai_audit", (t) => {
    t.uuid("trace_id").nullable();
    t.index("trace_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("logs", (t) => {
    t.dropIndex(["trace_id"], "logs_trace_id_index");
    t.dropColumn("trace_id");
  });
  await knex.schema.alterTable("ai_audit", (t) => {
    t.dropIndex(["trace_id"], "ai_audit_trace_id_index");
    t.dropColumn("trace_id");
  });
}
