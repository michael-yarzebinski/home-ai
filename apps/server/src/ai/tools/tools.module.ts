import { Module } from "@nestjs/common";
import { ToolRegistryService } from "src/core/tools/registry/tool-registry.service";


@Module({
    imports: [],
    providers: [
        ToolRegistryService,
    ],
    exports: []

})
export class ToolsModule {}