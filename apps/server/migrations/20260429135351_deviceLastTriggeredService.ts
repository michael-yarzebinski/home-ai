import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.table('devices', (table) => {
        table.jsonb('last_triggered_service').nullable().defaultTo(null);
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.table('devices', (table) => {
        table.dropColumn('last_triggered_service');
    });
}
