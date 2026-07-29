import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("device_events", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("device_id").notNullable().references("id").inTable("devices").onDelete("CASCADE");
        table.string("entity_id").notNullable();
        table.string("old_state");
        table.string("new_state").notNullable();
        table.jsonb("metadata").defaultTo("{}");

        table.boolean("active").defaultTo(true);
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());

        table.index(["device_id", "created_at"]);
        table.index("entity_id");
    });
}


export async function down(knex: Knex): Promise<void> {
}
