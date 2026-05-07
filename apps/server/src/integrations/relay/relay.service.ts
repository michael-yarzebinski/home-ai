import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { AppConfigService } from "../../core/services/app-config.service";
import { LogStore } from "../../core/stores/monitoring/log/log.store";

@Injectable()
export class RelayService {
  private readonly relayUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly httpService: HttpService,
    private readonly logStore: LogStore,
  ) {
    this.relayUrl = this.appConfigService.getFromEnv<string>("RELAY_URL");
    this.apiKey = this.appConfigService.getFromEnv<string>("RELAY_API_KEY");
  }

  /**
   * Sends an AppleScript to the native Mac relay
   */
  async runAppleScript(script: string): Promise<string> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(
          this.relayUrl,
          { script },
          { headers: { "RELAY-API-KEY": this.apiKey } },
        ),
      );

      return response.data.output;
    } catch (error) {
      this.logStore.create({
        severity: "error",
        message: `Relay Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        metadata: { error: error },
      });

      throw new HttpException(
        "Failed to communicate with Mac Relay",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
