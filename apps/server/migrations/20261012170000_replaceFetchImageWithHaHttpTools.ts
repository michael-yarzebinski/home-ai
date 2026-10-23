import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const roles = ["admin", "parent", "child", "guest", "readonly", "automation"];

  await knex("tools").where("name", "fetch-image").del();

  await knex("tools")
    .insert([
      {
        name: "call-home-assistant",
        friendly_name: "Call Home Assistant",
        hints:
          "HTTP request to a Home Assistant path. Image responses are attached to the current turn.",
        request_roles: JSON.stringify(roles),
        write_roles: JSON.stringify(roles),
        notify_roles: JSON.stringify([]),
      },
      {
        name: "save-image",
        friendly_name: "Save Image",
        hints:
          "Saves an image from a Home Assistant path under local-data/snapshots.",
        request_roles: JSON.stringify(roles),
        write_roles: JSON.stringify(roles),
        notify_roles: JSON.stringify([]),
      },
    ])
    .onConflict("name")
    .ignore();
}

export async function down(knex: Knex): Promise<void> {
  await knex("tools")
    .whereIn("name", ["call-home-assistant", "save-image"])
    .del();
}
