import { Module } from "@nestjs/common";
import { CoreModule } from "src/core/core.module";
import { FactsStore } from "./stores/facts.store";
import { AddFactTool } from "./tools/add-fact.tool";
import { GetFactTool } from "./tools/get-fact.tool";
import { ListFactsTool } from "./tools/list-facts.tool";
import { UpdateFactTool } from "./tools/update-fact.tool";
import { FactsAdminController } from "./controllers/admin/facts.admin.controller";
import { FactsController } from "./controllers/facts.controller";

@Module({
  imports: [CoreModule],
  controllers: [FactsAdminController, FactsController],
  providers: [
    FactsStore,
    AddFactTool,
    GetFactTool,
    ListFactsTool,
    UpdateFactTool,
  ],
  exports: [
    FactsStore,
    AddFactTool,
    GetFactTool,
    ListFactsTool,
    UpdateFactTool,
  ],
})
export class FactsModule {}
