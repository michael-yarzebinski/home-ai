import { Module } from "@nestjs/common";
import { HomeAssistantService } from "./home-assistant/home-assistant.service";
import { CoreModule } from "src/core/core.module";


@Module({
    imports: [CoreModule],
    providers: [HomeAssistantService],
    exports: [HomeAssistantService]
})
export class RemoteModule {}