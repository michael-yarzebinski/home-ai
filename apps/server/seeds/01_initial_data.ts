import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data (for development resets)
  await knex('ai_audit').del();
  await knex('notifications').del();
  await knex('task_requests').del();
  await knex('facts').del();
  await knex('tasks').del();
  await knex('users').del();
  await knex('config').del();

  // 1. Default Admin User
  await knex('users').insert({
    user_id: 'admin',
    name: 'System Admin',
    role: 'admin',
    messaging_id: '', // You can add your iMessage number later via Admin UI
  });

  // 2. Example Family Users
  await knex('users').insert([
    {
      user_id: 'parent1',
      name: 'Sarah',
      role: 'parent',
      messaging_id: '+15551234567',
    },
    {
      user_id: 'child1',
      name: 'Alex',
      role: 'child',
      messaging_id: '+15559876543',
    },
    {
      user_id: 'automation',
      name: 'Home Automation',
      role: 'automation',
      messaging_id: 'system:automation',
    },
  ]);

  // 3. Config Settings
  await knex('config').insert([
    { key: 'weather_zip_code', value: '80227', description: 'Zip code for weather in daily summary' },
    { key: 'default_calendar', value: 'Family Calendar', description: 'Default calendar name' },
    { key: 'webhook_secret', value: 'change_this_to_a_strong_secret_please', description: 'Secret for device webhooks' },
  ]);

  

// 4. Core Tasks – with rich, LLM-friendly parameters_schema
await knex('tasks').insert([
  // === Grocery / Checklist Tasks ===
  {
    task_name: 'add_to_grocery_list',
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
    task_name: 'add_to_short_term_list',
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
    task_name: 'add_to_long_term_list',
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
    task_name: 'add_calendar_event',
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
        start_time: { type: 'string', description: 'Start time - ISO string or natural language (e.g. "tomorrow at 4pm", "2026-04-15T15:00")' },
        duration_minutes: { type: 'number', description: 'Duration in minutes (optional, defaults to 60)' },
        location: { type: 'string', description: 'Optional location (e.g. "Backyard", "School field")' },
        attendees: { 
          type: 'array', 
          items: { type: 'string' }, 
          description: 'Optional list of attendee names' 
        },
      },
      required: ['title', 'start_time'],
      additionalProperties: false,
    }),
    enabled: true,
  },

  {
    task_name: 'read_calendar',
    description: 'Read upcoming events from the family calendar',
    request_roles: 'child,parent,automation,readonly',
    execute_roles: 'child,parent,automation,readonly',
    notify_roles: '',
    action_type: 'read_calendar',
    target: 'Family Calendar',
    parameters_schema: JSON.stringify({
      type: 'object',
      properties: {
        days_ahead: { 
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
    task_name: 'store_fact',
    description: 'Remember a fact or preference (e.g. Mike\'s Chipotle order)',
    request_roles: 'parent,child,automation',
    execute_roles: 'parent,automation',
    notify_roles: '',
    action_type: 'store_fact',
    parameters_schema: JSON.stringify({
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Short identifier for the fact (e.g. "mike_chipotle_order")' },
        value: { type: 'string', description: 'The actual fact or preference to remember' },
        category: { type: 'string', description: 'Optional category (e.g. "food", "preferences")' },
      },
      required: ['key', 'value'],
      additionalProperties: false,
    }),
    enabled: true,
  },

  {
    task_name: 'retrieve_fact',
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
    task_name: 'daily_summary',
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
    task_name: 'weekly_recap',
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
    task_name: 'show_pending_approvals',
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
    task_name: 'add_device',
    description: 'Add a new device to the ai-home system (Litter-Robot, washer, sensor, etc.)',
    request_roles: 'parent,admin',
    execute_roles: 'admin',
    notify_roles: 'parent,admin',
    action_type: 'add_device',
    parameters_schema: JSON.stringify({
      type: 'object',
      properties: {
        device_id_slug: { 
          type: 'string', 
          description: 'Unique slug identifier (e.g. "litter_robot_main", "washer_kitchen")' 
        },
        device_type: { 
          type: 'string', 
          description: 'Type of device (e.g. "litter_robot", "washer", "sensor", "camera")' 
        },
        friendly_name: { 
          type: 'string', 
          description: 'Human-readable name shown to users (e.g. "Main Litter Robot")' 
        },
        ha_entity_id: { 
          type: 'string', 
          description: 'Optional Home Assistant entity ID (e.g. "sensor.litter_robot_waste_drawer")' 
        },
        notification_guidance: {
          type: 'object',
          description: 'Optional initial notification rules (e.g. quiet hours, who to notify)',
          additionalProperties: true,
        },
      },
      required: ['device_id_slug', 'device_type', 'friendly_name'],
      additionalProperties: false,
    }),
    enabled: true,
  },
]);
  console.log('✅ Initial seed data inserted successfully.');
}