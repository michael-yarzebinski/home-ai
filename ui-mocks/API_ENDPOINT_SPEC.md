# Home AI UI Endpoint Specification (Phase 2)

Format: **Controller | Base Path | Endpoint (Method/Path) | Payload | Response**

## Admin Dashboard

| Controller | Base Path | Endpoint | Payload | Response |
|---|---|---|---|---|
| `DashboardController` | `/dashboard` | `GET /dashboard/telemetry` | none | `{ systemLoad:number, memoryPressure:number, apiLatencyMs:number, activeStreams:number }` |
| `DashboardController` | `/dashboard` | `GET /dashboard/trends?hours=24` | query: `hours:number` | `{ points: Array<{ iso:string, intelligenceHits:number, systemErrors:number }> }` |
| `DashboardController` | `/dashboard` | `GET /dashboard/events?limit=200` | query: `limit:number` | `{ events: Array<{ iso:string, source:string, message:string, severity:string }> }` |

Implementation note:
- `DashboardService` should first derive values from `AIAuditStore`, `LogStore`, and `NotificationQueueStore`.
- If data is sparse or absent, return deterministic synthetic fallback values with the same response shape.
- Query guards: `hours` min/max `1..168`, `limit` min/max `1..500`.

## Admin CRUD (all entities except conversations)

| Controller | Base Path | Endpoint | Payload | Response |
|---|---|---|---|---|
| `UsersController` | `/users` | `GET /users?query=&page=&pageSize=&includeInactive=` | query params | `Paginated<User>` |
| `UsersController` | `/users` | `GET /users/:id` | path: `id` | `User` |
| `UsersController` | `/users` | `POST /users` | `CreateUserDto` | `User` |
| `UsersController` | `/users` | `PATCH /users/:id` | `UpdateUserDto` | `User` |
| `DevicesController` | `/devices` | `GET /devices?query=&room=&category=&page=&pageSize=&includeInactive=` | query params | `Paginated<Device>` |
| `DevicesController` | `/devices` | `GET /devices/:id` | path: `id` | `Device` |
| `DevicesController` | `/devices` | `POST /devices` | `CreateDeviceDto` | `Device` |
| `DevicesController` | `/devices` | `PATCH /devices/:id` | `UpdateDeviceDto` | `Device` |
| `CalendarsController` | `/calendars` | `GET /calendars?query=&color=&page=&pageSize=&includeInactive=` | query params | `Paginated<Calendar>` |
| `CalendarsController` | `/calendars` | `GET /calendars/:id` | path: `id` | `Calendar` |
| `CalendarsController` | `/calendars` | `POST /calendars` | `CreateCalendarDto` | `Calendar` |
| `CalendarsController` | `/calendars` | `PATCH /calendars/:id` | `UpdateCalendarDto` | `Calendar` |
| `NotesController` | `/notes` | `GET /notes?query=&page=&pageSize=&includeInactive=` | query params | `Paginated<Note>` |
| `NotesController` | `/notes` | `GET /notes/:id` | path: `id` | `Note` |
| `NotesController` | `/notes` | `POST /notes` | `CreateNoteDto` | `Note` |
| `NotesController` | `/notes` | `PATCH /notes/:id` | `UpdateNoteDto` | `Note` |
| `FactsController` | `/facts` | `GET /facts?query=&tag=&page=&pageSize=&includeInactive=` | query params | `Paginated<Fact>` |
| `FactsController` | `/facts` | `GET /facts/:id` | path: `id` | `Fact` |
| `FactsController` | `/facts` | `POST /facts` | `CreateFactDto` | `Fact` |
| `FactsController` | `/facts` | `PATCH /facts/:id` | `UpdateFactDto` | `Fact` |
| `RecipesController` | `/recipes` | `GET /recipes?query=&hasUrl=&page=&pageSize=&includeInactive=` | query params | `Paginated<Recipe>` |
| `RecipesController` | `/recipes` | `GET /recipes/:id` | path: `id` | `Recipe` |
| `RecipesController` | `/recipes` | `POST /recipes` | `CreateRecipeDto` | `Recipe` |
| `RecipesController` | `/recipes` | `PATCH /recipes/:id` | `UpdateRecipeDto` | `Recipe` |
| `IngredientsController` | `/ingredients` | `GET /ingredients?query=&recipeId=&page=&pageSize=&includeInactive=` | query params | `Paginated<Ingredient>` |
| `IngredientsController` | `/ingredients` | `GET /ingredients/:id` | path: `id` | `Ingredient` |
| `IngredientsController` | `/ingredients` | `POST /ingredients` | `CreateIngredientDto` | `Ingredient` |
| `IngredientsController` | `/ingredients` | `PATCH /ingredients/:id` | `UpdateIngredientDto` | `Ingredient` |
| `ToolsController` | `/tools` | `GET /tools?query=&page=&pageSize=&includeInactive=` | query params | `Paginated<Tool>` |
| `ToolsController` | `/tools` | `GET /tools/:id` | path: `id` | `Tool` |
| `ToolsController` | `/tools` | `PATCH /tools/:id` | `UpdateToolDto` | `Tool` |
| `AppConfigController` | `/app-config` | `GET /app-config?query=&page=&pageSize=&includeInactive=` | query params | `Paginated<AppConfig>` |
| `AppConfigController` | `/app-config` | `GET /app-config/:id` | path: `id` | `AppConfig` |
| `AppConfigController` | `/app-config` | `PATCH /app-config/:id` | `UpdateAppConfigDto` | `AppConfig` |

