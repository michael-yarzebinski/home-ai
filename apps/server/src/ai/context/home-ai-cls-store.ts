// src/core/context/cls-store.ts
import { ClsStore } from 'nestjs-cls';
import { Role } from '@home-ai/shared/domain/role/role';

export interface HomeAiClsStore extends ClsStore {
  // --- Identity ---
  userId: string;
  userRole: Role;
  userName: string;

  // --- Session Metadata ---
  chatSessionId?: string;
  originalPrompt: string;
  requestDepth: number; // 0 = User, 1+ = Tool Inception

  // --- Environmental Context ---
  currentISO: string;
  timezone: string;
  location?: {
    room?: string;      // "Kitchen", "Living Room"
    coordinates?: string;
  };

  // --- Operational Settings ---
  preferences: {
    units: 'metric' | 'imperial';
    verbosity: 'concise' | 'detailed';
  };
}