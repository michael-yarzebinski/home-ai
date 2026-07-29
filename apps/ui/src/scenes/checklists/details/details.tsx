import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ListChecks, Loader2, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Role } from '@home-ai/shared/domain/role/role';
import {
  ChecklistItemPriority,
  ChecklistItemStatus,
  type ChecklistItem,
  type InsertableChecklistItem,
  type UpdatableChecklistItem,
} from '@home-ai/shared/domain/checklist/checklist-item';
import type { InsertableChecklist, UpdatableChecklist } from '@home-ai/shared/domain/checklist/checklist';
import {
  RecurringChecklistItemTriggerType,
  type InsertableRecurringChecklistItem,
  type RecurringChecklistItem,
  type UpdatableRecurringChecklistItem,
} from '@home-ai/shared/domain/checklist/recurring-checklist-item';
import { capitalizeFirst } from '@/utils/string.utils';
import { useChecklistDetail, useUpdateChecklist, useSoftDeleteChecklist } from '@/api/checklists/checklists.hooks';
import {
  useCheckChecklistItem,
  useCreateChecklistItem,
  useUncheckChecklistItem,
  useUpdateChecklistItem,
} from '@/api/checklist-items/checklist-items.hooks';
import {
  useCreateRecurringChecklistItem,
  useUpdateRecurringChecklistItem,
} from '@/api/recurring-checklist-items/recurring-checklist-items.hooks';
import type { FormViewMode } from '@/components/form/entities/types';
import { useUserSearch } from '@/api/users/users.hooks';
import { useAuth } from '@/contexts/auth-context';
import { EntityModal } from '@/components/entity-modal/entity-modal';
import { ChecklistForm } from '@/components/form/entities/checklist/checklist-form';
import { ChecklistItemForm } from '@/components/form/entities/checklist/checklist-item-form';
import { RecurringChecklistItemForm } from '@/components/form/entities/checklist/recurring-checklist-item-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ChecklistItemRow } from './checklist-item-row';
import { ChecklistDetailsSummary } from './checklist-details-summary';
import { RecurringItemsPanel } from './recurring-items-panel';
import { filterVisibleItems, partitionChecklistItems } from './checklist-item-utils';

type ItemModalMode = Extract<FormViewMode, 'READ' | 'EDIT'>;

function userHasWriteAccess(writeRoles: Role[], userRole: string | undefined): boolean {
  if (!userRole) return false;
  return writeRoles.includes(userRole as Role);
}

