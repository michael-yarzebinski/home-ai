import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("devices", (table) => {
    table.string("llm_model_type").notNullable().defaultTo("soon");
  });

  // Time-sensitive devices should use the fast LLM path by default.
  await knex("devices")
    .where("is_time_sensitive", true)
    .update({ llm_model_type: "immediate" });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("devices", (table) => {
    table.dropColumn("llm_model_type");
  });
}
