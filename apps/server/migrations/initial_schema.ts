import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Users
  await knex.schema.createTable('users', (table) => {
    table.string('user_id').primary();
    table.string('name').notNullable();
    table.string('role').notNullable();           // admin, parent, child, guest, readonly, automation
    table.string('messaging_id');
    table.string('access_code_hash');
    table.time('quiet_start');
    table.time('quiet_end');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 2. Config (key-value store)
  await knex.schema.createTable('config', (table) => {
    table.string('key').primary();
    table.text('value');
    table.text('description');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 3. Tasks
  await knex.schema.createTable('tasks', (table) => {
    table.string('task_name').primary();
    table.text('description').notNullable();
    table.text('request_roles');
    table.text('execute_roles').notNullable();
    table.text('notify_roles');
    table.string('action_type').notNullable();
    table.jsonb('parameters_schema');
    table.string('target');
    table.boolean('enabled').defaultTo(true);
  });

    // 4. Task Requests (consolidated for user tasks + device events)
    await knex.schema.createTable('task_requests', (table) => {
      table.bigIncrements('request_id').primary();
      table.string('task_name').references('task_name').inTable('tasks').onDelete('CASCADE');
      table.string('requester_user_id').references('user_id').inTable('users');
      table.string('executor_user_id').references('user_id').inTable('users');
      table.jsonb('parameters');
      table.text('raw_message');
      table.jsonb('attachments');
  
      table.string('status').notNullable();
  
      // Device-related fields
      table.string('source_type').defaultTo('user');
      table.string('device_id_slug').nullable();
      table.string('event_type').nullable();
      table.jsonb('device_metadata').nullable();
  
      // Approval & quiet hours
      table.boolean('requires_approval').defaultTo(false);
      table.string('approved_by_user_id').nullable().references('user_id').inTable('users');
      table.timestamp('approved_at').nullable();
  
      table.boolean('quiet_hours_queued').defaultTo(false);
      table.timestamp('scheduled_for').nullable();
  
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('executed_at');
      table.text('notes');
    });

  // 5. Notifications
  await knex.schema.createTable('notifications', (table) => {
    table.bigIncrements('notification_id').primary();
    table.string('recipient_user_id').references('user_id').inTable('users');
    table.bigInteger('task_request_id').references('request_id').inTable('task_requests');
    table.text('message_text').notNullable();
    table.string('status').defaultTo('pending');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('scheduled_send_after');
    table.timestamp('sent_at');
    table.text('notes');
  });

  // 6. Facts (memory)
  await knex.schema.createTable('facts', (table) => {
    table.bigIncrements('fact_id').primary();
    table.string('key').notNullable().unique();
    table.text('value').notNullable();
    table.string('owner_user_id').references('user_id').inTable('users');
    table.text('visibility_roles');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 7. AI Audit (full logging)
  await knex.schema.createTable('ai_audit', (table) => {
    table.bigIncrements('audit_id').primary();
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    table.string('event_type').notNullable();
    table.string('user_id').references('user_id').inTable('users');
    table.string('user_role');
    table.bigInteger('task_request_id').references('request_id').inTable('task_requests');
    table.string('task_name');
    table.text('raw_input');
    table.text('model_input');
    table.text('model_output');
    table.jsonb('extracted_parameters');
    table.string('action');
    table.string('status');
    table.text('result');
    table.integer('latency_ms');
    table.jsonb('metadata');
    table.text('notes');
  });

  // Indexes for performance
  await knex.schema.table('ai_audit', (table) => {
    table.index(['timestamp'], 'idx_ai_audit_timestamp');
    table.index(['user_id'], 'idx_ai_audit_user_id');
    table.index(['event_type'], 'idx_ai_audit_event_type');
    table.index(['task_request_id'], 'idx_ai_audit_task_request_id');
  });

  await knex.schema.createTable('conversation_states', (table) => {
    table.increments('id').primary();

    // Core identification
    table.string('chat_guid', 255).notNullable().unique();
    table.string('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');

    // Task & clarification state
    table.string('current_task_type', 100);
    table.jsonb('pending_parameters').defaultTo('{}');
    table.text('clarification_question');
    table.text('last_ai_message');

    // Link back to real task once complete
    table.bigInteger('related_task_request_id').references('request_id').inTable('task_requests').onDelete('SET NULL');

    // Metadata
    table.text('conversation_summary');
    table.string('status', 50).defaultTo('active');

    table.timestamp('last_activity_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Add CHECK constraint separately (more reliable across Knex versions)
  await knex.schema.raw(`
    ALTER TABLE conversation_states 
    ADD CONSTRAINT chk_conversation_states_status 
    CHECK (status IN ('active', 'completed', 'abandoned', 'expired'));
  `);

  // Performance indexes for fast webhook lookups
  await knex.schema.raw('CREATE INDEX idx_conversation_states_chat_guid ON conversation_states(chat_guid);');
  await knex.schema.raw('CREATE INDEX idx_conversation_states_user_id ON conversation_states(user_id);');
  await knex.schema.raw('CREATE INDEX idx_conversation_states_related_task ON conversation_states(related_task_request_id);');
  await knex.schema.raw('CREATE INDEX idx_conversation_states_last_activity ON conversation_states(last_activity_at DESC);');

  await knex.schema.createTable('devices', (table) => {
    table.bigIncrements('device_id').primary();

    // Core identification - user-defined, fully dynamic
    table.string('device_id_slug', 100).notNullable().unique();   // e.g. "litter_robot_main", "samsung_washer"
    table.string('device_type', 100).notNullable();               // e.g. "litter_robot", "samsung_appliance", "generic_sensor"
    table.string('friendly_name').notNullable();                  // e.g. "Main Litter Robot"

    // Link to Home Assistant
    table.string('ha_entity_id').nullable();                      // e.g. "sensor.litter_robot_waste_drawer_level"
    table.string('ha_device_id').nullable();                      // HA device registry ID if available

    // Rules for how the AI should handle events from this device
    table.jsonb('notification_guidance').defaultTo('{}');         // Main config for AI behavior

    // What events this device can produce
    table.jsonb('event_types').defaultTo('[]');                   // e.g. ["waste_drawer_full", "cycle_complete"]

    // Ownership & permissions
    table.string('owner_user_id').references('user_id').inTable('users');
    table.text('visible_to_roles');                               // e.g. "parent,child"

    // Metadata
    table.boolean('enabled').defaultTo(true);
    table.timestamp('last_seen_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Indexes for performance
  await knex.schema.raw('CREATE INDEX idx_devices_device_id_slug ON devices(device_id_slug);');
  await knex.schema.raw('CREATE INDEX idx_devices_device_type ON devices(device_type);');
  await knex.schema.raw('CREATE INDEX idx_devices_ha_entity_id ON devices(ha_entity_id);');
  await knex.schema.raw('CREATE INDEX idx_devices_owner_user_id ON devices(owner_user_id);');
  

  console.log('✅ Initial schema migration completed.');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('devices');
  await knex.schema.dropTableIfExists('conversation_states');
  await knex.schema.dropTableIfExists('ai_audit');
  await knex.schema.dropTableIfExists('facts');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('task_requests');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('config');
  await knex.schema.dropTableIfExists('users');
}