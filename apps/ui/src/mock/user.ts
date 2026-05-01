import type { User } from '@home-ai/shared/domain/user/user';
import { Role } from '@home-ai/shared/domain/role/role';

export { Role };

export const MOCK_USER: User = {
  id: 'usr_mock_001',
  role: Role.ADMIN,
  name: 'Home Admin',
  phoneNumber: '+15555550100',
  accessCodeHash: '$2b$10$mockhashvalue',
  timezone: 'America/Chicago',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  active: true,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2026-04-01T00:00:00Z'),
};

/** Roles that can review and act on pending actions */
export const PENDING_ACTIONS_ROLES: Role[] = [Role.ADMIN, Role.PARENT];

export const MOCK_PENDING_ACTIONS_COUNT = 3;
