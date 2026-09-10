import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const roles = ["admin", "parent", "child", "guest", "readonly", "automation"];

  await knex("tools")
    .insert({
      name: "get-device-event-history",
      friendly_name: "Get Device Event History",
      hints: "",
      request_roles: JSON.stringify(roles),
      write_roles: JSON.stringify(roles),
      notify_roles: JSON.stringify([]),
    })
    .onConflict("name")
    .ignore();
}

export async function down(knex: Knex): Promise<void> {
  await knex("tools").where("name", "get-device-event-history").del();
}
