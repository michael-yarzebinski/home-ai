import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex("app_config")
    .insert({
      key: "TIMEZONE",
      value: "America/New_York",
      description: "IANA timezone for the server (household clock)",
      active: true,
    })
    .onConflict("key")
    .ignore();
}

export async function down(knex: Knex): Promise<void> {
  await knex("app_config").where("key", "TIMEZONE").del();
}
