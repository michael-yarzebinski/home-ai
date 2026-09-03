import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("ai_audit", (t) => {
    t.text("model").nullable();
    t.integer("prompt_tokens").nullable();
    t.integer("completion_tokens").nullable();
    t.integer("total_tokens").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("ai_audit", (t) => {
    t.dropColumn("model");
    t.dropColumn("prompt_tokens");
    t.dropColumn("completion_tokens");
    t.dropColumn("total_tokens");
  });
}
