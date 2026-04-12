import { Injectable } from '@nestjs/common';
import { UserStore } from './user.store';
import { User } from './user.domain';

@Injectable()
export class UsersService {
  constructor(private readonly userStore: UserStore) {}

  reader(): Pick<UserStore, 'findById' | 'findAll' | 'findByUserIdOrHandle'> {
    return this.userStore;
  }

  async createUser(userData: {
    userId: string;
    name: string;
    role: string;
    messagingId?: string;
  }): Promise<User> {
    return this.userStore.create({
      userId: userData.userId,
      name: userData.name,
      role: userData.role,
      messagingId: userData.messagingId,
    });
  }

  async findAll(): Promise<User[]> {
    return this.userStore.findAll();
  }

  async findOne(user_id: string): Promise<User | null> {
    return this.userStore.findById(user_id);
  }

  async findByUserIdOrHandle(value: string): Promise<User | null> {
    return this.userStore.findByUserIdOrHandle(value);
  }

  async updateUser(user_id: string, updates: Partial<User>): Promise<User> {
    return this.userStore.update(user_id, updates);
  }
}
