import { Knex } from 'knex';
import * as bcrypt from 'bcrypt';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  // 1. Users
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('role').notNullable();
    table.string('messaging_id').unique();
    table.string('access_code_hash');
    table.time('quiet_start').nullable();
    table.time('quiet_end').nullable();
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // 2. App Config
  await knex.schema.createTable('app_config', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('key').unique().notNullable();
    table.jsonb('value').notNullable().defaultTo('{}');
    table.text('description').nullable();
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // 3. Tasks (Admin control only)
  await knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('task_name').unique();
    table.text('description').notNullable();
    table.jsonb('request_roles').notNullable().defaultTo('[]');
    table.jsonb('execute_roles').notNullable().defaultTo('[]');
    table.jsonb('notify_roles').notNullable().defaultTo('[]');
    table.boolean('active').defaultTo(true);
    table.integer('version').defaultTo(1);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // 4. Devices (Simplified - HA is source of truth)
  await knex.schema.createTable('devices', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('device_id_slug').notNullable().unique();   // e.g. "litter_robot_main"
    table.string('friendly_name').notNullable();
    table.string('ha_entity_id').nullable();                 // Main link to Home Assistant
    table.jsonb('notification_guidance').defaultTo('{}');
    table.jsonb('visible_to_roles').nullable();
    table.boolean('active').defaultTo(true);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // 5. Task Requests
  await knex.schema.createTable('task_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.bigIncrements('readable_id');                      // Simple integer: 1, 2, 3... (shown to user as "Task 85")

    table.string('task_name').references('task_name').inTable('tasks').onDelete('SET NULL');
    table.uuid('requester_user_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('executor_user_id').references('id').inTable('users').onDelete('SET NULL');

    table.jsonb('parameters').nullable();
    table.jsonb('attachments').nullable().defaultTo('[]');

    table.string('status').notNullable().defaultTo('pending');

    // Device linkage
    table.uuid('device_id').nullable().references('id').inTable('devices').onDelete('SET NULL');

    // Approval & scheduling
    table.boolean('requires_approval').defaultTo(false);
    table.uuid('approved_by_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('approved_at', { useTz: true }).nullable();

    table.boolean('quiet_hours_queued').defaultTo(false);
    table.timestamp('scheduled_for', { useTz: true }).nullable();
    table.timestamp('executed_at', { useTz: true }).nullable();

    table.text('notes').nullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // 6. Notifications (Survive user deletion)
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('recipient_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('task_request_id').nullable().references('id').inTable('task_requests').onDelete('SET NULL');
    table.text('message_text').notNullable();
    table.string('status').defaultTo('pending');
    table.timestamp('scheduled_send_after', { useTz: true }).nullable();
    table.timestamp('sent_at', { useTz: true }).nullable();
    table.text('notes').nullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // 7. Facts / Memory
  await knex.schema.createTable('facts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('key').notNullable().unique();
    table.text('value').notNullable();
    table.uuid('owner_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.jsonb('visible_to_roles').nullable().defaultTo('[]');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // 8. Conversation States
  await knex.schema.createTable('conversation_states', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('chat_guid').notNullable().unique();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    table.string('current_task_name').nullable();
    table.jsonb('pending_parameters').defaultTo('{}');
    table.text('clarification_question').nullable();
    table.text('last_ai_message').nullable();

    table.uuid('related_task_request_id').nullable()
      .references('id').inTable('task_requests').onDelete('SET NULL');

    table.text('conversation_summary').nullable();
    table.string('status', 50).defaultTo('active');

    table.timestamp('last_activity_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.raw(`
    ALTER TABLE conversation_states 
    ADD CONSTRAINT chk_conversation_states_status 
    CHECK (status IN ('active', 'completed', 'abandoned', 'expired'));
  `);

  await knex.schema.createTable('recipes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.bigIncrements('readable_id');
    table.string('title').notNullable();
    table.text('source_url').notNullable().unique();
    table.string('pdf_path').notNullable();           // local path or S3 key
    table.text('raw_text').nullable();                // full extracted text (optional)
    table.jsonb('metadata').defaultTo('{}');          // extra info (author, time, servings, etc.)
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('ingredients', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('recipe_id').references('id').inTable('recipes').onDelete('CASCADE');
    table.string('name').notNullable();               // standardized name
    table.string('original_name').nullable();         // as it appeared on the page
    table.string('quantity').nullable();
    table.string('unit').nullable();
    table.text('notes').nullable();                   // e.g. "diced", "to taste"
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // 9. AI Audit
  await knex.schema.createTable('ai_audit', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.timestamp('timestamp', { useTz: true }).defaultTo(knex.fn.now()).notNullable();
    table.string('event_type').notNullable();
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('task_request_id').nullable().references('id').inTable('task_requests').onDelete('SET NULL');
    table.string('task_name').nullable();

    table.string('model').nullable();
    table.text('model_input').nullable();
    table.text('model_output').nullable();
    table.integer('latency_ms').nullable();

    table.jsonb('metadata').defaultTo('{}');
    table.text('notes').nullable();

    table.index(['user_id', 'timestamp']);
    table.index(['task_request_id']);
    table.index(['event_type', 'timestamp']);
  });

  // 10. General Audit
  await knex.schema.createTable('audit', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.timestamp('timestamp', { useTz: true }).defaultTo(knex.fn.now()).notNullable();
    table.string('entity_type').notNullable();
    table.string('entity_id').notNullable();
    table.string('action').notNullable();
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.jsonb('changes').nullable();
    table.jsonb('metadata').defaultTo('{}');
    table.text('notes').nullable();

    table.index(['entity_type', 'entity_id', 'timestamp']);
    table.index(['user_id', 'timestamp']);
    table.index(['action', 'timestamp']);
  });

  // 11. Simple Log
  await knex.schema.createTable('log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('severity').nullable();
    table.text('message').nullable();
    table.jsonb('data').nullable();
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Seed initial tasks
  await knex('tasks').insert([
    {
      task_name: 'addToGroceryList',
      description: 'Add one or more items to the Grocery List note in Apple Notes',
      request_roles: JSON.stringify(['child', 'parent', 'automation']),
      execute_roles: JSON.stringify(['parent', 'automation']),
      notify_roles: JSON.stringify(['parent']),
      active: true,
      version: 1,
    },
    {
      task_name: 'addToShortTermList',
      description: 'Add one or more items to the Short Term / This Week list',
      request_roles: JSON.stringify(['child', 'parent', 'automation']),
      execute_roles: JSON.stringify(['parent', 'automation']),
      notify_roles: JSON.stringify(['parent']),
      active: true,
      version: 1,
    },
    {
      task_name: 'addToLongTermList',
      description: 'Add one or more items to the Long Term / Someday list',
      request_roles: JSON.stringify(['child', 'parent', 'automation']),
      execute_roles: JSON.stringify(['parent', 'automation']),
      notify_roles: JSON.stringify(['parent']),
      active: true,
      version: 1,
    },

    {
      task_name: 'addCalendarEvent',
      description: 'Add a new event to the family calendar',
      request_roles: JSON.stringify(['child', 'parent', 'automation']),
      execute_roles: JSON.stringify(['parent', 'admin']),
      notify_roles: JSON.stringify(['parent']),
      active: true,
      version: 1,
    },
    {
      task_name: 'readCalendar',
      description: 'Read upcoming events from the family calendar',
      request_roles: JSON.stringify(['child', 'parent', 'automation', 'readonly']),
      execute_roles: JSON.stringify(['child', 'parent', 'automation', 'readonly']),
      notify_roles: JSON.stringify([]),
      active: true,
      version: 1,
    },

    {
      task_name: 'storeFact',
      description: 'Remember a fact or preference',
      request_roles: JSON.stringify(['parent', 'child', 'automation']),
      execute_roles: JSON.stringify(['parent', 'automation']),
      notify_roles: JSON.stringify([]),
      active: true,
      version: 1,
    },
    {
      task_name: 'retrieveFact',
      description: 'Recall a stored fact',
      request_roles: JSON.stringify(['child', 'parent', 'automation', 'readonly']),
      execute_roles: JSON.stringify(['child', 'parent', 'automation', 'readonly']),
      notify_roles: JSON.stringify([]),
      active: true,
      version: 1,
    },

    {
      task_name: 'dailySummary',
      description: "Get today's summary: weather, calendar, short term list",
      request_roles: JSON.stringify(['child', 'parent', 'automation', 'readonly']),
      execute_roles: JSON.stringify(['child', 'parent', 'automation', 'readonly']),
      notify_roles: JSON.stringify([]),
      active: true,
      version: 1,
    },
    {
      task_name: 'weeklyRecap',
      description: 'Get a weekly recap of tasks and events',
      request_roles: JSON.stringify(['child', 'parent', 'automation', 'readonly']),
      execute_roles: JSON.stringify(['child', 'parent', 'automation', 'readonly']),
      notify_roles: JSON.stringify([]),
      active: true,
      version: 1,
    },
    {
      task_name: 'showPendingApprovals',
      description: 'Show tasks waiting for approval',
      request_roles: JSON.stringify(['parent', 'admin']),
      execute_roles: JSON.stringify(['parent', 'admin']),
      notify_roles: JSON.stringify([]),
      active: false,
      version: 1,
    },

    {
      task_name: 'queryDevice',
      description: 'Query the state of any device',
      request_roles: JSON.stringify(['child', 'parent', 'automation', 'readonly']),
      execute_roles: JSON.stringify(['child', 'parent', 'automation', 'readonly']),
      notify_roles: JSON.stringify(['parent']),
      active: true,
      version: 1,
    },
    {
      task_name: 'saveRecipe',
      description: 'Save a recipe from a webpage URL. Downloads the page as PDF and extracts standardized ingredients.',
      request_roles: JSON.stringify(['child', 'parent', 'automation']),
      execute_roles: JSON.stringify(['parent', 'automation']),
      notify_roles: JSON.stringify(['parent']),
      active: true,
      version: 1,
    },

    {
      task_name: 'notifyForDevice',
      description: 'Process Home Assistant device or entity state changes and intelligently decide whether to send notifications and what the message should be, using the device\'s notification_guidance',
      request_roles: JSON.stringify(['automation']),
      execute_roles: JSON.stringify(['automation']),
      notify_roles: JSON.stringify(['parent']),
      active: true,
      version: 1,
    },
  ]);

  const adminCodeHash = await bcrypt.hash('0000', 12);
  await knex('users').insert({
    id: '00000000-0000-0000-0000-000000000000',
    name: 'admin',
    role: 'admin',
    access_code_hash: adminCodeHash,
    messaging_id: 'ADMIN',
  });

  const automationCodeHash = await bcrypt.hash('9999', 12);

  await knex('users').insert({
    id: '99999999-9999-9999-9999-999999999999',
    name: 'automation',
    role: 'automation',
    access_code_hash: automationCodeHash,
    messaging_id: 'AUTOMATION',
  });

  await knex('app_config').insert([
    {
      key: 'weather_zip_code',
      value: JSON.stringify('80227'),                    // Must be valid JSON
      description: 'Zip code for weather in daily summary',
      active: true,
    },
    {
      key: 'default_calendar',
      value: JSON.stringify('Family Calendar'),
      description: 'Default calendar name',
      active: true,
    },
    {
      key: 'webhook_secret',
      value: JSON.stringify('change_this_to_a_strong_secret_please'),
      description: 'Secret for device webhooks',
      active: true,
    },
  ]);

  console.log('✅ Home AI initial schema migration completed.');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('log');
  await knex.schema.dropTableIfExists('audit');
  await knex.schema.dropTableIfExists('ai_audit');
  await knex.schema.dropTableIfExists('ingredients');
  await knex.schema.dropTableIfExists('recipes');
  await knex.schema.dropTableIfExists('conversation_states');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('task_requests');
  await knex.schema.dropTableIfExists('facts');
  await knex.schema.dropTableIfExists('devices');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('app_config');
  await knex.schema.dropTableIfExists('users');
}