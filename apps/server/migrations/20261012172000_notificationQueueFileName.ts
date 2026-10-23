import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("notification_queue", (table) => {
    table.text("file_name").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("notification_queue", (table) => {
    table.dropColumn("file_name");
  });
}
