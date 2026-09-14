import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE ai_audit
      ALTER COLUMN chat_session_id DROP NOT NULL,
      ALTER COLUMN chat_session_id TYPE text USING chat_session_id::text
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DELETE FROM ai_audit
    WHERE chat_session_id IS NOT NULL
      AND chat_session_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  `);
  await knex.raw(`
    ALTER TABLE ai_audit
      ALTER COLUMN chat_session_id TYPE uuid USING chat_session_id::uuid,
      ALTER COLUMN chat_session_id SET NOT NULL
  `);
}