## Chat + Conversation Navigation

| Controller | Base Path | Endpoint | Payload | Response |
|---|---|---|---|---|
| `ChatController` | `/chat` | `POST /chat` | `{ userId:string, message:string, externalId?:string }` | `{ response:string, sessionId:string }` |
| `ConversationsController` | `/conversations` | `GET /conversations?userId=&page=&pageSize=` | query params | `Paginated<ConversationSummary>` |
| `ConversationsController` | `/conversations` | `GET /conversations/:id/messages` | path: `id` | `{ messages: ChatMessage[] }` |

## User Home

| Controller | Base Path | Endpoint | Payload | Response |
|---|---|---|---|---|
| `HomeController` | `/home` | `GET /home/brief?userId=` | query: `userId` | `{ greeting:string, pendingActions:number, pendingNotifications:number, highlights:string[] }` |
| `HomeController` | `/home` | `GET /home/today?userId=` | query: `userId` | `{ items:Array<{ title:string, iso:string, type:string }> }` |

## Pending Actions

| Controller | Base Path | Endpoint | Payload | Response |
|---|---|---|---|---|
| `PendingActionsController` | `/pending-actions` | `GET /pending-actions?query=&status=&requesterId=&page=&pageSize=&includeInactive=` | query params | `Paginated<PendingAction>` |
| `PendingActionsController` | `/pending-actions` | `GET /pending-actions/:id` | path: `id` | `PendingAction` |
| `PendingActionsController` | `/pending-actions` | `POST /pending-actions/:id/approve` | `{ approvedBy:string }` | `PendingAction` |
| `PendingActionsController` | `/pending-actions` | `POST /pending-actions/:id/reject` | `{ rejectedBy:string, reason?:string }` | `PendingAction` |

## Calendar

| Controller | Base Path | Endpoint | Payload | Response |
|---|---|---|---|---|
| `CalendarEventsController` | `/calendar-events` | `GET /calendar-events?calendarId=&from=&to=` | query params | `{ events: Array<CalendarEventDto> }` |
| `CalendarEventsController` | `/calendar-events` | `POST /calendar-events` | `CreateCalendarEventDto` | `CalendarEventDto` |
| `CalendarEventsController` | `/calendar-events` | `PATCH /calendar-events/:id` | `UpdateCalendarEventDto` | `CalendarEventDto` |
| `CalendarEventsController` | `/calendar-events` | `DELETE /calendar-events/:id` | path: `id` | `{ success:true }` |

## Devices (status-forward surface)

| Controller | Base Path | Endpoint | Payload | Response |
|---|---|---|---|---|
| `DeviceStateController` | `/device-state` | `GET /device-state?query=&room=&category=` | query params | `{ items:Array<{ slug:string, friendlyName:string, room?:string, category?:string, state:string, lastChanged?:string }> }` |
| `DeviceStateController` | `/device-state` | `POST /device-state/:slug/action` | `{ domain:string, service:string, data?:Record<string,unknown> }` | `{ success:boolean }` |

## Settings / Profile / Notification Preferences

| Controller | Base Path | Endpoint | Payload | Response |
|---|---|---|---|---|
| `ProfileController` | `/profile` | `GET /profile/:id` | path: `id` | `User` |
| `ProfileController` | `/profile` | `PATCH /profile/:id` | `UpdateUserDto` | `User` |
| `NotificationPreferencesController` | `/notification-preferences` | `GET /notification-preferences?query=&userId=&triggerType=&page=&pageSize=&includeInactive=` | query params | `Paginated<NotificationPreference>` |
| `NotificationPreferencesController` | `/notification-preferences` | `POST /notification-preferences` | `CreateNotificationPreferenceDto` | `NotificationPreference` |
| `NotificationPreferencesController` | `/notification-preferences` | `PATCH /notification-preferences/:id` | `UpdateNotificationPreferenceDto` | `NotificationPreference` |

## Kitchen Hub

| Controller | Base Path | Endpoint | Payload | Response |
|---|---|---|---|---|
| `KitchenHubController` | `/kitchen-hub` | `GET /kitchen-hub/scene?userId=` | query: `userId` | `{ photos:string[], weather:{ summary:string, temp:number }, actionQueue:Array<{ id:string, text:string, status:string }> }` |

## Monitoring Endpoints for Audit Surfaces

| Controller | Base Path | Endpoint | Payload | Response |
|---|---|---|---|---|
| `AIAuditController` | `/ai-audit` | `GET /ai-audit?query=&page=&pageSize=` | query params | `Paginated<AIAudit>` |
| `AuditController` | `/audit` | `GET /audit?query=&page=&pageSize=` | query params | `Paginated<Audit>` |
| `LogController` | `/logs` | `GET /logs?query=&page=&pageSize=` | query params | `Paginated<Log>` |
| `NotificationLogController` | `/notification-logs` | `GET /notification-logs?query=&page=&pageSize=` | query params | `Paginated<NotificationLog>` |
| `NotificationQueueController` | `/notification-queue` | `GET /notification-queue?query=&page=&pageSize=&includeInactive=` | query params | `Paginated<NotificationQueue>` |

## DTO Naming Rule (approved convention)

- For each module/domain, DTOs live in a file named: **`DOMAIN.dtos.ts`**.
- File contains **Create**, **Update**, and optional **general/query** DTO classes.
- DTOs remain separate from shared domain interfaces; domain mappings happen in services/stores.
