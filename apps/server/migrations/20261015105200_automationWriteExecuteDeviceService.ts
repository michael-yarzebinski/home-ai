import type { Knex } from "knex";

const TOOL = "execute-device-service";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    `
    UPDATE tools
    SET write_roles = write_roles || '["automation"]'::jsonb
    WHERE name = ?
      AND NOT write_roles @> '["automation"]'::jsonb
    `,
    [TOOL],
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    `
    UPDATE tools
    SET write_roles = (
      SELECT COALESCE(jsonb_agg(role), '[]'::jsonb)
      FROM jsonb_array_elements_text(write_roles) AS role
      WHERE role <> 'automation'
    )
    WHERE name = ?
    `,
    [TOOL],
  );
}
