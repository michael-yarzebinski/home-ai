import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("automation_rules", (table) => {
    table.boolean("disabled").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("automation_rules", (table) => {
    table.dropColumn("disabled");
  });
}
