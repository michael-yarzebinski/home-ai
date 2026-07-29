import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, ListChecks, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Role } from '@home-ai/shared/domain/role/role';
import type { Checklist } from '@home-ai/shared/domain/checklist/checklist';
import {
  type ChecklistItem,
  type InsertableChecklistItem,
  type UpdatableChecklistItem,
} from '@home-ai/shared/domain/checklist/checklist-item';
import { capitalizeFirst } from '@/utils/string.utils';
import {
  useCheckChecklistItem,
  useUncheckChecklistItem,
  useUpdateChecklistItem,
} from '@/api/checklist-items/checklist-items.hooks';
import { useAuth } from '@/contexts/auth-context';
import { EntityModal } from '@/components/entity-modal/entity-modal';
import { ChecklistItemForm } from '@/components/form/entities/checklist/checklist-item-form';
import type { FormViewMode } from '@/components/form/entities/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChecklistItemRow } from '../details/checklist-item-row';
import { useChecklistHomeData } from './use-checklist-home-data';

type ItemModalMode = Extract<FormViewMode, 'READ' | 'EDIT'>;

function userHasWriteAccess(writeRoles: Role[], userRole: string | undefined): boolean {
  if (!userRole) return false;
  return writeRoles.includes(userRole as Role);
}

export function ChecklistHome() {
  const { user } = useAuth();
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
  const [detailsItem, setDetailsItem] = useState<ChecklistItem | null>(null);
  const [itemModalMode, setItemModalMode] = useState<ItemModalMode>('READ');

  const {
    checklists,
    assignedTodos,
    otherTodos,
    isLoading,
    isLoadingChecklists,
    isLoadingDetails,
  } = useChecklistHomeData(user?.id);

  const { mutate: checkItem } = useCheckChecklistItem();
  const { mutate: uncheckItem } = useUncheckChecklistItem();
  const { mutate: updateItem, isPending: isUpdatingItem } = useUpdateChecklistItem();

  const allTodos = useMemo(
    () => [...assignedTodos, ...otherTodos],
    [assignedTodos, otherTodos],
  );

  const checklistById = useMemo(() => {
    const map = new Map<string, Checklist>();
    for (const c of checklists) map.set(c.id, c);
    return map;
  }, [checklists]);

  const canWriteItem = detailsItem
    ? userHasWriteAccess(
        (checklistById.get(detailsItem.checklistId)?.writeRoles ?? []) as Role[],
        user?.role,
      )
    : false;

  useEffect(() => {
    if (detailsItem) setItemModalMode('READ');
  }, [detailsItem?.id]);

  useEffect(() => {
    if (!detailsItem) return;
    const fresh = allTodos.find((i) => i.id === detailsItem.id);
    if (fresh) {
      setDetailsItem(fresh);
    } else {
      setDetailsItem(null);
      setItemModalMode('READ');
    }
  }, [allTodos, detailsItem?.id]);

  const closeDetailsItemModal = useCallback(() => {
    setDetailsItem(null);
    setItemModalMode('READ');
  }, []);

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

  const totalTodos = assignedTodos.length + otherTodos.length;

  return (
    <div className="flex flex-col h-full min-h-0 gap-6 pb-8">
      <div className="flex items-start gap-4 shrink-0">
        <div className="p-2.5 bg-accent rounded-xl border border-border/50 shrink-0">
          <Home className="h-6 w-6 text-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Checklists</h1>
          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
            Your open tasks across all checklists
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        <Card className="flex flex-col min-h-0 lg:w-3/4 lg:shrink-0 overflow-hidden">
          <CardHeader className="flex-shrink-0 pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest">My to dos</CardTitle>
            <CardDescription className="text-xs mt-1">
              Open tasks only · assigned to you first
              {!isLoading && (
                <> · {totalTodos} {totalTodos === 1 ? 'item' : 'items'}</>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="size-6 animate-spin mr-2" />
                {isLoadingChecklists ? 'Loading checklists…' : 'Loading tasks…'}
              </div>
            ) : totalTodos === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <p className="text-sm font-medium">Nothing on your plate</p>
                <p className="text-xs mt-1 max-w-xs">
                  You have no open tasks across your checklists right now.
                </p>
              </div>
            ) : (
              <>
                <TodoSection
                  title="Assigned to you"
                  items={assignedTodos}
                  pendingToggleId={pendingToggleId}
                  onToggleCheck={handleToggleCheck}
                  onOpenItem={setDetailsItem}
                />
                <TodoSection
                  title="Other open tasks"
                  items={otherTodos}
                  pendingToggleId={pendingToggleId}
                  onToggleCheck={handleToggleCheck}
                  onOpenItem={setDetailsItem}
                  hideWhenEmpty
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col min-h-0 lg:w-1/4 flex-1 overflow-hidden">
          <CardHeader className="flex-shrink-0 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ListChecks className="size-4 text-muted-foreground shrink-0" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">
                    All checklists
                  </CardTitle>
                </div>
                <CardDescription className="text-xs mt-1">
                  {isLoadingChecklists
                    ? 'Loading…'
                    : `${checklists.length} ${checklists.length === 1 ? 'checklist' : 'checklists'}`}
                </CardDescription>
              </div>
              <Link
                to="/checklists/all"
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline shrink-0 pt-0.5"
              >
                View all checklists
              </Link>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto min-h-0 p-0">
            {isLoadingChecklists ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="size-5 animate-spin mr-2" />
              </div>
            ) : checklists.length === 0 ? (
              <p className="px-6 py-12 text-sm text-muted-foreground text-center">
                No checklists available.
              </p>
            ) : (
              <ul className="divide-y divide-border/50">
                {checklists.map((checklist) => (
                  <ChecklistListRow
                    key={checklist.id}
                    checklist={checklist}
                    isLoadingDetails={isLoadingDetails}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
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
              {canWriteItem && (
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
    </div>
  );
}

function TodoSection({
  title,
  items,
  pendingToggleId,
  onToggleCheck,
  onOpenItem,
  hideWhenEmpty = false,
}: {
  title: string;
  items: ChecklistItem[];
  pendingToggleId: string | null;
  onToggleCheck: (item: ChecklistItem, checked: boolean) => void;
  onOpenItem: (item: ChecklistItem) => void;
  hideWhenEmpty?: boolean;
}) {
  if (hideWhenEmpty && items.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
        {title}
        {items.length > 0 && (
          <span className="ml-2 text-muted-foreground/40">({items.length})</span>
        )}
      </h2>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground px-1 py-2">None</p>
      ) : (
        items.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            showChecklistName
            isTogglePending={pendingToggleId === item.id}
            onToggleCheck={onToggleCheck}
            onRowClick={onOpenItem}
          />
        ))
      )}
    </section>
  );
}

function ChecklistListRow({
  checklist,
  isLoadingDetails,
}: {
  checklist: Checklist;
  isLoadingDetails: boolean;
}) {
  return (
    <li>
      <Link
        to={`/checklists/details/${checklist.id}`}
        className={cn(
          'block w-full text-left px-6 py-4 transition-colors',
          'hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        )}
      >
        <p className="text-sm font-semibold text-foreground truncate">
          {checklist.name}
        </p>
        {checklist.description ? (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {capitalizeFirst(checklist.description)}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground/50 italic">No description</p>
        )}
        {isLoadingDetails && (
          <p className="mt-1.5 text-[10px] text-muted-foreground/40 uppercase tracking-wider">
            Syncing tasks…
          </p>
        )}
      </Link>
    </li>
  );
}
