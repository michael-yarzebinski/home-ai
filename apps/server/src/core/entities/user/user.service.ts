import { BadRequestException, Injectable } from '@nestjs/common';
import { UserStore } from './user.store';
import { User } from './user.domain';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly userStore: UserStore) { }

  reader(): Pick<UserStore, 'getAll' | 'getAllActive' | 'getById' | 'getByUserIdOrMessagingId' | 'getByRoles'> {
    return this.userStore;
  }

  async createUser(data: Partial<User> & { accessCode: string }): Promise<User> {
    if (data.accessCode.length <= 4) {
      throw new BadRequestException('Access code must be at least 4 characters long');
    }

    const accessCodeHash = await bcrypt.hash(data.accessCode, 12);

    // Remove plain accessCode before passing to store (never store plain text)
    const createData = { ...data };
    delete (createData as any).accessCode;

    return this.userStore.create({
      ...createData,
      accessCodeHash,
      active: true,
    });
  }

  async verifyAccessCode(userId: string, providedCode: string): Promise<boolean> {
    const user = await this.userStore.getById(userId);

    if (!user?.accessCodeHash) {
      return false;
    }

    return bcrypt.compare(providedCode, user.accessCodeHash);
  }

  async updateUser(id: string, updates: Partial<User & { accessCode?: string }>): Promise<User> {
    const updateData = { ...updates };

    // If a new access code is provided, hash it
    if (updates.accessCode) {
      if (updates.accessCode.length < 4) {
        throw new BadRequestException('Access code must be at least 4 characters long');
      }
      updateData.accessCodeHash = await bcrypt.hash(updates.accessCode, 12);
      delete (updateData as any).accessCode;   // Never store plain text
    }

    return this.userStore.update(id, updateData);
  }

  async setUserActive(id: string, active: boolean): Promise<User> {
    return this.userStore.setActive(id, active);
  }
}
