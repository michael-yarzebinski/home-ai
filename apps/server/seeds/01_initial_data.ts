import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data (for development resets)
  await knex('ai_audit').del();
  await knex('audit').del();
  await knex('notifications').del();
  await knex('task_requests').del();
  await knex('devices').del()
  await knex('facts').del();
  await knex('users').del();
  await knex('app_config').del();

  // 1. Default Admin User
  await knex('users').insert({
    id: '00000000-0000-0000-0000-000000000000',
    name: 'System Admin',
    role: 'admin',
    messaging_id: '', // You can add your iMessage number later via Admin UI
  });


  // 3. Config Settings
  await knex('app_config').insert([
    { key: 'weather_zip_code', value: '80227', description: 'Zip code for weather in daily summary' },
    { key: 'default_calendar', value: 'Family Calendar', description: 'Default calendar name' },
    { key: 'webhook_secret', value: 'change_this_to_a_strong_secret_please', description: 'Secret for device webhooks' },
  ]);
  
  console.log('✅ Initial seed data inserted successfully.');
}