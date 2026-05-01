import { z } from 'zod';

export enum Role {
    ADMIN = 'admin',
    PARENT = 'parent',
    CHILD = 'child',
    GUEST = 'guest',
    READONLY = 'readonly',
    AUTOMATION = 'automation',
}

export const RoleSchema = z.nativeEnum(Role);