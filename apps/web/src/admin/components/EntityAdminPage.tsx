import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AdminPanel } from './AdminPanel';
import { AdminButton } from './buttons';
import { DataTable, type Column } from './DataTable';
import { DetailDialog } from './DetailDialog';
import { CrudDialog } from './CrudDialog';
import { TextAreaField, TextField } from './fields';
import { useEntitySearch } from '../hooks/useEntitySearch';
import { apiFetch } from '../../api';
import { parseApiError } from '../lib/parseApiError';

export const ENTITY_JSON_FORM_ID = 'entity-json-form';

const ENTITY_CUSTOM_FORM_PREFIX = 'entity-custom-form-';

type MutationConfig<T> = {
  label: string;
  buttonLabel: string;
  endpoint: (row?: T | null) => string;
  method: 'POST' | 'PATCH';
  getInitialPayload: (row?: T | null) => Record<string, unknown>;
  /** When true, structured device-style form may show an Active toggle (edit flows). */
  includeActiveInPayload?: boolean;
};

type EntityAdminPageProps<T> = {
  title: string;
  description?: string;
  queryKeyRoot: string;
  searchPath: string;
  columns: Column<T>[];
  getRowKey: (row: T) => string;
  detailTitle: (row: T) => string;
  detailSubtitle?: (row: T) => string | undefined;
  renderDetails: (row: T) => ReactNode;
  supportsIncludeInactive?: boolean;
  createConfig?: MutationConfig<T>;
  updateConfig?: MutationConfig<T>;
  detailActions?: (row: T, refetch: () => Promise<unknown>) => ReactNode;
  /** When set, create/edit uses this UI instead of raw JSON (still uses the same endpoints). */
  /** Wider create/edit dialog when using a structured mutation form. */
  wideMutationDialog?: boolean;
  renderCustomMutationForm?: (props: {
    formId: string;
    initialPayload: Record<string, unknown>;
    disabled: boolean;
    error: string | null;
    includeActive: boolean;
    onSubmit: (payload: Record<string, unknown>) => void;
  }) => ReactNode;
};

