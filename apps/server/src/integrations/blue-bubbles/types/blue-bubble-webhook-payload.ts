// src/integrations/bluebubbles/types/bluebubbles-webhook-payload.ts

export interface BlueBubblesWebhookPayload {
    /** The type of event that triggered the webhook */
    type: BlueBubblesEventType;
  
    /** The main payload data for the event */
    data: BlueBubblesMessageData | BlueBubblesTypingData | BlueBubblesChatUpdateData | any;
  }
  
  /** Common event types sent by BlueBubbles */
  export type BlueBubblesEventType =
    | 'new-message'
    | 'message-update'
    | 'typing'
    | 'chat-read-status-change'
    | 'group-name-change'
    | 'participant-added'
    | 'participant-removed'
    | 'chat-created'
    | 'chat-deleted';
  
  /** Data structure for a new or updated message */
  export interface BlueBubblesMessageData {
    guid: string;                    // Unique message identifier
    text?: string;                   // Message content
    isFromMe: boolean;               // True if sent by the BlueBubbles server itself
    dateCreated: number;             // Timestamp in milliseconds since epoch
    subject?: string | null;         // Subject line (for SMS/iMessage)
    handle: BlueBubblesHandle;       // Sender information
    chat: BlueBubblesChat;           // Chat / conversation information
    attachments?: any[];             // Array of attachment objects (if present)
    expressiveSendStyle?: string;    // iMessage effects (love, slam, etc.)
  }
  
  /** Sender / handle information */
  export interface BlueBubblesHandle {
    originalROWID: number;
    address: string;                 // Phone number or email
    service: 'iMessage' | 'SMS';
    country?: string;
  }
  
  /** Chat / conversation information */
  export interface BlueBubblesChat {
    guid: string;                    // Unique chat identifier
    displayName?: string;            // Group name or contact name
    participants?: string[];         // Array of handles
    isGroup: boolean;
  }
  
  /** Typing indicator data */
  export interface BlueBubblesTypingData {
    chatId: string;
    typing: boolean;
  }
  
  /** Chat read status change */
  export interface BlueBubblesChatUpdateData {
    chatId: string;
    read: boolean;
    lastReadMessageId?: string;
  }