import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("notification_queue", (table) => {
    table.dropColumn("scheduled_for");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("notification_queue", (table) => {
    table.timestamp("scheduled_for").notNullable().defaultTo(knex.fn.now());
  });
}
