import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("devices", (table) => {
    table.jsonb("ignored_entity_ids").notNullable().defaultTo("[]");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("devices", (table) => {
    table.dropColumn("ignored_entity_ids");
  });
}
