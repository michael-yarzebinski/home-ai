import type { Knex } from "knex";

const ROLES = ["admin", "parent", "child", "guest", "readonly", "automation"];

const FIND_TOOLS = [
  {
    name: "find-devices",
    friendly_name: "Find Devices",
    hints:
      "Fuzzy search devices by slug and friendly name. Prefer over list-devices when resolving a user phrase.",
  },
  {
    name: "find-notes",
    friendly_name: "Find Notes",
    hints:
      "Fuzzy search notes by name and friendly name. Prefer over list-notes when resolving a user phrase.",
  },
  {
    name: "find-calendars",
    friendly_name: "Find Calendars",
    hints:
      "Fuzzy search calendars by name and friendly name. Prefer over list-calendars when resolving a user phrase.",
  },
  {
    name: "find-checklists",
    friendly_name: "Find Checklists",
    hints:
      "Fuzzy search checklists by name. Prefer over list-checklists when resolving a user phrase.",
  },
  {
    name: "find-facts",
    friendly_name: "Find Facts",
    hints:
      "Fuzzy search facts by key. Prefer over list-facts when resolving a user phrase.",
  },
] as const;

export async function up(knex: Knex): Promise<void> {
  await knex("tools")
    .insert(
      FIND_TOOLS.map((tool) => ({
        name: tool.name,
        friendly_name: tool.friendly_name,
        hints: tool.hints,
        request_roles: JSON.stringify(ROLES),
        write_roles: JSON.stringify(ROLES),
        notify_roles: JSON.stringify([]),
      })),
    )
    .onConflict("name")
    .ignore();
}

export async function down(knex: Knex): Promise<void> {
  await knex("tools")
    .whereIn(
      "name",
      FIND_TOOLS.map((t) => t.name),
    )
    .del();
}
