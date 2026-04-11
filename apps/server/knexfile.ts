import type { Knex } from 'knex';
import * as dotenv from 'dotenv';

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'aiadmin',
      password: process.env.DB_PASSWORD || 'aihome_secure_2026',
      database: process.env.DB_NAME || 'aihome',
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
      extension: 'ts',
      loadExtensions: ['.ts'],
    },
    seeds: {
      directory: './seeds',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};

export default config;