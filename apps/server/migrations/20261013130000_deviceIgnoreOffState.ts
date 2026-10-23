import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("devices", (table) => {
    table.boolean("ignore_off_state").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("devices", (table) => {
    table.dropColumn("ignore_off_state");
  });
}
