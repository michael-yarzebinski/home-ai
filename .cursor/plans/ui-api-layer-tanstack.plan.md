# UI API layer + TanStack Query (revised)

## Scope

- **Implement API modules only** — no migration of existing pages (no entity-search / chat / automation-rules rewiring in this phase).
- **Do not use or import** [`apps/ui/src/lib/api.ts`](apps/ui/src/lib/api.ts). If the token + `fetch` + 401 handling is useful, **duplicate** it under [`apps/ui/src/api/client.ts`](apps/ui/src/api/client.ts) (or `http.ts`). Deprecate/remove `lib/api.ts` when you integrate callers later.
- **TanStack Query:** add `@tanstack/react-query` and **`QueryClientProvider`** at the app root so hooks compile and run; no requirement to touch pages until you choose.
- **No barrels:** do **not** add `src/api/index.ts` (or any `index.ts` that re-exports the API layer). **Do not** import from barrels—every consumer imports the **concrete module** (e.g. `@/api/devices/devices.hooks`, `@/api/client`).

## Architecture (layers)

1. **`client.ts`** — transport only: base path, JSON, bearer token, 401 → clear session + redirect, 204 handling.
2. **`<entity>.api.ts` / `admin/<entity>.admin.api.ts`** — **plain exported objects** (`devicesApi`, `devicesAdminApi`): URLs + HTTP verbs matching Nest. **No React**, no `useQuery`.
3. **`<entity>.keys.ts` / `admin/<entity>.admin.keys.ts`** — stable **query key** factories. **Not** hooks — **no `use` prefix** on exports.
4. **`<entity>.hooks.ts` / `admin/<entity>.admin.hooks.ts`** — **only** `use*` / `useAdmin*` functions; each calls `useQuery` / `useMutation` and delegates `queryFn` / `mutationFn` to the corresponding `*Api` object.

TanStack **sits above** the `*Api` objects: hooks import APIs + keys; components import hooks (and optionally keys for prefetch).

**Avoid:** a single hook that **returns** other functions which **then** call `useQuery` internally (Rules of Hooks / conditional call risk). Each exported hook should **directly** invoke `useQuery` / `useMutation` at its top level.

## Plain objects, not classes (no DI)

- **`devicesApi`** in `devices.api.ts` — `export const devicesApi = { … } as const` (or equivalent).
- **`devicesAdminApi`** in `admin/devices.admin.api.ts` — `import { devicesApi } from '../devices.api.ts'` then `export const devicesAdminApi = { …devicesApi, search: …, getById: …, restore: … }` so **admin overrides** only what the server overrides; **mutations that still hit `v1/devices`** keep delegating to `devicesApi` (e.g. devices PUT/DELETE).

## Admin vs app behavior (devices reference)

Match the server split ([`devices.controller.ts`](apps/server/src/core/controllers/devices/devices.controller.ts) vs [`devices.admin.controller.ts`](apps/server/src/core/controllers/devices/admin/devices.admin.controller.ts)):

| Concern | App (`devicesApi` → `v1/devices`) | Admin (`devicesAdminApi` → `v1/admin/devices`) |
|--------|-----------------------------------|-----------------------------------------------|
| Search | Client may send DTO; server forces `includeInactive: false` | Client sends DTO; server allows inactive in criteria |
| Get by id | Active default on server | Server passes include-inactive read |
| Update / soft-delete | `PUT` / `DELETE` on app routes | **Same** — admin uses **spread** from `devicesApi` (no duplicate URLs) |
| Restore | — | `POST …/restore` on admin only |

Other entities: read each Nest pair and mirror **verbs + path prefix**; admin folder omitted when there is no admin controller.

## Folder layout (required shape)

Template (replace `entity` with resource name, e.g. `devices`):

```text
src/api/
  client.ts
  <entity>/
    <entity>.api.ts
    <entity>.keys.ts
    <entity>.hooks.ts
    admin/
      <entity>.admin.api.ts
      <entity>.admin.keys.ts
      <entity>.admin.hooks.ts
```

**Example (`devices`):**

```text
src/api/client.ts
devices/
  devices.api.ts
  devices.keys.ts
  devices.hooks.ts
  admin/
    devices.admin.api.ts
    devices.admin.keys.ts
    devices.admin.hooks.ts
```

