import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('automation_rules', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('user_id').notNullable().index();
        table.string('name').notNullable();
        table.text('description').nullable();

        // The Discriminated Union data
        table.jsonb('trigger').notNullable();
        table.jsonb('actions').notNullable().defaultTo("[]");

        table.integer('cooldown_minutes').defaultTo(0);
        table.timestamp('last_run').nullable();
        table.boolean("active").defaultTo(true);
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
    });

    await knex('tools')
        .where({ name: 'add-notification-preference' })
        .update({
            name: 'add-automation-rule',
            friendly_name: 'Add Automation Rule',
        });

    await knex('tools')
        .where({ name: 'list-notification-preferences' })
        .update({
            name: 'list-automation-rules',
            friendly_name: 'List Automation Rules',
        });

    await knex('tools')
        .where({ name: 'update-notification-preference' })
        .update({
            name: 'update-automation-rule',
            friendly_name: 'Update Automation Rule',
        });
}


export async function down(knex: Knex): Promise<void> {
    await knex('tools')
        .where({ name: 'add-automation-rule' })
        .update({
            name: 'add-notification-preference',
            friendly_name: 'Add Notification Preference',
        });

    await knex('tools')
        .where({ name: 'list-automation-rules' })
        .update({
            name: 'list-notification-preferences',
            friendly_name: 'List Notification Preferences',
        });

    await knex('tools')
        .where({ name: 'update-automation-rule' })
        .update({
            name: 'update-notification-preference',
            friendly_name: 'Update Notification Preference',
        });

    await knex.schema.dropTable('automation_rules');
}
