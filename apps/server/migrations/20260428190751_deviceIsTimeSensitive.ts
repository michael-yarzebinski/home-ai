import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.table('devices', (table) => {
        table.boolean('is_time_sensitive').defaultTo(false).notNullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.table('devices', (table) => {
        table.dropColumn('is_time_sensitive');
    });
}