**Per-file responsibility**

| File | Exports (examples) | Notes |
|------|-------------------|--------|
| `<entity>.api.ts` | `devicesApi` | `v1/<segment>` only |
| `<entity>.keys.ts` | `deviceKeys` | `all`, `lists()`, `list(dto)`, `detail(id)`, … |
| `<entity>.hooks.ts` | `useDeviceSearch`, `useDeviceById`, `useUpdateDevice`, … | Import `devicesApi` + `deviceKeys` |
| `admin/<entity>.admin.api.ts` | `devicesAdminApi` | `v1/admin/...`; spread `devicesApi` + overrides |
| `admin/<entity>.admin.keys.ts` | `adminDeviceKeys` (or `deviceAdminKeys`) | Separate key space from app keys |
| `admin/<entity>.admin.hooks.ts` | `useAdminDeviceSearch`, `useAdminDeviceById`, `useAdminDeviceRestore`, … | Import `devicesAdminApi` + admin keys; call `devicesApi` in mutations when writes stay on app routes |

**Imports:** `admin/<entity>.admin.api.ts` uses `../<entity>.api.ts` for spread. Hooks files never import the **other side’s** hooks—only their own `*Api` + `*keys`.

**When to omit `admin/`:** no `v1/admin/...` controller for that resource → only the three app files.

**Monitoring / admin-only entities:** may be only `admin/` files (or a minimal set); still use `useAdmin…` hooks for consistency.

## Naming convention (hooks + keys + APIs)

**HTTP objects**

- **App:** `devicesApi`, `factsApi`, … — `{entity}Api` in `<entity>.api.ts`.
- **Admin:** `devicesAdminApi`, … — `{entity}AdminApi` in `<entity>.admin.api.ts` (clear “admin” in the **identifier**, not only the folder).

**Query keys**

- **No `use` prefix** — e.g. `deviceKeys`, `adminDeviceKeys`.
- Keep app and admin key trees **distinct** (different roots or segments) so invalidation does not cross-contaminate.

**Hooks — must start with `use`**

- **App** (`<entity>.hooks.ts`): describe **what it does**, aligned with HTTP:  
  `useDeviceSearch`, `useDeviceById`, `useUpdateDevice`, `useSoftDeleteDevice` (or `useDeleteDevice` if you standardize on “delete” in the name).
- **Admin** (`admin/<entity>.admin.hooks.ts`): prefix **`useAdmin`**, then resource + action:  
  **`useAdminDeviceSearch`**, **`useAdminDeviceById`**, **`useAdminDeviceRestore`**, …  
  So at the callsite it is obvious you are on an admin surface.

**Non-hooks**

- Do **not** use the `use` prefix on key factories, `client.ts` helpers, or plain `queryOptions` blobs if you introduce any without wrapping them in a hook.

## TanStack usage (component side, later)

```tsx
import { useDeviceSearch } from '@/api/devices/devices.hooks';
import { useAdminDeviceRestore } from '@/api/devices/admin/devices.admin.hooks';

const { data } = useDeviceSearch({ page: 1, pageSize: 20 });
const restore = useAdminDeviceRestore();
```

**Prefetch / route loaders:** import `deviceKeys` / `adminDeviceKeys` from `*.keys.ts` and reuse the same `queryFn` as the hook, or add a small **`prefetchX(queryClient, …)`** next to hooks—optional.

## Rollout order (APIs only)

1. Add `@tanstack/react-query` + `QueryClientProvider` in [`apps/ui/src/main.tsx`](apps/ui/src/main.tsx) or [`apps/ui/src/App.tsx`](apps/ui/src/App.tsx).
2. Implement [`apps/ui/src/api/client.ts`](apps/ui/src/api/client.ts).
3. Implement **`devices/`** full six-file layout as the **reference** resource.
4. Replicate for remaining resources (omit `admin/` where N/A).

## Removed / deferred

- No page migration in this phase.
- No new imports from `lib/api.ts` for this layer.

## Todos

- [ ] TanStack Query + `QueryClientProvider`.
- [ ] `src/api/client.ts`.
- [ ] `src/api/devices/` six files (reference).
- [ ] Same pattern for other resources; skip `admin/` when absent.
