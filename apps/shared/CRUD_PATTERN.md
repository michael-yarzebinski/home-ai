# Standard entity CRUD pattern (shared DTOs + server mappers + admin UI)

This repo keeps **one validation source** for admin APIs and React forms: **class-validator** DTOs in `@home-ai/shared`, plus **server-only mappers** between domain models and those DTOs.

## 1. Shared package (`apps/shared`)

For each domain concept, add a folder under `src/model/<name>/` (e.g. `user`, `device`):

| Artifact | Purpose |
|----------|---------|
| `<Name>ResponseDto` | **Read** / JSON response shape for CRUD entities. May include server fields such as `id`, timestamps (`createdAt` / `updatedAt` as **ISO strings**), flags. |
| `<Name>Dto` | **Read-only** wire row (admin logs/audits, no HTTP create/update). Prefer **`AIAuditDto`**-style **`<Name>Dto`** over **`Response`** in the name; see [`plans/Monorepo CRUD Pattern.md`](../../plans/Monorepo%20CRUD%20Pattern.md) (**Wire / read DTO class names**). |
| `<Name>CreateDto` | **POST** body. **Must not** include server-generated timestamps (or other server-only fields). |
| `<Name>UpdateDto` | **PATCH** body. Same rule: **no** `createdAt` / `updatedAt`. Prefer `@IsOptional()` on each property for partial updates. |
| **`SearchRequestDto`** | Default **`POST …/search`** **`@Body()`** in [`src/search/search.dto.ts`](./src/search/search.dto.ts): **`search`**, **`includeInactive`**, **`page`**, **`pageSize`**. Use for all list/search endpoints until an entity needs extra validated fields (then add a dedicated search DTO). |
| **`SearchRequestDto`** | Criteria passed into service + store search flow: `search?`, `includeInactive?`, `pageNumber?`, `pageSize?`. Controllers enforce trust boundaries before calling service methods. |
| **`SearchResponseDto<T>`** | Shared search **response** in [`src/search/search.dto.ts`](./src/search/search.dto.ts): **`items: T[]`**, **`total`**, optional **`page`** / **`pageSize`**. Use **`SearchResponseDto<UserResponseDto>`**, **`SearchResponseDto<AIAuditDto>`**, etc.; implements **`PaginationResponse`**. |
| *(optional)* **`XSearchRequest`** | When an entity needs extra filters, **`export interface XSearchRequest extends SearchRequest { … }`** in `src/model/<name>/` (no Nest imports). |
| `<Name>Utils` | Optional **static-only** class for transforms and regex/constants used by DTOs (`trimQuietCreate`, patterns, etc.) so DTO files stay thin and each model stays organized the same way. |

Shared **pagination** contracts live in [`src/pagination/`](./src/pagination/) — **`PaginationRequest`**, **`SearchRequest`**, and **`PaginationResponse`**. List/search bodies default to **`SearchRequestDto`**; stores accept **`SearchRequest`** (or a type that extends it).

**Rules of thumb**

- Use **camelCase** property names to match JSON and Nest’s `ValidationPipe` with `transform: true`.
- Put **`@Transform`** next to fields that need normalization (trim, empty string → `null` / `undefined`) so Nest and the web app behave the same after `plainToInstance`; delegate logic to `<Name>Utils` when it grows beyond one line.
- Keep the shared package **free of Nest imports** and free of **server domain classes** (the Nest `User` entity type stays on the server). **`SearchRequest`** / **`toSearchRequest`** live under **`src/search/`** and **`src/pagination/`** so `apps/web` can import them safely.

## 2. Server (`apps/server`)

Under each entity folder (e.g. `core/entities/user/`), keep **only**: **controller(s)**, **mapper**, **service**, **store**, and **domain** — plus tests if you add them. **Do not** add per-entity search DTOs/criteria in the server tree; use **`SearchRequestDto`** / **`SearchRequest`** from **`@home-ai/shared`** (see §1). Optional **`XSearchRequest extends SearchRequest`** stays in **`apps/shared/src/model/<name>/`** only when an entity adds fields beyond the common shape.

For each entity:

1. **`<entity>.mapper.ts`** (next to store/service/controller):
   - `toResponseDto(domain: DomainModel): <Entity>ResponseDto` — strip secrets, map dates to ISO strings, align names with the shared DTO.
   - `fromCreateDto(dto: <Entity>CreateDto): …` — shape passed into the create service method.
   - `fromUpdateDto(dto: <Entity>UpdateDto): …` — partial patch for the update service method (respect `undefined` vs explicit `null` if the store distinguishes them).

2. **Controller** — `@Body()` typed with shared create/update DTOs and **`SearchRequestDto`** on **`POST …/search`** (unless the entity has a specialized search DTO). Enforce includeInactive trust boundary in-controller — **non-admin:** force `includeInactive = false`; **admin:** allow request value. See §5. Return **`toResponseDto`** results from search/get-by-id/create/update handlers.

