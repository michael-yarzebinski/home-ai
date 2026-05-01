import { z } from 'zod';

export enum LLMRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  TOOL = 'tool',
}

export const ChatMessageSchema = z.object({
  role: z.nativeEnum(LLMRole), // Used for the LLMs.
  content: z.string(),
  timestamp: z.date(),
  toolCallId: z.string().optional(),
  thoughtSignature: z.string().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ConversationSchema = z.object({
  id: z.string(),
  externalId: z.string(), // e.g., BlueBubbles chat.guid
  userId: z.string(),
  messages: z.array(ChatMessageSchema),
  lastActivity: z.date(),
  isActive: z.boolean(),
  summary: z.string().optional(),
});

export type Conversation = z.infer<typeof ConversationSchema>;
