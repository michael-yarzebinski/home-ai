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
    { key: 'weather_zip_code', value: '90210', description: 'Zip code for weather in daily summary' },
    { key: 'default_calendar', value: 'Family Calendar', description: 'Default calendar name' },
    { key: 'webhook_secret', value: 'change_this_to_a_strong_secret_please', description: 'Secret for device webhooks' },
  ]);

  // 4. Core Tasks (with your requested roles)
  await knex('tasks').insert([
    // Grocery / Checklist Tasks
    {
      task_name: 'add_to_grocery_list',
      description: 'Add item to the Grocery List note in Apple Notes',
      request_roles: 'child,parent,automation',
      execute_roles: 'parent,automation',
      notify_roles: 'parent',
      action_type: 'apple_notes',
      target: 'Grocery List',
      parameters_schema: JSON.stringify({ item: 'string', quantity: 'string?' }),
      enabled: true,
    },
    {
      task_name: 'add_to_short_term_list',
      description: 'Add item to the Short Term / This Week list',
      request_roles: 'child,parent,automation',
      execute_roles: 'parent,automation',
      notify_roles: 'parent',
      action_type: 'apple_notes',
      target: 'Short Term List',
      parameters_schema: JSON.stringify({ item: 'string' }),
      enabled: true,
    },
    {
      task_name: 'add_to_long_term_list',
      description: 'Add item to the Long Term / Someday list',
      request_roles: 'child,parent,automation',
      execute_roles: 'parent,automation',
      notify_roles: 'parent',
      action_type: 'apple_notes',
      target: 'Long Term List',
      parameters_schema: JSON.stringify({ item: 'string' }),
      enabled: true,
    },

    // Calendar
    {
      task_name: 'add_calendar_event',
      description: 'Add a new event to the family calendar',
      request_roles: 'child,parent,automation',
      execute_roles: 'parent,admin',
      notify_roles: 'parent',
      action_type: 'calendar',
      target: 'Family Calendar',
      parameters_schema: JSON.stringify({ title: 'string', start_time: 'string', duration_minutes: 'number?' }),
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
      enabled: true,
    },

    // Memory / Facts
    {
      task_name: 'store_fact',
      description: 'Remember a fact or preference (e.g. Mike\'s Chipotle order)',
      request_roles: 'parent,child,automation',
      execute_roles: 'parent,automation',
      notify_roles: '',
      action_type: 'store_fact',
      enabled: true,
    },
    {
      task_name: 'retrieve_fact',
      description: 'Recall a stored fact',
      request_roles: 'child,parent,automation,readonly',
      execute_roles: 'child,parent,automation,readonly',
      notify_roles: '',
      action_type: 'retrieve_fact',
      enabled: true,
    },

    // Summaries
    {
      task_name: 'daily_summary',
      description: 'Get today\'s summary: weather, calendar, short term list',
      request_roles: 'child,parent,automation,readonly',
      execute_roles: 'child,parent,automation,readonly',
      notify_roles: '',
      action_type: 'daily_summary',
      enabled: true,
    },
    {
      task_name: 'weekly_recap',
      description: 'Get a weekly recap of tasks and events',
      request_roles: 'child,parent,automation,readonly',
      execute_roles: 'child,parent,automation,readonly',
      notify_roles: '',
      action_type: 'weekly_recap',
      enabled: true,
    },

    // Show pending approvals
    {
      task_name: 'show_pending_approvals',
      description: 'Show tasks waiting for approval',
      request_roles: 'parent,admin',
      execute_roles: 'parent,admin',
      notify_roles: '',
      action_type: 'read_pending',
      enabled: true,
    },
  ]);

  console.log('✅ Initial seed data inserted successfully.');
}