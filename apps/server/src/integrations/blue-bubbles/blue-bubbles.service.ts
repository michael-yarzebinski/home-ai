// src/integrations/bluebubbles/bluebubbles.service.ts
import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../core/services/app-config.service';
import { LogStore } from '../../core/stores/log/log.store';
import axios from 'axios';

@Injectable()
export class BlueBubblesService {
    private readonly baseUrl: string;
    private readonly password: string;

    constructor(
        private readonly appConfigService: AppConfigService,
        private readonly logStore: LogStore,
    ) {
        this.baseUrl = this.appConfigService.getFromEnv<string>('BLUEBUBBLES_URL');
        this.password = this.appConfigService.getFromEnv<string>('BLUEBUBBLES_PASSWORD');
    }

    private getAuthUrl(path: string): string {
        return `${this.baseUrl}${path}?password=${encodeURIComponent(this.password)}`;
    }

    async sendMessage(to: string, message: string): Promise<void> {
        try {
            await axios.post(this.getAuthUrl('/api/v1/message'), {
                recipient: to,
                message,
                isGroup: false,
            });

            await this.logStore.create({
                userId: undefined,
                severity: 'info',
                message: `BlueBubbles message sent`,
                metadata: { to, messageLength: message.length },
            });
        } catch (err: any) {
            await this.logStore.create({
                userId: undefined,
                severity: 'error',
                message: `Failed to send BlueBubbles message`,
                metadata: { error: err.message, to },
            });
            throw err;
        }
    }

    /**
     * Start showing typing indicator to the user.
     */
    async startTyping(chatId: string): Promise<void> {
        try {
            await axios.post(this.getAuthUrl('/api/v1/chat/typing'), {
                chatId,
                typing: true,
            });
        } catch (err: any) {
            await this.logStore.create({
                severity: 'warn',
                message: `Failed to start typing indicator for chat ${chatId}`,
                metadata: {
                    chatId,
                    error: err,
                }
            });
        }
    }

    /**
     * Stop showing typing indicator.
     */
    async stopTyping(chatId: string): Promise<void> {
        try {
            await axios.post(this.getAuthUrl('/api/v1/chat/typing'), {
                chatId,
                typing: false,
            });
        } catch (err: any) {
            await this.logStore.create({
                severity: 'warn',
                message: `Failed to stop typing indicator for chat ${chatId}`,
                metadata: {
                    chatId,
                    error: err,
                }
            });
        }
    }

    /**
     * Mark a chat or specific message as read.
     */
    async markAsRead(chatId: string, messageId?: string): Promise<void> {
        try {
            const payload: any = { chatId };
            if (messageId) payload.messageId = messageId;

            await axios.post(this.getAuthUrl('/api/v1/chat/markRead'), payload);
        } catch (err: any) {
            await this.logStore.create({
                severity: 'warn',
                message: `Failed to mark as read for chat ${chatId}`,
                metadata: {
                    chatId,
                    error: err,
                }
            });
        }
    }
}