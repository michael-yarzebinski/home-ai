CRITICAL FUNCTIONAL REQUIREMENTS (RESTORE FROM RECENT REFINEMENTS)

1. Admin Dashboard (Telemetry Hub) - RESTORE PRECISION

Metric Cards: Must include real-time gauges for "System Load," "Memory Pressure," "API Latency," and "Active Streams."

Primary Visualization: A Recharts AreaChart showing a 24-hour log of "Intelligence Hits" vs "System Errors."

Live Feed: A high-density terminal-style log at the bottom for "System Events" (text-xs, monochromatic).

2. Entity Management (Search & CRUD) - SCHEMA LOCK

Domain Persistence: Ensure that switching from FACTS to DEVICES updates the table headers dynamically.

Search Logic: The search bar must filter by any field in the active DTO.

Action Menu: Every row must have a "Quick Action" flyout:

Facts: "Verify Source"

Recipes: "Run Now"

Devices: "Toggle Power"

3. Kitchen Hub (Director Mode) - BEHAVIOR LOCK

Image Source: Pull from the photos array in state.

Action Queue Logic: This is not a static list. It must reflect NOTIFICATIONS with a status: "PENDING" flag.

Clock: Must be real-time (update every minute).

4. Navigation Architecture

Sidebar must follow the specific grouping: Admin (Dashboard, Search) -> Chat (Concierge) -> User (Home, Notifications, etc).

Header must remain: Hamburger | Title | [Spacer] | Alerts | Settings | Profile.