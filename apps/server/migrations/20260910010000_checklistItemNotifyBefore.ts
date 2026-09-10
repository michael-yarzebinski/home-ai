import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("checklist_items", (table) => {
    table.jsonb("notify_before").nullable();
    table.timestamp("reminder_sent_at").nullable();
  });

  await knex.schema.table("recurring_checklist_items", (table) => {
    table.jsonb("notify_before").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("checklist_items", (table) => {
    table.dropColumn("notify_before");
    table.dropColumn("reminder_sent_at");
  });

  await knex.schema.table("recurring_checklist_items", (table) => {
    table.dropColumn("notify_before");
  });
}
