// import { Injectable } from '@nestjs/common';
// import { MessageSource } from '../../ai/orchestrator/interfaces/message-request';
// import { AIOrchestratorService } from 'src/ai/orchestrator/ai-orchestrator.service';

// const AUTOMATION_USER_ID = '0';

// @Injectable()
// export class WebhookService {
//   constructor(private readonly aiToolsService: AIOrchestratorService) {}

//   /**
//    * Handle device events from Home Assistant.
//    */
//   async handleDeviceEvent(payload: any): Promise<void> {
//     const message =
//       payload.message || `${payload.device || 'Device'} - ${payload.event || 'unknown event'}`;

//     await this.aiToolsService.processMessage({
//       messageText: message,
//       source: MessageSource.DEVICE,
//       userIdentifier: AUTOMATION_USER_ID,
//     });
//   }

//   /**
//    * Handle incoming iMessage from BlueBubbles. `userIdentifier` is the channel handle (resolved inside AI tools via {@link UsersService.findByUserIdOrHandle}).
//    */
//   async handleBlueBubblesMessage(payload: any): Promise<void> {
//     const chat_guid = payload.chatGuid || payload.chat_guid;
//     const userIdentifier = (payload.handle || payload.from || payload.user_handle || '').trim();
//     const message_text = payload.message || payload.text || payload.body;

//     await this.aiToolsService.processMessage({
//       messageText: message_text,
//       source: MessageSource.IMESSAGE,
//       userIdentifier,
//       chatGuid: chat_guid,
//     });
//   }
// }
