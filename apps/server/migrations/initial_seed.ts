import { Knex } from "knex";
import * as bcrypt from "bcrypt";

type SeedUser = {
  role: string;
  name: string;
  phone_number: string;
  access_code: string;
  timezone: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
};

const ADMIN_USERS: SeedUser[] = [
  {
    role: "admin",
    name: "Mike",
    phone_number: "+12693305754",
    access_code: "0000",
    timezone: "America/Denver",
    quiet_hours_start: "23:00:00",
    quiet_hours_end: "07:00:00",
  },
  {
    role: "parent",
    name: "Amy",
    phone_number: "+9892922071",
    access_code: "80085",
    timezone: "America/Denver",
    quiet_hours_start: "23:00:00",
    quiet_hours_end: "07:00:00",
  },
];

export async function up(knex: Knex): Promise<void> {
  const rows = await Promise.all(
    ADMIN_USERS.map(async (user) => ({
      role: user.role,
      name: user.name,
      phone_number: user.phone_number,
      access_code_hash: await bcrypt.hash(user.access_code, 10),
      timezone: user.timezone,
      quiet_hours_start: user.quiet_hours_start,
      quiet_hours_end: user.quiet_hours_end,
    })),
  );

  await knex("users").insert(rows).onConflict("id").merge({
    role: knex.raw("EXCLUDED.role"),
    name: knex.raw("EXCLUDED.name"),
    phone_number: knex.raw("EXCLUDED.phone_number"),
    access_code_hash: knex.raw("EXCLUDED.access_code_hash"),
    timezone: knex.raw("EXCLUDED.timezone"),
    quiet_hours_start: knex.raw("EXCLUDED.quiet_hours_start"),
    quiet_hours_end: knex.raw("EXCLUDED.quiet_hours_end"),
    active: knex.raw("EXCLUDED.active"),
    updated_at: knex.raw("EXCLUDED.updated_at"),
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex("users").whereIn(
    "name",
    ADMIN_USERS.map((user) => user.name),
  ).del();
}
