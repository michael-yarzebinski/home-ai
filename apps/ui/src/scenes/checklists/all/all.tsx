import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useChecklistInfinite } from "@/api/checklists/checklists.hooks";
import { useAdminChecklistCreate } from "@/api/checklists/admin/checklists.admin.hooks";
import { useDebounce } from "@/hooks/use-debounce";
import { EntityTable } from "@/components/entity-table/entity-table";
import { checklistColumns } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus, ListChecks } from "lucide-react";

// The new imports
import { EntityModal } from "@/components/entity-modal/entity-modal";
import { InsertableChecklist } from "@home-ai/shared/domain/checklist/checklist";
import { ChecklistForm } from "../../../components/form/entities/checklist/checklist-form";

export function ChecklistsAll() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = 
    useChecklistInfinite({ query: debouncedSearch, pageSize: 20 });

  const { mutate: createChecklist, isPending: isCreating } = useAdminChecklistCreate();

  const checklists = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  const handleCreateSubmit = (formData: InsertableChecklist) => {
    createChecklist(formData, {
      onSuccess: (newChecklist) => {
        setIsCreateModalOpen(false);
        // Optionally navigate to details of the new item
        navigate(`/checklists/details/${newChecklist.id}`);
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-background md:p-2 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-accent rounded-xl border border-border/50">
            <ListChecks className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Checklist</h1>
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
              View all Checklists. Click a row to view the details.
            </p>
          </div>
        </div>

        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-5 h-9 text-xs font-bold uppercase tracking-wider transition-all"
        >
          <Plus className="h-3.5 w-3.5 mr-2" />
          Create Checklist
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <EntityTable
          columns={checklistColumns}
          data={checklists}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={!!hasNextPage}
          fetchNextPage={fetchNextPage}
          query={search}
          onQueryChange={setSearch}
          searchPlaceholder="Filter checklists..."
          onRowClick={(item) => navigate(`/checklists/details/${item.id}`)}
        />
      </div>

      {/* Standardized Modal Integration */}
      <EntityModal
        title="Create New Checklist"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        footer={null} // ChecklistForm provides its own submit button
      >
        <ChecklistForm 
          viewMode="CREATE"
          onSubmit={handleCreateSubmit}
          isLoading={isCreating}
        />
      </EntityModal>
    </div>
  );
}