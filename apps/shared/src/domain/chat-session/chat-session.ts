import { Insertable, Updatable } from '../helper/crud.helper';

export interface ChatSession {
  id: string;
  userId: string;
  summary?: string;
  lastActivity: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type InsertableChatSession = Insertable<ChatSession> & { id: string };
export type UpdatableChatSession = Updatable<ChatSession>;
