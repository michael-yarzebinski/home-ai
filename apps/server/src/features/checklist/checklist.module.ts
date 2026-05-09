import { Module } from "@nestjs/common";
import { CoreModule } from "src/core/core.module";
import { ChecklistStore } from "./stores/checklist.store";
import { ChecklistItemStore } from "./stores/checklist-item.store";
import { RecurringChecklistItemStore } from "./stores/recurring-checklist-item.store";
import { ChecklistManagerService } from "./services/checklist-manager.service";
import { ChecklistRecurringGenerationService } from "./services/checklist-recurring-generation.service";
import { AddChecklistTool } from "./tools/add-checklist.tool";
import { UpdateChecklistTool } from "./tools/update-checklist.tool";
import { ListChecklistsTool } from "./tools/list-checklists.tool";
import { GetChecklistTool } from "./tools/get-checklist.tool";
import { CheckChecklistItemTool } from "./tools/check-checklist-item.tool";
import { UncheckChecklistItemTool } from "./tools/uncheck-checklist-item.tool";
import { AddRecurringItemTool } from "./tools/add-recurring-item.tool";
import { UpdateRecurringItemTool } from "./tools/update-recurring-item.tool";
import { GenerateChecklistItemsFromTagsTool } from "./tools/generate-checklist-items-from-tags.tool";
import { GetUserAssignedChecklistItemsTool } from "./tools/get-user-assigned-checklist-items.tool";
import { AddChecklistItemTool } from "./tools/add-checklist-item.tool";
import { UpdateChecklistItemTool } from "./tools/update-checklist-item.tool";
import { GetRecurringItemTagsTool } from "./tools/get-recurring-item-tags.tool";
import { GetUsersTool } from "src/tools/default/user/get-users.tool";
import { ChecklistsController } from "./controllers/checklists.controller";
import { ChecklistItemsController } from "./controllers/checklist-items.controller";
import { RecurringChecklistItemsController } from "./controllers/recurring-checklist-items.controller";
import { ChecklistsAdminController } from "./controllers/admin/checklists.admin.controller";
import { ChecklistItemsAdminController } from "./controllers/admin/checklist-items.admin.controller";
import { RecurringChecklistItemsAdminController } from "./controllers/admin/recurring-checklist-items.admin.controller";

@Module({
  imports: [CoreModule],
  controllers: [
    ChecklistsController,
    ChecklistItemsController,
    RecurringChecklistItemsController,
    ChecklistsAdminController,
    ChecklistItemsAdminController,
    RecurringChecklistItemsAdminController,
  ],
  providers: [
    ChecklistStore,
    ChecklistItemStore,
    RecurringChecklistItemStore,
    ChecklistManagerService,
    ChecklistRecurringGenerationService,
    AddChecklistTool,
    UpdateChecklistTool,
    ListChecklistsTool,
    GetChecklistTool,
    CheckChecklistItemTool,
    UncheckChecklistItemTool,
    AddRecurringItemTool,
    UpdateRecurringItemTool,
    GenerateChecklistItemsFromTagsTool,
    GetUserAssignedChecklistItemsTool,
    AddChecklistItemTool,
    UpdateChecklistItemTool,
    GetRecurringItemTagsTool,
    GetUsersTool,
  ],
  exports: [
    ChecklistStore,
    ChecklistItemStore,
    RecurringChecklistItemStore,
    ChecklistManagerService,
    ChecklistRecurringGenerationService,
    AddChecklistTool,
    UpdateChecklistTool,
    ListChecklistsTool,
    GetChecklistTool,
    CheckChecklistItemTool,
    UncheckChecklistItemTool,
    AddRecurringItemTool,
    UpdateRecurringItemTool,
    GenerateChecklistItemsFromTagsTool,
    GetUserAssignedChecklistItemsTool,
    AddChecklistItemTool,
    UpdateChecklistItemTool,
    GetRecurringItemTagsTool,
    GetUsersTool,
  ],
})
export class ChecklistModule {}