export function EntityAdminPage<T>({
  title,
  description,
  queryKeyRoot,
  searchPath,
  columns,
  getRowKey,
  detailTitle,
  detailSubtitle,
  renderDetails,
  supportsIncludeInactive = true,
  createConfig,
  updateConfig,
  detailActions,
  renderCustomMutationForm,
  wideMutationDialog = false,
}: EntityAdminPageProps<T>) {
  const [search, setSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [selected, setSelected] = useState<T | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [payloadText, setPayloadText] = useState('{}');
  const [payloadLabel, setPayloadLabel] = useState('');
  const [mutationConfig, setMutationConfig] = useState<MutationConfig<T> | null>(null);
  const [mutationTargetRow, setMutationTargetRow] = useState<T | null>(null);
  const [mutationInitialPayload, setMutationInitialPayload] = useState<Record<string, unknown>>({});
  const [mutationSessionKey, setMutationSessionKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const mutationFormId = `${ENTITY_CUSTOM_FORM_PREFIX}${queryKeyRoot}`;

  const { items, isPending, isError, error, hasMore, isFetchingNextPage, fetchNextPage, refetch } = useEntitySearch<T>({
    searchPath,
    search,
    includeInactive: supportsIncludeInactive ? includeInactive : false,
    pageSize: 25,
    queryKeyRoot,
  });

  const effectiveColumns = useMemo(() => {
    if (!updateConfig) {
      return columns;
    }
    return [
      ...columns,
      {
        id: 'actions',
        header: '',
        className: 'w-28 text-right',
        cell: (row: T) => (
          <AdminButton
            type="button"
            variant="ghost"
            className="!px-2 !py-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              openMutationDialog(updateConfig, row);
            }}
          >
            Edit
          </AdminButton>
        ),
      },
    ] satisfies Column<T>[];
  }, [columns, updateConfig]);

  function openMutationDialog(config: MutationConfig<T>, row?: T | null) {
    setMutationConfig(config);
    setMutationTargetRow(row ?? null);
    setMutationError(null);
    setPayloadLabel(config.label);
    const initial = config.getInitialPayload(row) as Record<string, unknown>;
    setMutationInitialPayload(initial);
    setMutationSessionKey((k) => k + 1);
    setPayloadText(JSON.stringify(initial, null, 2));
  }

  const submitPayload = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!mutationConfig) {
        return;
      }
      setMutationError(null);
      setIsSaving(true);
      try {
        const res = await apiFetch(mutationConfig.endpoint(mutationTargetRow), {
          method: mutationConfig.method,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error(await parseApiError(res));
        }
        await refetch();
        setMutationConfig(null);
        setMutationTargetRow(null);
      } catch (e) {
        setMutationError(e instanceof Error ? e.message : 'Request failed');
      } finally {
        setIsSaving(false);
      }
    },
    [mutationConfig, mutationTargetRow, refetch],
  );

  async function submitMutation() {
    if (!mutationConfig) {
      return;
    }
    setMutationError(null);
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(payloadText) as Record<string, unknown>;
    } catch {
      setMutationError('Payload must be valid JSON.');
      return;
    }
    await submitPayload(payload);
  }

  return (
    <>
      <AdminPanel
        title={title}
        description={description}
        actions={
          <>
            <TextField
              id={`${queryKeyRoot}-search`}
              label="Search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {supportsIncludeInactive && (
              <label className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--fg)' }}>
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                />
                Include inactive
              </label>
            )}
            {createConfig && (
              <AdminButton type="button" onClick={() => openMutationDialog(createConfig, null)}>
                {createConfig.buttonLabel}
              </AdminButton>
            )}
          </>
        }
      >
        {isError ? (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {error instanceof Error ? error.message : 'Failed to load data'}
          </div>
        ) : null}
        <DataTable<T>
          columns={effectiveColumns}
          rows={items}
          getRowKey={getRowKey}
          emptyMessage="No results"
          isLoading={isPending}
          onRowClick={(row) => setSelected(row)}
          hasMore={hasMore}
          isFetchingMore={isFetchingNextPage}
          onLoadMore={() => {
            if (!isFetchingNextPage && hasMore) {
              void fetchNextPage();
            }
          }}
        />
      </AdminPanel>

      <DetailDialog
        open={selected != null}
        title={selected ? detailTitle(selected) : title}
        subtitle={selected && detailSubtitle ? detailSubtitle(selected) : undefined}
        onClose={() => setSelected(null)}
        footer={
          <>
            {selected && detailActions ? detailActions(selected, refetch) : null}
            {selected && updateConfig ? (
              <AdminButton type="button" onClick={() => openMutationDialog(updateConfig, selected)}>
                Edit
              </AdminButton>
            ) : null}
            <AdminButton type="button" variant="ghost" onClick={() => setSelected(null)}>
              Close
            </AdminButton>
          </>
        }
      >
        {selected ? renderDetails(selected) : null}
      </DetailDialog>

      <CrudDialog
        open={mutationConfig != null}
        title={payloadLabel}
        maxWidthClass={wideMutationDialog ? 'max-w-2xl' : 'max-w-lg'}
        subtitle={renderCustomMutationForm ? 'Update fields and submit.' : 'Update JSON payload and submit.'}
        onClose={() => {
          if (!isSaving) {
            setMutationConfig(null);
            setMutationTargetRow(null);
          }
        }}
        formId={renderCustomMutationForm ? mutationFormId : ENTITY_JSON_FORM_ID}
        busy={isSaving}
        footer={
          <>
            <AdminButton
              type="button"
              variant="ghost"
              disabled={isSaving}
              onClick={() => {
                setMutationConfig(null);
                setMutationTargetRow(null);
              }}
            >
              Cancel
            </AdminButton>
            <AdminButton type="submit" form={renderCustomMutationForm ? mutationFormId : ENTITY_JSON_FORM_ID} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Submit'}
            </AdminButton>
          </>
        }
      >
        {renderCustomMutationForm ? (
          <div key={mutationSessionKey}>
            {renderCustomMutationForm({
              formId: mutationFormId,
              initialPayload: mutationInitialPayload,
              disabled: isSaving,
              error: mutationError,
              includeActive: mutationConfig?.includeActiveInPayload ?? false,
              onSubmit: (payload) => {
                void submitPayload(payload);
              },
            })}
          </div>
        ) : (
          <form
            id={ENTITY_JSON_FORM_ID}
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submitMutation();
            }}
          >
            <TextAreaField
              id={`${queryKeyRoot}-payload`}
              label="Payload JSON"
              rows={14}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
            />
            {mutationError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{mutationError}</div>
            ) : null}
          </form>
        )}
      </CrudDialog>
    </>
  );
}
