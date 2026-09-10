import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("notification_queue", (table) => {
    table.dropColumn("importance");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("notification_queue", (table) => {
    table.text("importance").notNullable().defaultTo("normal");
  });
}
