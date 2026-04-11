import { Injectable } from '@nestjs/common';

@Injectable()
export class DetectTaskTool {
  async detect(message: string): Promise<{
    rawMessage: string;
  }> {
    return {
      rawMessage: message,
    };
  }
}