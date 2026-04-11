import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';

export interface UserRecord {
  user_id: string;
  name: string;
  role: string;
  messaging_id?: string;
  quiet_start?: string | null;
  quiet_end?: string | null;
  created_at?: Date;
}

@Injectable()
export class UsersService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async createUser(userData: {
    user_id: string;
    name: string;
    role: string;
    messaging_id?: string;
  }): Promise<UserRecord> {
    const [user] = await this.knex('users')
      .insert({
        user_id: userData.user_id,
        name: userData.name,
        role: userData.role,
        messaging_id: userData.messaging_id,
      })
      .returning('*');

    return user;
  }

  async findAll(): Promise<UserRecord[]> {
    return this.knex('users').select('*');
  }

  async findOne(user_id: string): Promise<UserRecord | null> {
    return this.knex('users')
      .where('user_id', user_id)
      .first<UserRecord>();
  }

  /**
   * Resolve a caller-supplied string that may be either `users.user_id` or `users.messaging_id` (exact match on either).
   */
  async findByUserIdOrHandle(value: string): Promise<UserRecord | null> {
    if (!value?.trim()) return null;

    const v = value.trim();

    return this.knex('users')
      .where((qb) => {
        qb.where('user_id', v).orWhere('messaging_id', v);
      })
      .first<UserRecord>();
  }

  async updateUser(user_id: string, updates: Partial<UserRecord>): Promise<UserRecord | null> {
    const [user] = await this.knex('users')
      .where('user_id', user_id)
      .update(updates)
      .returning('*');

    return user || null;
  }
}