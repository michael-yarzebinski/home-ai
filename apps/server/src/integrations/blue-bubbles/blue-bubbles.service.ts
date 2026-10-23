// src/integrations/bluebubbles/bluebubbles.service.ts
import { Injectable } from "@nestjs/common";
import { AppConfigService } from "../../core/services/app-config.service";
import { LogStore } from "../../core/stores/monitoring/log/log.store";
import { Trace } from "../../common/decorators/trace.decorator";
import axios from "axios";
import { v4 } from "uuid";
import { currentTraceId } from "../../common/trace-id";

@Injectable()
export class BlueBubblesService {
  private readonly baseUrl: string;
  private readonly password: string;

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly logStore: LogStore,
  ) {
    this.baseUrl = this.appConfigService.getFromEnv<string>("BLUEBUBBLES_URL");
    this.password = this.appConfigService.getFromEnv<string>(
      "BLUEBUBBLES_PASSWORD",
    );
  }

  private getAuthUrl(path: string): string {
    return `${this.baseUrl}${path}?password=${encodeURIComponent(this.password)}`;
  }

  @Trace()
  async sendMessage(to: string, message: string): Promise<void> {
    const payload = {
      chatGuid: this.chatGuid(to),
      message,
      tempGuid: v4(),
      method: "private-api",
    };

    await axios.post(this.getAuthUrl("/api/v1/message/text"), payload);

    await this.logStore.create({
      traceId: currentTraceId(),
      userId: undefined,
      severity: "info",
      message: `BlueBubbles message sent`,
      metadata: { to, messageLength: message.length },
    });
  }

  @Trace()
  async sendAttachment(
    to: string,
    message: string,
    fileName: string,
    bytes: Buffer,
    mimeType: string,
  ): Promise<void> {
    const form = new FormData();
    form.append("chatGuid", this.chatGuid(to));
    form.append("tempGuid", v4());
    form.append("method", "private-api");
    form.append("name", fileName);
    form.append(
      "attachment",
      new Blob([new Uint8Array(bytes)], { type: mimeType }),
      fileName,
    );

    await axios.post(this.getAuthUrl("/api/v1/message/attachment"), form);

    await this.logStore.create({
      traceId: currentTraceId(),
      userId: undefined,
      severity: "info",
      message: `BlueBubbles attachment sent`,
      metadata: { to, fileName, messageLength: message.length },
    });

    // Private API attachment sends leave the iMessage text empty, so the caption goes out on its own.
    const caption = message.trim();
    if (caption) {
      await this.sendMessage(to, caption);
    }
  }

  private chatGuid(to: string): string {
    return to.includes(";") ? to : `any;-;+${to.replace("+", "")}`;
  }

  /**
   * Start showing typing indicator to the user.
   */
  @Trace()
  async startTyping(chatId: string): Promise<void> {
    try {
      await axios.post(
        this.getAuthUrl(`/api/v1/chat/${encodeURIComponent(chatId)}/typing`),
        {},
      );
    } catch (err: any) {
      await this.logStore.create({
        traceId: currentTraceId(),
        severity: "warn",
        message: `Failed to start typing indicator for chat ${chatId}`,
        metadata: {
          chatId,
          error: err,
        },
      });
    }
  }

  /**
   * Stop showing typing indicator.
   */
  @Trace()
  async stopTyping(chatId: string): Promise<void> {
    try {
      await axios.delete(
        this.getAuthUrl(`/api/v1/chat/${encodeURIComponent(chatId)}/typing`),
      );
    } catch (err: any) {
      await this.logStore.create({
        traceId: currentTraceId(),
        severity: "warn",
        message: `Failed to stop typing indicator for chat ${chatId}`,
        metadata: {
          chatId,
          error: err,
        },
      });
    }
  }

  /**
   * Mark a chat or specific message as read.
   */
  @Trace()
  async markAsRead(chatId: string): Promise<void> {
    try {
      await axios.post(
        this.getAuthUrl(`/api/v1/chat/${encodeURIComponent(chatId)}/read`),
        {},
      );
    } catch (err: any) {
      await this.logStore.create({
        traceId: currentTraceId(),
        severity: "warn",
        message: `Failed to mark as read for chat ${chatId}`,
        metadata: {
          chatId,
          error: err,
        },
      });
    }
  }
}
