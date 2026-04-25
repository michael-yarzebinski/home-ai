import { Knex } from "knex";
import * as bcrypt from "bcrypt";

export async function up(knex: Knex): Promise<void> {
  // 1. users
  await knex.schema.createTable("users", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.text("role").notNullable();
    t.text("name").notNullable();
    t.text("phone_number").notNullable();
    t.text("access_code_hash").notNullable();
    t.text("timezone").notNullable();
    t.time("quiet_hours_start");
    t.time("quiet_hours_end");
    t.boolean("active").defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // 2. tools
  await knex.schema.createTable("tools", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.text("name").unique().notNullable();
    t.text("friendly_name").notNullable();
    t.text("hints").nullable();
    t.jsonb("request_roles").defaultTo("[]");
    t.jsonb("write_roles").defaultTo("[]");
    t.jsonb("notify_roles").defaultTo("[]");
    t.boolean("active").defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // 3. pending_actions
  await knex.schema.createTable("pending_actions", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.increments("readable_id").unsigned().unique().notNullable();
    t.uuid("requester_id").references("id").inTable("users").notNullable();
    t.jsonb("proposed_args").notNullable();
    t.text("status").notNullable();
    t.text("reason");
    t.uuid("executed_by").references("id").inTable("users").nullable();
    t.boolean("active").defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // 4. app_config
  await knex.schema.createTable("app_config", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.text("key").unique().notNullable();
    t.text("value").notNullable();
    t.text("description");
    t.boolean("active").defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // 5. conversations
  await knex.schema.createTable("conversations", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.string("external_id").notNullable().index();
    t.uuid("user_id").notNullable().index().references("id").inTable("users");
    t.jsonb("messages").notNullable().defaultTo("[]");
    t.timestamp("last_activity").notNullable().index();
    t.boolean("is_active").defaultTo(true);
    t.text("summary").nullable();
    t.boolean("active").defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // 6–10. Monitoring tables
  await knex.schema.createTable("audit", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.text("entity_type").notNullable();
    t.uuid("entity_id").notNullable();
    t.text("action").notNullable();
    t.uuid("user_id").references("id").inTable("users");
    t.jsonb("changes").notNullable();
    t.text("notes");
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("ai_audit", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.uuid("user_id").references("id").inTable("users").notNullable();
    t.uuid("chat_session_id").notNullable();
    t.text("user_message").notNullable();
    t.jsonb("tool_calls");
    t.text("final_response");
    t.integer("duration_ms");
    t.boolean("success").defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("logs", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.uuid("user_id").references("id").inTable("users");
    t.text("severity").defaultTo("info");
    t.text("message").notNullable();
    t.jsonb("metadata").defaultTo("{}");
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("notification_log", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.uuid("user_id").references("id").inTable("users").notNullable();
    t.text("message").notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("notification_queue", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.uuid("user_id").references("id").inTable("users").notNullable();
    t.text("message").notNullable();
    t.text("importance").notNullable();
    t.timestamp("scheduled_for").notNullable();
    t.boolean("active").defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("notification_preferences", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.uuid("user_id").references("id").inTable("users").notNullable();
    t.text("trigger_type").notNullable();
    t.jsonb("trigger_config").notNullable();
    t.text("message_template").notNullable();
    t.text("importance").notNullable();
    t.boolean("active").defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("devices", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.text("slug").unique().notNullable();
    t.text("friendly_name").notNullable();
    t.jsonb("aliases").defaultTo("[]");
    t.text("room");
    t.text("category");
    t.jsonb("read_roles").defaultTo("[]");
    t.jsonb("write_roles").defaultTo("[]");
    t.jsonb("extra_metadata").defaultTo("{}");
    t.boolean("active").defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("calendars", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.text("name").unique().notNullable();
    t.text("friendly_name").notNullable();
    t.jsonb("aliases").defaultTo("[]");
    t.jsonb("read_roles").defaultTo("[]");
    t.jsonb("write_roles").defaultTo("[]");
    t.text("color");
    t.boolean("active").defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("notes", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.text("name").unique().notNullable();
    t.text("friendly_name").notNullable();
    t.jsonb("aliases").defaultTo("[]");
    t.jsonb("read_roles").defaultTo("[]");
    t.jsonb("write_roles").defaultTo("[]");
    t.boolean("active").defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("facts", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.text("key").unique().notNullable();
    t.text("value").notNullable();
    t.jsonb("tags").defaultTo("[]");
    t.jsonb("read_roles").defaultTo("[]");
    t.jsonb("write_roles").defaultTo("[]");
    t.boolean("active").defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("recipes", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.increments("readable_id").unsigned().unique().notNullable();
    t.text("url").nullable();
    t.text("title").notNullable();
    t.integer("servings");
    t.integer("prep_time_minutes");
    t.integer("cook_time_minutes");
    t.boolean("active").defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("ingredients", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.uuid("recipe_id").references("id").inTable("recipes").notNullable();
    t.text("name").notNullable();
    t.decimal("quantity", 12, 4);
    t.text("unit");
    t.text("notes");
    t.boolean("active").defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // Add default users
  await knex("users").insert([
    {
      id: "00000000-0000-0000-0000-000000000000",
      name: "Admin",
      role: "admin",
      phone_number: "+10000000000",
      access_code_hash: await bcrypt.hash("0000", 10),
      timezone: "America/Eastern",
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Automation",
      role: "automation",
      phone_number: "+10000000001",
      access_code_hash: await bcrypt.hash("1111", 10),
      timezone: "America/Eastern",
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      name: "ReadOnly",
      role: "readonly",
      phone_number: "+10000000002",
      timezone: "America/Eastern",
      access_code_hash: await bcrypt.hash("2222", 10),
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);

  // Add Default App Config
  await knex("app_config").insert([
    {
      key: "ZIP_CODE",
      value: "90210",
      description: "Default zip code for weather",
      active: true,
    },
    {
      key: "AI_NAME",
      value: "Phil",
      description: "Friendly name of the AI",
      active: true,
    },
    {
      key: "LLM_MAX_TURNS",
      value: "25",
      description: "Maximum agent turns per request",
      active: true,
    },
    {
      key: "READONLY_USER_ID",
      value: "22222222-2222-2222-2222-222222222222",
      description: "User Id for the ReadOnly user",
      active: true,
    },
  ]);

  // Add Default Tools
  const ROLES = ["admin", "parent", "child", "guest", "readonly", "automation"];
  const ADMIN_ONLY = ["admin"];
  const ADMIN_PARENT = ["admin", "parent"];

  const toolData = [
    // === BRIEFINGS ===
    {
      name: "get-daily-briefing",
      friendly_name: "Get Daily Briefing",
      hints: "calendar, weather, devices, lists",
      request_roles: ROLES,
      write_roles: ROLES,
      notify_roles: [],
    },
    {
      name: "get-weekly-briefing",
      friendly_name: "Get Weekly Briefing",
      hints: "next 7 days focus",
      request_roles: ROLES,
      write_roles: ROLES,
      notify_roles: [],
    },

    // === CALENDAR ===
    {
      name: "add-event-to-calendar",
      friendly_name: "Add Event to Calendar",
      hints: "",
      request_roles: ROLES,
      write_roles: ADMIN_PARENT,
      notify_roles: ADMIN_PARENT,
    },
    {
      name: "discover-calendars",
      friendly_name: "Discover Calendars",
      hints: "only for registering new calendars",
      request_roles: ADMIN_ONLY,
      write_roles: ADMIN_ONLY,
      notify_roles: [],
    },
    {
      name: "get-calendar-events",
      friendly_name: "Get Calendar Events",
      hints: "",
      request_roles: ROLES,
      write_roles: ROLES,
      notify_roles: [],
    },
    {
      name: "list-calendars",
      friendly_name: "List Calendars",
      hints: "",
      request_roles: ROLES,
      write_roles: ROLES,
      notify_roles: [],
    },
    {
      name: "register-calendar",
      friendly_name: "Register Calendar",
      hints: "",
      request_roles: ADMIN_ONLY,
      write_roles: ADMIN_ONLY,
      notify_roles: [],
    },
    {
      name: "update-calendar-event",
      friendly_name: "Update Calendar Event",
      hints: "",
      request_roles: ROLES,
      write_roles: ADMIN_PARENT,
      notify_roles: ADMIN_PARENT,
    },

    // === DEVICES ===
    {
      name: "discover-devices",
      friendly_name: "Discover Devices",
      hints: "only for registering new devices",
      request_roles: ADMIN_ONLY,
      write_roles: ADMIN_ONLY,
      notify_roles: [],
    },
    {
      name: "execute-device-service",
      friendly_name: "Execute Device Action",
      hints: "",
      request_roles: ROLES,
      write_roles: ADMIN_PARENT,
      notify_roles: ADMIN_PARENT,
    },
    {
      name: "get-device-state",
      friendly_name: "Get Device State",
      hints: "",
      request_roles: ROLES,
      write_roles: ROLES,
      notify_roles: [],
    },
    {
      name: "list-devices",
      friendly_name: "List Devices",
      hints: "",
      request_roles: ROLES,
      write_roles: ROLES,
      notify_roles: [],
    },
    {
      name: "register-device",
      friendly_name: "Register Device",
      hints: "",
      request_roles: ADMIN_ONLY,
      write_roles: ADMIN_ONLY,
      notify_roles: [],
    },
    {
      name: "update-device",
      friendly_name: "Update Device",
      hints: "",
      request_roles: ADMIN_ONLY,
      write_roles: ADMIN_ONLY,
      notify_roles: [],
    },

    // === NOTES ===
    {
      name: "add-to-note",
      friendly_name: "Add to Note",
      hints: "",
      request_roles: ROLES,
      write_roles: ADMIN_PARENT,
      notify_roles: ADMIN_PARENT,
    },
    {
      name: "discover-notes",
      friendly_name: "Discover Notes",
      hints: "",
      request_roles: ADMIN_ONLY,
      write_roles: ADMIN_ONLY,
      notify_roles: [],
    },
    {
      name: "get-note",
      friendly_name: "Get Note",
      hints: "",
      request_roles: ROLES,
      write_roles: ROLES,
      notify_roles: [],
    },
    {
      name: "list-notes",
      friendly_name: "List Notes",
      hints: "",
      request_roles: ROLES,
      write_roles: ROLES,
      notify_roles: [],
    },
    {
      name: "register-note",
      friendly_name: "Register Note",
      hints: "",
      request_roles: ADMIN_ONLY,
      write_roles: ADMIN_ONLY,
      notify_roles: [],
    },

    // === NOTIFICATIONS ===
    {
      name: "add-notification-preference",
      friendly_name: "Add Notification Preference",
      hints: "",
      request_roles: ROLES,
      write_roles: ADMIN_PARENT,
      notify_roles: [],
    },
    {
      name: "list-notification-preferences",
      friendly_name: "List Notification Preferences",
      hints: "",
      request_roles: ROLES,
      write_roles: ROLES,
      notify_roles: [],
    },
    {
      name: "update-notification-preference",
      friendly_name: "Update Notification Preference",
      hints: "",
      request_roles: ROLES,
      write_roles: ADMIN_PARENT,
      notify_roles: [],
    },
    {
      name: "send-notification",
      friendly_name: "Send Notification",
      hints: "",
      request_roles: ROLES,
      write_roles: ADMIN_PARENT,
      notify_roles: ADMIN_PARENT,
    },

    // === APPROVALS & PENDING ===
    {
      name: "approve-action",
      friendly_name: "Approve Action",
      hints: "",
      request_roles: ADMIN_PARENT,
      write_roles: ADMIN_PARENT,
      notify_roles: [],
    },
    {
      name: "reject-action",
      friendly_name: "Reject Action",
      hints: "",
      request_roles: ADMIN_PARENT,
      write_roles: ADMIN_PARENT,
      notify_roles: [],
    },
    {
      name: "propose-action",
      friendly_name: "Propose Action",
      hints: "",
      request_roles: ROLES,
      write_roles: ROLES,
      notify_roles: [],
    },
    {
      name: "list-pending-actions",
      friendly_name: "List Pending Actions",
      hints: "",
      request_roles: ADMIN_PARENT,
      write_roles: ROLES,
      notify_roles: [],
    },

    // === WEATHER ===
    {
      name: "get-weather",
      friendly_name: "Get Weather",
      hints: "",
      request_roles: ROLES,
      write_roles: ROLES,
      notify_roles: [],
    },

    // === RECIPES ===
    {
      name: "add-recipe",
      friendly_name: "Add Recipe",
      hints: "",
      request_roles: ROLES,
      write_roles: ADMIN_PARENT,
      notify_roles: ADMIN_PARENT,
    },
    {
      name: "scrape-recipe",
      friendly_name: "Scrape Recipe",
      hints: "",
      request_roles: ROLES,
      write_roles: ROLES,
      notify_roles: [],
    },
    {
      name: "standardize-recipe",
      friendly_name: "Standardize Recipe",
      hints: "",
      request_roles: ROLES,
      write_roles: ROLES,
      notify_roles: [],
    },
    {
      name: "standardize-ingredients",
      friendly_name: "Standardize Ingredients",
      hints: "",
      request_roles: ROLES,
      write_roles: ROLES,
      notify_roles: [],
    },

    // === FACTS ===
    {
      name: "get-fact",
      friendly_name: "Get Fact",
      hints: "",
      request_roles: ROLES,
      write_roles: ROLES,
      notify_roles: [],
    },
    {
      name: "list-facts",
      friendly_name: "List Facts",
      hints: "",
      request_roles: ROLES,
      write_roles: ROLES,
      notify_roles: [],
    },
    {
      name: "update-fact",
      friendly_name: "Update Fact",
      hints: "",
      request_roles: ROLES,
      write_roles: ADMIN_PARENT,
      notify_roles: [],
    },
    {
      name: "add-fact",
      friendly_name: "Add Fact",
      hints: "",
      request_roles: ROLES,
      write_roles: ADMIN_PARENT,
      notify_roles: [],
    },
  ];

  // Clean pass: Stringify all arrays for JSONB columns in one go
  const rows = toolData.map((tool) => ({
    ...tool,
    request_roles: JSON.stringify(tool.request_roles),
    write_roles: JSON.stringify(tool.write_roles),
    notify_roles: JSON.stringify(tool.notify_roles),
  }));

  await knex("tools").insert(rows);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("ingredients");
  await knex.schema.dropTableIfExists("recipes");
  await knex.schema.dropTableIfExists("facts");
  await knex.schema.dropTableIfExists("notes");
  await knex.schema.dropTableIfExists("calendars");
  await knex.schema.dropTableIfExists("devices");
  await knex.schema.dropTableIfExists("notification_preferences");
  await knex.schema.dropTableIfExists("notification_queue");
  await knex.schema.dropTableIfExists("notification_log");
  await knex.schema.dropTableIfExists("logs");
  await knex.schema.dropTableIfExists("ai_audit");
  await knex.schema.dropTableIfExists("audit");
  await knex.schema.dropTableIfExists("chat_sessions");
  await knex.schema.dropTableIfExists("app_config");
  await knex.schema.dropTableIfExists("pending_actions");
  await knex.schema.dropTableIfExists("tools");
  await knex.schema.dropTableIfExists("users");
}
