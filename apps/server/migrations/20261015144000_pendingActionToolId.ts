import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("pending_actions", "tool_id");
  if (hasColumn) return;

  await knex.schema.alterTable("pending_actions", (table) => {
    table.uuid("tool_id").notNullable().references("id").inTable("tools");
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("pending_actions", "tool_id");
  if (!hasColumn) return;

  await knex.schema.alterTable("pending_actions", (table) => {
    table.dropColumn("tool_id");
  });
}
