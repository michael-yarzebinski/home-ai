import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class UsersService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async createUser(userData: {
    user_id: string;
    name: string;
    role: string;
    messaging_id?: string;
  }) {
    return this.knex('users').insert({
      user_id: userData.user_id,
      name: userData.name,
      role: userData.role,
      messaging_id: userData.messaging_id,
    }).returning('*');
  }

  async findAll() {
    return this.knex('users').select('*');
  }

  async findOne(user_id: string) {
    return this.knex('users').where('user_id', user_id).first();
  }

  async updateUser(user_id: string, updates: Partial<any>) {
    return this.knex('users')
      .where('user_id', user_id)
      .update(updates)
      .returning('*');
  }
}