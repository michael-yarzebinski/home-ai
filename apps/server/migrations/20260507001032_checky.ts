import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const ROLES = ["admin", "parent", "child", "guest", "readonly", "automation"];
    const HOME_ROLES = ["admin", "parent", "child", "readonly", "automation"];
    const ADMIN_PARENT = ["admin", "parent"];

    // 1. Checklists (The Container)
    await knex.schema.createTable('checklists', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('name').notNullable();
        table.text('description');
        table.jsonb("read_roles").defaultTo("[]");
        table.jsonb("write_roles").defaultTo("[]");
        table.boolean('active').defaultTo(true);
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
    });

    // 2. Recurring Checklist Items (The Blueprint/Factory)
    await knex.schema.createTable('recurring_checklist_items', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('checklist_id').references('id').inTable('checklists').onDelete('CASCADE');
        table.string('title').notNullable();
        table.text('description');
        table.string('default_assignee_id').nullable();
        table.string('priority').defaultTo('medium');
        table.jsonb('tags').defaultTo('[]');

        // Logic for the factory
        table.string('trigger_type').notNullable(); // CRON or EVENT
        table.jsonb('trigger_config').notNullable(); // { cron: string, eventTag: string, dueInDays: number }
        table.jsonb('depends_on_recurring_ids').defaultTo('[]');

        table.jsonb('metadata').defaultTo('{}'); // { videoLinks: [], requiredItems: [] }
        table.boolean('active').defaultTo(true);
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
    });

    // 3. Checklist Items (The Instances)
    await knex.schema.createTable('checklist_items', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('checklist_id').references('id').inTable('checklists').onDelete('CASCADE');
        table.uuid('recurring_item_id').references('id').inTable('recurring_checklist_items').onDelete('SET NULL');

        table.string('title').notNullable();
        table.text('description');
        table.string('assignee_id').nullable();
        table.string('priority').defaultTo('medium');
        table.timestamp('due_date').nullable();
        table.string('status').defaultTo('pending');

        // Soft Dependencies: Array of ChecklistItem IDs
        table.jsonb('depends_on').defaultTo('[]');
        table.jsonb('tags').defaultTo('[]');

        // Audit fields
        table.timestamp('completed_at').nullable();
        table.string('completed_by').nullable();

        table.jsonb('metadata').defaultTo('{}');
        table.boolean('active').defaultTo(true);
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
    });

    await knex("checklists").insert({
        name: "To Dos",
        description: "Default household task checklist",
        read_roles: JSON.stringify(HOME_ROLES),
        write_roles: JSON.stringify(ADMIN_PARENT),
    });

    // 4. Checklist tool definitions
    const toolData = [
        {
            name: "add-checklist",
            friendly_name: "Add Checklist",
            hints: "create checklist, checklist container",
            request_roles: ADMIN_PARENT,
            write_roles: ADMIN_PARENT,
            notify_roles: [],
        },
        {
            name: "update-checklist",
            friendly_name: "Update Checklist",
            hints: "rename checklist, update checklist roles",
            request_roles: ADMIN_PARENT,
            write_roles: ADMIN_PARENT,
            notify_roles: [],
        },
        {
            name: "list-checklists",
            friendly_name: "List Checklists",
            hints: "view checklists",
            request_roles: [],
            write_roles: HOME_ROLES,
            notify_roles: [],
        },
        {
            name: "get-checklist",
            friendly_name: "Get Checklist",
            hints: "view checklist details and items",
            request_roles: [],
            write_roles: HOME_ROLES,
            notify_roles: [],
        },
        {
            name: "check-checklist-item",
            friendly_name: "Check Checklist Item",
            hints: "complete checklist task",
            request_roles: [],
            write_roles: HOME_ROLES,
            notify_roles: [],
        },
        {
            name: "uncheck-checklist-item",
            friendly_name: "Uncheck Checklist Item",
            hints: "reopen checklist task",
            request_roles: [],
            write_roles: HOME_ROLES,
            notify_roles: [],
        },
        {
            name: "add-checklist-item",
            friendly_name: "Add Checklist Item",
            hints: "add item to checklist",
            request_roles: HOME_ROLES,
            write_roles: ADMIN_PARENT,
            notify_roles: [],
        },
        {
            name: "update-checklist-item",
            friendly_name: "Update Checklist Item",
            hints: "edit checklist item details",
            request_roles: HOME_ROLES,
            write_roles: ADMIN_PARENT,
            notify_roles: [],
        },
        {
            name: "add-recurring-item",
            friendly_name: "Add Recurring Checklist Item",
            hints: "create recurring checklist template",
            request_roles: [],
            write_roles: ADMIN_PARENT,
            notify_roles: [],
        },
        {
            name: "update-recurring-item",
            friendly_name: "Update Recurring Checklist Item",
            hints: "edit recurring checklist template",
            request_roles: [],
            write_roles: ADMIN_PARENT,
            notify_roles: [],
        },
        {
            name: "generate-checklist-items-from-tags",
            friendly_name: "Generate Checklist Items from Tags",
            hints: "generate checklist items from recurring templates",
            request_roles: [],
            write_roles: ADMIN_PARENT,
            notify_roles: [],
        },
        {
            name: "get-user-assigned-checklist-items",
            friendly_name: "Get User Assigned Checklist Items",
            hints: "my assigned checklist tasks",
            request_roles: [],
            write_roles: ROLES,
            notify_roles: [],
        },
        {
            name: "get-recurring-item-tags",
            friendly_name: "Get Recurring Item Tags",
            hints: "list recurring checklist tag names",
            request_roles: [],
            write_roles: HOME_ROLES,
            notify_roles: [],
        },
        {
            name: "get-users",
            friendly_name: "Get Users",
            hints: "internal lookup for user id and name assignment",
            request_roles: [],
            write_roles: ADMIN_PARENT,
            notify_roles: [],
        },
    ];

    const rows = toolData.map((tool) => ({
        ...tool,
        request_roles: JSON.stringify(tool.request_roles),
        write_roles: JSON.stringify(tool.write_roles),
        notify_roles: JSON.stringify(tool.notify_roles),
    }));

    await knex("tools").insert(rows);
};

export async function down(knex: Knex): Promise<void> {
    await knex("tools")
        .whereIn("name", [
            "add-checklist",
            "update-checklist",
            "list-checklists",
            "get-checklist",
            "check-checklist-item",
            "uncheck-checklist-item",
            "add-checklist-item",
            "update-checklist-item",
            "add-recurring-item",
            "update-recurring-item",
            "generate-checklist-items-from-tags",
            "get-user-assigned-checklist-items",
            "get-recurring-item-tags",
            "get-users",
        ])
        .delete();

    await knex.schema.dropTableIfExists('checklist_items');
    await knex.schema.dropTableIfExists('recurring_checklist_items');
    await knex.schema.dropTableIfExists('checklists');
};