export default function ChecklistDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [detailsItem, setDetailsItem] = useState<ChecklistItem | null>(null);
  const [itemModalMode, setItemModalMode] = useState<ItemModalMode>('READ');
  const [detailsRecurringItem, setDetailsRecurringItem] = useState<RecurringChecklistItem | null>(null);
  const [recurringModalMode, setRecurringModalMode] = useState<ItemModalMode>('READ');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddRecurringModalOpen, setIsAddRecurringModalOpen] = useState(false);
  const [isEditChecklistModalOpen, setIsEditChecklistModalOpen] = useState(false);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useChecklistDetail(id);
  const { mutate: checkItem } = useCheckChecklistItem();
  const { mutate: uncheckItem } = useUncheckChecklistItem();
  const { mutate: createItem, isPending: isCreatingItem } = useCreateChecklistItem();
  const { mutate: createRecurringItem, isPending: isCreatingRecurringItem } =
    useCreateRecurringChecklistItem();
  const { mutate: updateItem, isPending: isUpdatingItem } = useUpdateChecklistItem();
  const { mutate: updateRecurringItem, isPending: isUpdatingRecurringItem } =
    useUpdateRecurringChecklistItem();
  const { mutate: updateChecklist, isPending: isUpdatingChecklist } = useUpdateChecklist();
  const { mutate: deleteChecklist, isPending: isDeletingChecklist } = useSoftDeleteChecklist();

  const { data: usersPage } = useUserSearch(
    { query: '', page: 1, pageSize: 100 },
    { enabled: Boolean(data) },
  );

  const assigneeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of usersPage?.items ?? []) {
      map.set(u.id, u.name);
    }
    return map;
  }, [usersPage?.items]);

  const checklist = data?.checklist;
  const allItems = data?.checklistItems ?? [];
  const recurringItems = data?.recurringChecklistItems ?? [];

  const canWrite = checklist ? userHasWriteAccess(checklist.writeRoles as Role[], user?.role) : false;

  useEffect(() => {
    if (detailsItem) setItemModalMode('READ');
  }, [detailsItem?.id]);

  useEffect(() => {
    if (detailsRecurringItem) setRecurringModalMode('READ');
  }, [detailsRecurringItem?.id]);

  useEffect(() => {
    if (!detailsItem) return;
    const fresh = allItems.find((i) => i.id === detailsItem.id);
    if (fresh) setDetailsItem(fresh);
  }, [allItems, detailsItem?.id]);

  useEffect(() => {
    if (!detailsRecurringItem) return;
    const fresh = recurringItems.find((i) => i.id === detailsRecurringItem.id);
    if (fresh) setDetailsRecurringItem(fresh);
  }, [recurringItems, detailsRecurringItem?.id]);

  const closeDetailsItemModal = useCallback(() => {
    setDetailsItem(null);
    setItemModalMode('READ');
  }, []);

  const closeDetailsRecurringModal = useCallback(() => {
    setDetailsRecurringItem(null);
    setRecurringModalMode('READ');
  }, []);

  const visibleItems = useMemo(
    () => filterVisibleItems(allItems, showAllHistory),
    [allItems, showAllHistory],
  );

  const { open, checked } = useMemo(
    () => partitionChecklistItems(visibleItems),
    [visibleItems],
  );

  const handleToggleCheck = useCallback(
    (item: ChecklistItem, nextChecked: boolean) => {
      setPendingToggleId(item.id);
      const onSettled = () => setPendingToggleId(null);

      if (nextChecked) {
        checkItem(item.id, {
          onError: (e) => toast.error(e.message),
          onSettled,
        });
      } else {
        uncheckItem(item.id, {
          onError: (e) => toast.error(e.message),
          onSettled,
        });
      }
    },
    [checkItem, uncheckItem],
  );

  const handleCreateItem = (formData: InsertableChecklistItem) => {
    createItem(
      { ...formData, checklistId: id! },
      {
        onSuccess: () => {
          toast.success('Item added');
          setIsAddModalOpen(false);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const handleCreateRecurringItem = (formData: InsertableRecurringChecklistItem) => {
    createRecurringItem(
      { ...formData, checklistId: id! },
      {
        onSuccess: () => {
          toast.success('Recurring item added');
          setIsAddRecurringModalOpen(false);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const handleUpdateItem = (formData: InsertableChecklistItem) => {
    if (!detailsItem) return;
    const body: UpdatableChecklistItem = {
      title: formData.title,
      description: formData.description,
      checklistId: formData.checklistId,
      priority: formData.priority,
      status: formData.status,
      assigneeId: formData.assigneeId,
      dueDate: formData.dueDate,
      dependsOn: formData.dependsOn,
      tags: formData.tags,
      metadata: formData.metadata,
    };
    updateItem(
      { id: detailsItem.id, body },
      {
        onSuccess: () => {
          toast.success('Item saved');
          setItemModalMode('READ');
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const handleUpdateRecurringItem = (formData: InsertableRecurringChecklistItem) => {
    if (!detailsRecurringItem) return;
    const body: UpdatableRecurringChecklistItem = {
      title: formData.title,
      description: formData.description,
      checklistId: formData.checklistId,
      defaultAssigneeId: formData.defaultAssigneeId,
      priority: formData.priority,
      tags: formData.tags,
      triggerType: formData.triggerType,
      triggerConfig: formData.triggerConfig,
      dependsOnRecurringIds: formData.dependsOnRecurringIds,
      metadata: formData.metadata,
    };
    updateRecurringItem(
      { id: detailsRecurringItem.id, body },
      {
        onSuccess: () => {
          toast.success('Recurring item saved');
          setRecurringModalMode('READ');
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const handleDeleteChecklist = () => {
    if (!id) return;
    deleteChecklist(id, {
      onSuccess: () => {
        toast.success('Checklist deleted');
        navigate('/checklists/all');
      },
      onError: (e) => toast.error(e.message),
    });
  };

  const handleUpdateChecklist = (formData: InsertableChecklist) => {
    const body: UpdatableChecklist = {
      name: formData.name,
      description: formData.description,
      readRoles: formData.readRoles,
      writeRoles: formData.writeRoles,
    };
    updateChecklist(
      { id: id!, body },
      {
        onSuccess: () => {
          toast.success('Checklist saved');
          setIsEditChecklistModalOpen(false);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  if (!id) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Missing checklist id.{' '}
        <Link to="/checklists/all" className="text-primary hover:underline">
          Back to all checklists
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin mr-2" />
        Loading checklist…
      </div>
    );
  }

  if (isError || !checklist) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-destructive">{error?.message ?? 'Checklist not found.'}</p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/checklists/all">
            <ArrowLeft className="size-4 mr-2" />
            All checklists
          </Link>
        </Button>
      </div>
    );
  }

  const totalVisible = open.length + checked.length;

  return (
    <div className="flex flex-col h-full min-h-0 gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <div className="p-2.5 bg-accent rounded-xl border border-border/50 shrink-0">
            <ListChecks className="h-6 w-6 text-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
              {checklist.name}
            </h1>
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
              {totalVisible} {showAllHistory ? 'items' : 'active items'}
              {!showAllHistory && allItems.length > totalVisible && (
                <> · {allItems.length - totalVisible} hidden (older than 24h)</>
              )}
            </p>
          </div>
        </div>
        {canWrite && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 text-xs font-bold uppercase tracking-wider"
            onClick={() => setIsEditChecklistModalOpen(true)}
          >
            <Pencil className="size-3.5 mr-1.5" />
            Edit checklist
          </Button>
        )}
      </div>

      <ChecklistDetailsSummary checklist={checklist} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <Card className="flex flex-col min-h-0 h-full overflow-hidden">
          <CardHeader className="flex-shrink-0 pb-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">To do</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Open tasks on top · recently completed at the bottom
                </CardDescription>
              </div>
              {canWrite && (
                <Button
                  size="sm"
                  className="shrink-0 text-xs font-bold uppercase tracking-wider"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus className="size-3.5 mr-1.5" />
                  Add item
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-muted/20 px-3 py-2">
              <Label htmlFor="show-all-history" className="text-xs font-medium cursor-pointer">
                Show all history
              </Label>
              <Switch
                id="show-all-history"
                checked={showAllHistory}
                onCheckedChange={setShowAllHistory}
              />
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto space-y-2 pr-2 pb-4 min-h-0">
            {totalVisible === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <p className="text-sm font-medium">No items to show</p>
                <p className="text-xs mt-1 max-w-xs">
                  {showAllHistory
                    ? 'This checklist has no active items.'
                    : 'Nothing active right now. Toggle history or add a new item.'}
                </p>
              </div>
            ) : (
              <>
                {open.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    isTogglePending={pendingToggleId === item.id}
                    onToggleCheck={handleToggleCheck}
                    onRowClick={setDetailsItem}
                  />
                ))}
                {checked.length > 0 && open.length > 0 && (
                  <div className="flex items-center gap-3 py-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                      Completed
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}
                {checked.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    isTogglePending={pendingToggleId === item.id}
                    onToggleCheck={handleToggleCheck}
                    onRowClick={setDetailsItem}
                  />
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <RecurringItemsPanel
          recurringItems={recurringItems}
          assigneeNameById={assigneeNameById}
          canWrite={canWrite}
          onAddClick={() => setIsAddRecurringModalOpen(true)}
          onItemClick={setDetailsRecurringItem}
        />
      </div>

      <EntityModal
        title={
          detailsItem
            ? itemModalMode === 'EDIT'
              ? `Edit ${capitalizeFirst(detailsItem.title)}`
              : capitalizeFirst(detailsItem.title)
            : 'Checklist item'
        }
        isOpen={detailsItem != null}
        onClose={closeDetailsItemModal}
        footer={
          itemModalMode === 'READ' ? (
            <>
              <Button
                variant="ghost"
                onClick={closeDetailsItemModal}
                className="text-xs font-bold uppercase tracking-wider"
              >
                Close
              </Button>
              {canWrite && (
                <Button
                  onClick={() => setItemModalMode('EDIT')}
                  className="h-9 px-6 text-xs font-bold uppercase tracking-widest"
                >
                  <Pencil className="size-3.5 mr-1.5" />
                  Edit
                </Button>
              )}
            </>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setItemModalMode('READ')}
              className="text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </Button>
          )
        }
      >
        {detailsItem && (
          <ChecklistItemForm
            key={`${detailsItem.id}-${itemModalMode}`}
            viewMode={itemModalMode}
            lockChecklistId
            isLoading={isUpdatingItem}
            onSubmit={itemModalMode === 'EDIT' ? handleUpdateItem : () => {}}
            initialData={detailsItem}
          />
        )}
      </EntityModal>

      <EntityModal
        title={
          detailsRecurringItem
            ? recurringModalMode === 'EDIT'
              ? `Edit ${capitalizeFirst(detailsRecurringItem.title)}`
              : capitalizeFirst(detailsRecurringItem.title)
            : 'Recurring item'
        }
        isOpen={detailsRecurringItem != null}
        onClose={closeDetailsRecurringModal}
        footer={
          recurringModalMode === 'READ' ? (
            <>
              <Button
                variant="ghost"
                onClick={closeDetailsRecurringModal}
                className="text-xs font-bold uppercase tracking-wider"
              >
                Close
              </Button>
              {canWrite && (
                <Button
                  onClick={() => setRecurringModalMode('EDIT')}
                  className="h-9 px-6 text-xs font-bold uppercase tracking-widest"
                >
                  <Pencil className="size-3.5 mr-1.5" />
                  Edit
                </Button>
              )}
            </>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setRecurringModalMode('READ')}
              className="text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </Button>
          )
        }
      >
        {detailsRecurringItem && (
          <RecurringChecklistItemForm
            key={`${detailsRecurringItem.id}-${recurringModalMode}`}
            viewMode={recurringModalMode}
            lockChecklistId
            isLoading={isUpdatingRecurringItem}
            onSubmit={recurringModalMode === 'EDIT' ? handleUpdateRecurringItem : () => {}}
            initialData={detailsRecurringItem}
          />
        )}
      </EntityModal>

      <EntityModal
        title="Edit checklist"
        isOpen={isEditChecklistModalOpen}
        onClose={() => setIsEditChecklistModalOpen(false)}
        formId="edit-checklist-form"
        saveLabel="Save Changes"
        isLoading={isUpdatingChecklist}
        onDelete={canWrite ? handleDeleteChecklist : undefined}
        isDeleting={isDeletingChecklist}
      >
        <ChecklistForm
          key={String(checklist.updatedAt ?? checklist.id)}
          formId="edit-checklist-form"
          viewMode="EDIT"
          isLoading={isUpdatingChecklist}
          onSubmit={handleUpdateChecklist}
          initialData={checklist}
        />
      </EntityModal>

      <EntityModal
        title="Add checklist item"
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        footer={null}
      >
        <ChecklistItemForm
          viewMode="CREATE"
          isLoading={isCreatingItem}
          onSubmit={handleCreateItem}
          initialData={{
            checklistId: id,
            title: '',
            description: '',
            priority: ChecklistItemPriority.MEDIUM,
            status: ChecklistItemStatus.PENDING,
            dependsOn: [],
            tags: [],
            metadata: {
              videoLinks: [],
              requiredItems: [],
              manualUrl: '',
            },
          }}
        />
      </EntityModal>

      <EntityModal
        title="Add recurring item"
        isOpen={isAddRecurringModalOpen}
        onClose={() => setIsAddRecurringModalOpen(false)}
        footer={null}
      >
        <RecurringChecklistItemForm
          viewMode="CREATE"
          isLoading={isCreatingRecurringItem}
          onSubmit={handleCreateRecurringItem}
          initialData={{
            checklistId: id,
            title: '',
            description: '',
            priority: ChecklistItemPriority.MEDIUM,
            triggerType: RecurringChecklistItemTriggerType.CRON,
            triggerConfig: { cron: '0 0 * * *', dueInDays: 1 },
            tags: [],
            dependsOnRecurringIds: [],
            metadata: {
              videoLinks: [],
              requiredItems: [],
            },
          }}
        />
      </EntityModal>
    </div>
  );
}
