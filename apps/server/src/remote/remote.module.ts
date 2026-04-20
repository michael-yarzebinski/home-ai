import { Module } from '@nestjs/common';
import { HomeAssistantService } from './home-assistant/home-assistant.service';
import { CoreModule } from 'src/core/core.module';
import { HomeAssistantAdminController } from './home-assistant/home-assistant-admin.controller';

@Module({
  imports: [CoreModule],
  controllers: [HomeAssistantAdminController],
  providers: [HomeAssistantService],
  exports: [HomeAssistantService],
})
export class RemoteModule {}