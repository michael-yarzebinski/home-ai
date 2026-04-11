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

  async updateUser(user_id: string, updates: Partial<UserRecord>): Promise<UserRecord | null> {
    const [user] = await this.knex('users')
      .where('user_id', user_id)
      .update(updates)
      .returning('*');

    return user || null;
  }

  /**
   * Lookup user by messaging handle (BlueBubbles handle / phone / email)
   * Used by webhook to map incoming iMessage to a user_id
   */
  async findByMessagingHandle(handle: string): Promise<UserRecord | null> {
    if (!handle) return null;

    // Exact match first (most common case)
    let user = await this.knex('users')
      .where('messaging_id', handle)
      .first<UserRecord>();

    // Fallback: case-insensitive partial match (helpful during testing/setup)
    if (!user) {
      user = await this.knex('users')
        .whereILike('messaging_id', `%${handle}%`)
        .first<UserRecord>();
    }

    return user || null;
  }
}