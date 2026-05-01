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
    originalROWID?: number;
    guid: string;                        // Unique message identifier
    text?: string | null;                // Message content
    attributedBody?: string | null;
    handle: BlueBubblesHandle;           // Sender information
    handleId?: number;
    otherHandle?: number;
    attachments?: any[];                 // Array of attachment objects (if present)
    subject?: string | null;             // Subject line (for SMS/iMessage)
    error?: number;
    dateCreated: number;                 // Timestamp in milliseconds since epoch
    dateRead?: number | null;
    dateDelivered?: number | null;
    isDelivered?: boolean;
    isFromMe: boolean;                   // True if sent by the BlueBubbles server itself
    hasDdResults?: boolean;
    isArchived?: boolean;
    itemType?: number;
    groupTitle?: string | null;
    groupActionType?: number;
    balloonBundleId?: string | null;
    associatedMessageGuid?: string | null;
    associatedMessageType?: string | null;
    expressiveSendStyleId?: string | null;
    threadOriginatorGuid?: string | null;
    hasPayloadData?: boolean;
    // BlueBubbles payloads can include either "chat" or "chats"
    chat?: BlueBubblesChat;
    chats?: BlueBubblesChat[];
    messageSummaryInfo?: unknown | null;
    payloadData?: unknown | null;
    dateEdited?: number | null;
    dateRetracted?: number | null;
    partCount?: number;
  }
  
  /** Sender / handle information */
  export interface BlueBubblesHandle {
    originalROWID: number;
    address: string;                 // Phone number or email
    service: 'iMessage' | 'SMS';
    uncanonicalizedId?: string;
    country?: string;
  }
  
  /** Chat / conversation information */
  export interface BlueBubblesChat {
    originalROWID?: number;
    guid: string;                    // Unique chat identifier
    style?: number;
    chatIdentifier?: string;
    isArchived?: boolean;
    displayName?: string;            // Group name or contact name
    participants?: string[];         // Array of handles
    isGroup?: boolean;
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