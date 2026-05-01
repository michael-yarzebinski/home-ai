import { Insertable, Updatable } from '../helper/crud.helper';
import { z } from 'zod';

export const ChatSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  summary: z.string().optional(),
  lastActivity: z.date(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ChatSession = z.infer<typeof ChatSessionSchema>;
export type InsertableChatSession = Insertable<ChatSession> & { id: string };
export type UpdatableChatSession = Updatable<ChatSession>;