3. **Service** — stays **domain-centric** (persistence, hashing, invariants). Prefer **one** `search(criteria)` per entity typed with **`SearchRequest`** (or **`XSearchRequest extends SearchRequest`**) from `@home-ai/shared`. Accept **criteria**, not raw DTOs, past the controller boundary unless you deliberately choose otherwise.

## 3. Web admin (`apps/web`)

1. Import DTO classes from `@home-ai/shared`.
2. Ensure **`reflect-metadata`** is loaded once at startup (see `src/main.tsx`) and **`experimentalDecorators`** + **`useDefineForClassFields`: `false`** in `tsconfig.json`.
3. On submit: build a DTO-shaped payload from form state and send it to the API; map server validation errors to field components.

**Vite:** `@home-ai/shared` is aliased to `../shared/src/index.ts` so decorators and named exports bundle correctly (see `vite.config.ts`).

## 4. New-entity checklist

- [ ] Add `<Name>CreateDto`, `<Name>UpdateDto`, `<Name>ResponseDto` under `apps/shared/src/model/<name>/`. Use shared **`SearchRequestDto`** / **`SearchResponseDto<<Name>ResponseDto>`** / **`SearchRequest`** / **`toSearchRequest`** for **`POST …/search`** unless the entity adds **`XSearchRequest`** / a dedicated search request DTO. Export new model files from `apps/shared/src/index.ts`.
- [ ] Add `<Name>Utils` (static helpers) in the same folder when DTO transforms or shared constants deserve a home.
- [ ] Run `npm run build -w @home-ai/shared` (or `npm install` at repo root, which runs `prepare` on the shared workspace).
- [ ] Add `<entity>.mapper.ts` and wire the admin controller to shared DTOs + mapper outputs.
- [ ] Add admin page: reuse `AdminPanel`, `CrudDialog`, `DataTable`; send DTO-shaped request payloads.
- [ ] If the read model differs between “public” and “admin” views, use **separate response DTOs** instead of overloading one class.

## Golden User rules

Before merging any entity rollout, verify it matches the **User** reference behavior:

- [ ] **Controller trust boundary:** non-admin controllers force `includeInactive = false`; admin controllers may accept `includeInactive`.
- [ ] **Service boundary:** service `search(...)` does not override access scope; it forwards controller-provided criteria to store.
- [ ] **Store contract:** store search accepts explicit search args and applies SQL semantics in-store (search text + pagination + active filtering for active-flag tables).
- [ ] **Response envelope:** list/search responses return `{ items, total, page?, pageSize? }`.
- [ ] **No legacy list route:** no `GET /<resource>` bulk list endpoint; bulk read is `POST /<resource>/search`.
- [ ] **Validation flow:** controller validates `SearchRequestDto` before calling service/store.

## 5. List / **search** (admin and non-admin) — `POST` + body

Canonical architecture (naming, single pipeline, controller overrides): **[`plans/Monorepo CRUD Pattern.md`](../../plans/Monorepo%20CRUD%20Pattern.md)** (Naming conventions, Single search pipeline, Store + `AbstractEntityStore`).

**Convention:** bulk list / search is **`POST …/search`** with a validated **JSON body**, not `GET` with query strings. Applies to **read-only** admin tables and to **editable** entities’ list surfaces.

- **Route:** `POST /api/admin/<resource>/search` (admin) and `POST /api/v1/<resource>/search` (non-admin / JWT tier when the matrix allows search).
- **Body DTO (default):** **`SearchRequestDto`** in `@home-ai/shared` (`src/search/search.dto.ts`), used as **`@Body()`** for **`POST …/search`** unless an entity introduces a stricter body. Optional **`search`** (free text; **SQL mapping is per store** — document in store JSDoc). Optional **pagination**. Optional **`includeInactive`** for tables with an active flag — **non-admin** controllers force `includeInactive = false` so JWT callers cannot widen inactive rows. **Admin** users/app-config may honor request `includeInactive`. Append-only admin tables may ignore `includeInactive` in SQL.
- **Defaults:** No `search`, no pagination (or empty `{}`) → full result set **allowed for that tier** where safe (non-admin: active-only because `includeInactive` is forced false; admin: active-only unless `includeInactive` is true). Large append-only tables may default to **paginated** first page — document per entity.
- **Response:** Prefer **`SearchResponseDto<<Name>ResponseDto>`** (`items`, `total`, optional `page` / `pageSize`). Map each row with **`*ToResponseDto`**.
- **Single row:** **`GET /api/admin/<resource>/:id`** and **`GET /api/v1/<resource>/:id`** may stay **GET**; separate from **`POST …/search`**.

