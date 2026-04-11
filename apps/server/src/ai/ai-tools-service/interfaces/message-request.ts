export enum MessageSource {
  IMESSAGE = 'imessage',
  DEVICE = 'device',
  CHAT = 'chat',
}

/**
 * Single input contract for AI orchestration (iMessage, chat API, device webhooks).
 */
export interface MessageRequest {
  /** Stable conversation id when the channel provides one (e.g. BlueBubbles). */
  chatGuid?: string;
  messageText: string;
  source: MessageSource;
  userIdentifier: string;
}
