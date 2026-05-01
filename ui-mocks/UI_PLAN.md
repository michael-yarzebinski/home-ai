Home AI: Comprehensive Implementation Plan (V7)

🌌 Overview & Vision

A state-of-the-art "Home OS" command center. The UI must be high-contrast, data-dense but legible, utilizing a "Glassmorphism" aesthetic with deep glows, heavy rounded corners (2xl/3xl), and smooth micro-interactions.

Dynamic Domain Strategy

The UI adapts its schema based on the active domain (Monitoring vs. Knowledge Base). A centralized table rendering engine maps domain-specific columns to entity data.

Entities:

FACTS: Priority, Source, Content.

RECIPES: Title, Trigger, LastRun, Devices.

AI_AUDIT: Model, Latency, Tokens, Status.

NOTIFICATIONS: Recipient, Channel, Content, Status.

🎨 Look, Feel & UX Guidelines

Palette: Neutral-950 (Pure Black), Neutral-900 (Cards), Indigo-500 (Accent), Emerald-500 (Success).

Glassmorphism: Use backdrop-blur-md on headers and sidebars. Borders should be subtle (border-neutral-800).

Director Mode (Kitchen Hub): A high-visibility mode featuring full-screen photo rotation (15s intervals) with translucent overlay widgets for Time, Weather, and the Action Queue.

🧭 Navigation & View Architecture

1. Global Header (Order: Left to Right)

Hamburger Toggle: Controls sidebar expansion.

Home AI Title: Italicized, high-contrast branding.

: Flex-grow spacer.

Notifications: Bell icon with live status indicator.

Settings: Quick-access gear icon.

User Icon: Profile dropdown with role identification.

2. Sidebar Navigation (Gemini Style)

Sidebar defaults to Icons Only. Hamburger toggle expands it to show labels.
Navigation Order:

Admin Section:

Admin Dashboard: Data-dense telemetry and trend visualizations.

Entity Search: CRUD interface with "Active/All" status toggles.

Chat:

AI Concierge: Inviting, gradient-styled entry point for LLM interaction.

User Section:

Home: Main bento-style landing.

Pending Notifications: With a pulsing numerical badge.

Calendar: Household schedule.

Devices: Hardware management.

Recipes: Automation logic.

Footer: Settings and Display Mode (Dark/Light/Director).

🚀 Phase 1: Logic & Search Implementation

Domain Analysis: Scan CommandCenter.jsx to map required logic per domain.

Search Implementation: Implement search() methods in each store implementing the abstract class.

DTO Creation: Define search criteria in @shared/src/domain/[DOMAIN].

📡 Phase 2: Endpoint Specification (Approval Required)

Generate a comprehensive list of required endpoints for approval:

Format: Controller Name | Base Path | Endpoint (Method/Path/Payload/Response).

🛠 Phase 3: Backend Implementation

Endpoint Creation: Standardized routing based on approved specs.

Constraints:

NO CHANGES to AbstractEntityStore or AbstractMonitorStore.

NO CHANGES to original domain interfaces.

🎨 Phase 4: UI Implementation (Wiring the Mocks)

Component Patterns:

Side-by-Side Admin: Sidebar switch between "Monitoring" and "Knowledge Base".

Search & Toggle: Every entity view must include a Search bar and status filter.

Modal CRUD: Row buttons for Eye (View) and Pencil (Edit).

Telemetry Dashboard: Integrate Recharts for health gauges and trend lines.

Entity Hub: Consistent layout: Left List | Right Table with dynamic headers based on getColumns(domain).

🚦 Technical Rules

Modular Architecture: Adopt a feature-based directory structure (e.g., src/features/[domain]). Extract shared UI elements (Sidebar, Header, Table) into a src/components/ui directory. Use the "barrel" export pattern for clean imports.

Icons: Use lucide-react for all icons.

Validation: All forms validated by zod schemas.

Optimistic UI: Use TanStack Query for caching and instant UI feedback.