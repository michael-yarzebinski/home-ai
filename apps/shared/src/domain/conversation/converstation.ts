export interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool"; // Used for the LLMs.
  content: string;
  timestamp: Date;
  toolCallId?: string;
  thoughtSignature?: string;
}

export interface Conversation {
  id: string;
  externalId: string; // e.g., BlueBubbles chat.guid
  userId: string;
  messages: ChatMessage[];
  lastActivity: Date;
  isActive: boolean;
  summary?: string;
}