**Trade-off (intentional):** one shared **`SearchRequestDto`** means OpenAPI may show `includeInactive` on v1; non-admin enforcement happens in controller logic, not by using a separate type.

Some tables are **append-only or log-style**: expose **only** a `<Name>ResponseDto` — reuse **`SearchRequestDto`** / **`SearchResponseDto<<Name>ResponseDto>`** for **`POST …/search`** — **no** `CreateDto` / `UpdateDto` unless you add moderation flows.

### Search conventions (store, service, controller)

1. **HTTP** — **`POST …/search`** + **`SearchRequestDto`**, `class-validator`, Nest `ValidationPipe`, `@Body()`.
2. **Store** — **One** `search(criteria)` per entity; **`criteria`** is **`SearchRequest`** (or **`extends SearchRequest`**). **Knex/SQL** in the store; no parallel `searchForAdmin` / `searchForUser`.
3. **Service** — **One** `search` forwarding to the store; optional `includeInactive ?? false` for defense in depth.
4. **Controller** — Validate **`@Body()`** → **`toSearchRequest`** with the correct **`includeInactive`** flag → **`search`**. Map to **`{ items, total }`**.

Log-style tables often have no inactive dimension; criteria still carry **`search`**, limits, and pagination.

| Area | Response DTO | Search body (examples) | Server mapper | Route |
|------|----------------|-------------------------|---------------|-------|
| AI audit | `AIAuditDto` | **`SearchRequestDto`** | `ai-audit.mapper.ts` | `POST /api/admin/ai-audit/search` |
| Entity audit | `AuditDto` | **`SearchRequestDto`** | `audit.mapper.ts` | `POST /api/admin/audit/search` |
| App log | `LogResponseDto` | **`SearchRequestDto`** | `log.mapper.ts` | `POST /api/admin/logs/search` |

**New searchable resource checklist**

- [ ] Add `<Name>ResponseDto` under `apps/shared/src/model/<name>/` and export from `index.ts`. Reuse **`SearchRequestDto`** / **`SearchResponseDto<T>`** / **`SearchRequest`** unless the entity needs extra search fields.
- [ ] One **`search(criteria)`** on store + service; keep SQL in the store.
- [ ] **`POST …/search`** on admin and (if applicable) non-admin controllers; **overwrite** restricted fields on non-admin handlers before `search`.

## 6. Admin entities using this pattern (server)

| Entity | Shared `src/model/…` | Mapper | Controller | Notes |
|--------|----------------------|--------|------------|-------|
| User | `user/` | `user.mapper.ts` | `UserAdminController`, `UserController` | **`SearchRequestDto`** end-to-end; **`UsersService.search`**, `UserStore.search`; non-admin forces `includeInactive = false` in controller. **`POST /api/admin/users/search`**, **`POST /api/v1/users/search`**, `GET :id`. |
| App config | `app-config/` | `app-config.mapper.ts` | `AppConfigAdminController` | **`POST /api/admin/app-config/search`** (**`SearchRequestDto`**), `GET :key`, `PATCH` value + `PATCH …/active`. **`AppConfigService.search`**, `AppConfigStore.search`. |
| Device | `device/` | `device.mapper.ts` | `DevicesController` | Full CRUD + `PATCH …/active`. |
| Task | `task/` | `task.mapper.ts` | `TasksController` | Key = `taskName`; update only (no create in admin). |
| Fact | `fact/` | `fact.mapper.ts` | `FactsController` | Create uses `visibilityRoles` → service maps to store. |
| Recipe | `recipe/` | `recipe.mapper.ts` | `RecipesAdminController` | `FeaturesModule`; CRUD + `PATCH …/active`. |
| Task request | `task-request/` | `task-request.mapper.ts` | `TaskRequestsController` | **No create**; `PATCH …/status` + optional `executorUserId`. |
| AI audit | `ai-audit/` | `ai-audit.mapper.ts` | `AIAuditAdminController` | Read-only. **`POST /api/admin/ai-audit/search`** (**`SearchRequestDto`**); **`AIAuditService.search`**, `AIAuditStore.search`. |
| Audit | `audit/` | `audit.mapper.ts` | `AuditAdminController` | Read-only. **`POST /api/admin/audit/search`** (**`SearchRequestDto`**); **`AuditService.search`**, `AuditStore.search`. |
| Log | `log/` | `log.mapper.ts` | `LogAdminController` | Read-only. **`POST /api/admin/logs/search`** (**`SearchRequestDto`**); **`LogService.search`**, `LogStore.search`. |

## Reference implementation

Users: `apps/shared/src/model/user/user.dto.ts`, `apps/shared/src/model/user/user.utils.ts`, `apps/server/src/core/entities/user/user.mapper.ts`, `apps/web/src/admin/users/UserForm.tsx`.
