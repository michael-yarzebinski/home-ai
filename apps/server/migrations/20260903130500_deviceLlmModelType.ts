import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("devices", (table) => {
    table.string("llm_model_type").notNullable().defaultTo("soon");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("devices", (table) => {
    table.dropColumn("llm_model_type");
  });
}
