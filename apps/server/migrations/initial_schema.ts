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

  // 4. Task Requests (combined request + approval + history)
  await knex.schema.createTable('task_requests', (table) => {
    table.bigIncrements('request_id').primary();
    table.string('task_name').references('task_name').inTable('tasks').onDelete('CASCADE');
    table.string('requester_user_id').references('user_id').inTable('users');
    table.string('executor_user_id').references('user_id').inTable('users');
    table.jsonb('parameters');
    table.text('raw_message');
    table.jsonb('attachments');
    table.string('status').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
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

  console.log('✅ Initial schema migration completed.');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ai_audit');
  await knex.schema.dropTableIfExists('facts');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('task_requests');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('config');
  await knex.schema.dropTableIfExists('users');
}