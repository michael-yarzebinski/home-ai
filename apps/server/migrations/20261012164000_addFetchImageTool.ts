import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const roles = ["admin", "parent", "child", "guest", "readonly", "automation"];

  await knex("tools")
    .insert({
      name: "fetch-image",
      friendly_name: "Fetch Image",
      hints:
        "Downloads an image URL into the current turn. A path is requested from Home Assistant. Pass filename to also save it under snapshots.",
      request_roles: JSON.stringify(roles),
      write_roles: JSON.stringify(roles),
      notify_roles: JSON.stringify([]),
    })
    .onConflict("name")
    .ignore();
}

export async function down(knex: Knex): Promise<void> {
  await knex("tools").where("name", "fetch-image").del();
}
