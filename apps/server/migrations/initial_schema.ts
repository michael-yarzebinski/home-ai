import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Users
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('name').notNullable();
    table.string('role').notNullable();           // admin, parent, child, guest, readonly, automation
    table.string('messaging_id');
    table.string('access_code_hash');
    table.time('quiet_start');
    table.time('quiet_end');
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 2. Config (key-value store)
  await knex.schema.createTable('app_config', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('key').primary();
    table.text('value');
    table.text('description');
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
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
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

    // 4. Task Requests (consolidated for user tasks + device events)
    await knex.schema.createTable('task_requests', (table) => {
      table.bigIncrements('id').primary();
      table.string('task_name').references('task_name').inTable('tasks');
      table.uuid('requester_user_id').references('id').inTable('users');
      table.uuid('executor_user_id').references('id').inTable('users');
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
      table.uuid('approved_by_user_id').nullable().references('id').inTable('users');
      table.timestamp('approved_at').nullable();
  
      table.boolean('quiet_hours_queued').defaultTo(false);
      table.timestamp('scheduled_for').nullable();
      table.timestamp('executed_at');
      table.text('notes');
  
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

  // 5. Notifications
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('recipient_user_id').references('id').inTable('users');
    table.bigInteger('task_request_id').references('id').inTable('task_requests');
    table.text('message_text').notNullable();
    table.string('status').defaultTo('pending');
    table.timestamp('scheduled_send_after');
    table.timestamp('sent_at');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 6. Facts (memory)
  await knex.schema.createTable('facts', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('key').notNullable().unique();
    table.text('value').notNullable();
    table.uuid('owner_user_id').references('id').inTable('users');
    table.text('visibility_roles');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 7. AI Audit (full logging)
  await knex.schema.createTable('ai_audit', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());           // Use UUID as primary key (recommended)
    table.timestamp('timestamp').defaultTo(knex.fn.now()).notNullable();
    
    table.string('event_type').notNullable();                       // e.g. 'task_detection', 'llm_call', 'clarification'
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');

    table.bigInteger('task_request_id')
    .nullable()
    .references('id')
    .inTable('task_requests');

    table.string('task_name');                                      // e.g. 'addDevice', 'queryDevice'

    table.text('model_input');                                      // Raw prompt sent to LLM
    table.text('model_output');                                     // Raw response from LLM
    
    table.integer('latency_ms');                                    // Optional: how long the LLM call took

    table.jsonb('metadata').defaultTo('{}');                        // Flexible metadata (confidence, resolved entities, etc.)
    table.text('notes');                                            // Optional human-readable notes

    // Indexes for performance
    table.index(['user_id', 'timestamp']);
    table.index(['task_request_id']);
    table.index(['event_type', 'timestamp']);
  });

  await knex.schema.createTable('audit', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());           // Use UUID as primary key (recommended)

    table.timestamp('timestamp').defaultTo(knex.fn.now()).notNullable();

    table.string('entity_type').notNullable();           // e.g. 'device', 'task', 'user'
    table.string('entity_id').notNullable();             // ID as string for flexibility

    table.string('action').notNullable();                // CREATE, UPDATE, DELETE

    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');

    table.jsonb('changes').nullable();                   // { old: {...}, new: {...} }
    table.jsonb('metadata').defaultTo('{}');             // Flexible extra data
    table.text('notes');                                 // Optional human-readable notes

    // Performance indexes
    table.index(['entity_type', 'entity_id', 'timestamp']);
    table.index(['user_id', 'timestamp']);
    table.index(['action', 'timestamp']);
  });

  await knex.schema.createTable('conversation_states', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());

    // Core identification
    table.uuid('chat_guid').notNullable().unique();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    // Task & clarification state
    table.string('current_task_type', 100);
    table.jsonb('pending_parameters').defaultTo('{}');
    table.text('clarification_question');
    table.text('last_ai_message');

    // Link back to real task once complete
    table.bigIncrements('related_task_request_id').references('id').inTable('task_requests').onDelete('SET NULL');

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
    table.uuid('id').primary().defaultTo(knex.fn.uuid());

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
    table.uuid('owner_user_id').references('id').inTable('users');
    table.text('visible_to_roles');                               // e.g. "parent,child"

    // Metadata
    table.boolean('enabled').defaultTo(true);
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Indexes for performance
  await knex.schema.raw('CREATE INDEX idx_devices_device_id_slug ON devices(device_id_slug);');
  await knex.schema.raw('CREATE INDEX idx_devices_device_type ON devices(device_type);');
  await knex.schema.raw('CREATE INDEX idx_devices_ha_entity_id ON devices(ha_entity_id);');
  await knex.schema.raw('CREATE INDEX idx_devices_owner_user_id ON devices(owner_user_id);');
  

  await knex.schema.createTable('log', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('severity', 100).nullable();
    table.text('message').nullable();
    table.jsonb('data').nullable();
    table.uuid('userId').nullable();
  });

  // Add Tasks
  await knex('tasks').insert([
    // === Grocery / Checklist Tasks ===
    {
      task_name: 'addToGroceryList',
      description: 'Add one or more items to the Grocery List note in Apple Notes',
      request_roles: 'child,parent,automation',
      execute_roles: 'parent,automation',
      notify_roles: 'parent',
      action_type: 'apple_notes',
      target: 'Grocery List',
      parameters_schema: JSON.stringify({
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                item: { type: 'string', description: 'Name of the grocery item (e.g. "milk", "bananas")' },
                quantity: { type: 'string', description: 'Optional quantity (e.g. "2 liters", "1 dozen")' },
              },
              required: ['item'],
              additionalProperties: false,
            },
            description: 'List of items to add (supports multiple items)',
          },
        },
        required: ['items'],
        additionalProperties: false,
      }),
      enabled: true,
    },
  
    {
      task_name: 'addToShortTermList',
      description: 'Add one or more items to the Short Term / This Week list',
      request_roles: 'child,parent,automation',
      execute_roles: 'parent,automation',
      notify_roles: 'parent',
      action_type: 'apple_notes',
      target: 'Short Term List',
      parameters_schema: JSON.stringify({
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'string', description: 'Item to add to the short-term list' },
            description: 'List of items (supports multiple)',
          },
        },
        required: ['items'],
        additionalProperties: false,
      }),
      enabled: true,
    },
  
    {
      task_name: 'addToLongTermList',
      description: 'Add one or more items to the Long Term / Someday list',
      request_roles: 'child,parent,automation',
      execute_roles: 'parent,automation',
      notify_roles: 'parent',
      action_type: 'apple_notes',
      target: 'Long Term List',
      parameters_schema: JSON.stringify({
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'string', description: 'Item to add to the long-term list' },
            description: 'List of items (supports multiple)',
          },
        },
        required: ['items'],
        additionalProperties: false,
      }),
      enabled: true,
    },
  
    // === Calendar Tasks ===
    {
      task_name: 'addCalendarEvent',
      description: 'Add a new event to the family calendar',
      request_roles: 'child,parent,automation',
      execute_roles: 'parent,admin',
      notify_roles: 'parent',
      action_type: 'calendar',
      target: 'Family Calendar',
      parameters_schema: JSON.stringify({
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Event title (e.g. "Soccer practice", "Doctor appointment")' },
          startTime: { type: 'string', description: 'Start time - ISO string or natural language (e.g. "tomorrow at 4pm", "2026-04-15T15:00")' },
          durationMinutes: { type: 'number', description: 'Duration in minutes (optional, defaults to 60)' },
          location: { type: 'string', description: 'Optional location (e.g. "Backyard", "School field")' },
          attendees: { 
            type: 'array', 
            items: { type: 'string' }, 
            description: 'Optional list of attendee names' 
          },
        },
        required: ['title', 'startTime'],
        additionalProperties: false,
      }),
      enabled: true,
    },
  
    {
      task_name: 'readCalendar',
      description: 'Read upcoming events from the family calendar',
      request_roles: 'child,parent,automation,readonly',
      execute_roles: 'child,parent,automation,readonly',
      notify_roles: '',
      action_type: 'read_calendar',
      target: 'Family Calendar',
      parameters_schema: JSON.stringify({
        type: 'object',
        properties: {
          daysAhead: { 
            type: 'number', 
            description: 'Number of days to look ahead (optional, default 7)' 
          },
        },
        additionalProperties: false,
      }),
      enabled: true,
    },
  
    // === Memory / Facts ===
    {
      task_name: 'storeFact',
      description: 'Remember a fact or preference (e.g. Mike\'s Chipotle order)',
      request_roles: 'parent,child,automation',
      execute_roles: 'parent,automation',
      notify_roles: '',
      action_type: 'store_fact',
      parameters_schema: JSON.stringify({
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Short identifier for the fact (e.g. "mikeChipotleOrder")' },
          value: { type: 'string', description: 'The actual fact or preference to remember' },
          category: { type: 'string', description: 'Optional category (e.g. "food", "preferences")' },
        },
        required: ['key', 'value'],
        additionalProperties: false,
      }),
      enabled: true,
    },
  
    {
      task_name: 'retrieveFact',
      description: 'Recall a stored fact',
      request_roles: 'child,parent,automation,readonly',
      execute_roles: 'child,parent,automation,readonly',
      notify_roles: '',
      action_type: 'retrieve_fact',
      parameters_schema: JSON.stringify({
        type: 'object',
        properties: {
          key: { type: 'string', description: 'The key of the fact to retrieve' },
        },
        required: ['key'],
        additionalProperties: false,
      }),
      enabled: true,
    },
  
    // === Summaries ===
    {
      task_name: 'dailySummary',
      description: 'Get today\'s summary: weather, calendar, short term list',
      request_roles: 'child,parent,automation,readonly',
      execute_roles: 'child,parent,automation,readonly',
      notify_roles: '',
      action_type: 'daily_summary',
      parameters_schema: JSON.stringify({
        type: 'object',
        properties: {},
        additionalProperties: false,
      }),
      enabled: true,
    },
  
    {
      task_name: 'weeklyRecap',
      description: 'Get a weekly recap of tasks and events',
      request_roles: 'child,parent,automation,readonly',
      execute_roles: 'child,parent,automation,readonly',
      notify_roles: '',
      action_type: 'weekly_recap',
      parameters_schema: JSON.stringify({
        type: 'object',
        properties: {},
        additionalProperties: false,
      }),
      enabled: true,
    },
  
    {
      task_name: 'showPendingApprovals',
      description: 'Show tasks waiting for approval',
      request_roles: 'parent,admin',
      execute_roles: 'parent,admin',
      notify_roles: '',
      action_type: 'read_pending',
      parameters_schema: JSON.stringify({
        type: 'object',
        properties: {},
        additionalProperties: false,
      }),
      enabled: true,
    },
  
    // === Device Management ===
    {
      task_name: 'addDevice',
      description: 'Add a new device to the ai-home system (Litter-Robot, washer, sensor, etc.)',
      request_roles: 'parent,admin',
      execute_roles: 'admin',
      notify_roles: 'parent,admin',
      action_type: 'add_device',
      parameters_schema: JSON.stringify({
        type: 'object',
        properties: {
          deviceIdSlug: { 
            type: 'string', 
            description: 'Unique slug identifier (e.g. "litterRobotMain", "washerKitchen")' 
          },
          deviceType: { 
            type: 'string', 
            description: 'Type of device (e.g. "litterRobot", "washer", "sensor", "camera")' 
          },
          friendlyName: { 
            type: 'string', 
            description: 'Human-readable name shown to users (e.g. "Main Litter Robot")' 
          },
          haEntityId: { 
            type: 'string', 
            description: 'Optional Home Assistant entity ID (e.g. "sensor.litter_robot_waste_drawer")' 
          },
          notificationGuidance: {
            type: 'object',
            description: 'Optional initial notification rules (e.g. quiet hours, who to notify)',
            additionalProperties: true,
          },
        },
        required: ['deviceIdSlug', 'deviceType', 'friendlyName'],
        additionalProperties: false,
      }),
      enabled: true,
    },
    {
      task_name: 'queryDevice',
      description: 'Query the state of any device (temperature, status, battery level, etc.)',
      request_roles: 'child,parent,automation,readonly',
      execute_roles: 'child,parent,automation,readonly',
      notify_roles: 'parent',
      action_type: 'query_device',
      parameters_schema: JSON.stringify({
        type: 'object',
        properties: {
          query: { 
            type: 'string', 
            description: 'Natural language question about a device (e.g. "what is the temperature in the house?", "is the litter robot full?")' 
          },
          deviceTypeHint: { 
            type: 'string', 
            description: 'Optional hint to help identify the device (e.g. "thermostat", "litter robot")' 
          },
        },
        required: ['query'],
        additionalProperties: false,
      }),
      enabled: true,
    },
  ]);

  console.log('✅ Initial schema migration completed.');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('log');
  await knex.schema.dropTableIfExists('devices');
  await knex.schema.dropTableIfExists('conversation_states');
  await knex.schema.dropTableIfExists('ai_audit');
  await knex.schema.dropTableIfExists('audit');
  await knex.schema.dropTableIfExists('facts');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('task_requests');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('app_config');
  await knex.schema.dropTableIfExists('users');
}