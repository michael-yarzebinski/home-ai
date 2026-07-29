import {
  Callout,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
} from 'cursor/canvas';

const phases: Array<[string, string, string, string]> = [
  ['P1', 'Finish Entity Controllers', 'API completion', 'Week 1'],
  ['P2', 'UI Continuation', 'Real-data parity + UX polish', 'Week 2'],
  ['P3', 'Queue Migration', 'Notifications + Automation via queue', 'Week 3'],
  ['P4', 'Checklists Vertical', 'End-to-end slice shipped', 'Week 4'],
  ['P5', 'Meal Prep Vertical', 'End-to-end slice shipped', 'Week 5-6'],
];

const checklistRows: Array<[string, string, string, string]> = [
  ['DB', 'Migrations + indexes', 'Schema exists, migrated, seeded', 'Shared by Checklists + Meal Prep'],
  ['Types', 'Shared Zod domain schemas', 'No duplicated DTO types', 'Keep in shared domain files'],
  ['Stores', 'CRUD/search + auth filters', 'Pagination + role checks pass', 'Use existing abstract patterns'],
  ['Service', 'Business rules', 'Deterministic behavior + logs', 'Only where logic exceeds controller'],
  ['Controller', 'User + Admin endpoints', 'Route parity complete', 'Use /api/v1 conventions'],
  ['Tools', 'AI-executable actions', 'Tools enforce auth + validation', 'Map to stores/services cleanly'],
  ['UI', 'Tables/modals/workflows', 'No mock fallback in shipped flows', 'Async/pending/error states included'],
];

const queueWorkRows: Array<[string, string, string]> = [
  ['Producer', 'Controllers/services enqueue work', 'No direct side-effect execution in request path'],
  ['Consumer', 'Worker executes job logic', 'Retries/backoff + idempotency key'],
  ['Observability', 'Queue depth + failures + processing time', 'Dashboard cards + logs'],
  ['Recovery', 'Dead-letter or failed-job handling', 'Actionable replay path'],
];

const completedNow: Array<[string, string]> = [
  ['Recipe admin controllers', 'Moved into `features/recipe-saver/controllers/admin`'],
  ['Ingredient admin controllers', 'Moved into `features/recipe-saver/controllers/admin`'],
  ['Checklist tool definitions seeded', 'Added checklist tools to `tools` table in `20260507001032_checky.ts`'],
];

export default function HomeAIRoadmapCanvas() {
  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 1080 }}>
      <Stack gap={6}>
        <H1>Home AI Delivery Roadmap!</H1>
        <Text tone="secondary" size="small">
          Execution order for backend completion, UI parity, queue migration, and two new verticals.
        </Text>
      </Stack>

      <Grid columns={4} gap={12}>
        <Stat value="5" label="Planned Phases" />
        <Stat value="2" label="New Verticals" tone="info" />
        <Stat value="7" label="Definition-of-Done Lanes" />
        <Stat value="1" label="Queue Migration Phase" tone="warning" />
      </Grid>

      <Callout tone="info" title="Recommended sequencing">
        Finish controller/API parity first, then UI parity, then queue migration. Build Checklists before Meal Prep so
        the second vertical can reuse the same delivery pattern.
      </Callout>

      <Stack gap={8}>
        <H2>Recently Completed</H2>
        <Table
          headers={['Item', 'Status']}
          rows={completedNow}
          rowTone={['success', 'success']}
        />
      </Stack>

      <Divider />

      <Stack gap={10}>
        <H2>Phase Timeline</H2>
        <Table
          headers={['Phase', 'Focus', 'Primary Outcome', 'Target']}
          rows={phases}
          rowTone={[undefined, undefined, 'warning', 'success', 'success']}
        />
      </Stack>

      <Grid columns={2} gap={16}>
        <Stack gap={10}>
          <H3>Current Priorities</H3>
          <Row gap={8} wrap>
            <Pill active tone="info">Controller Completion</Pill>
            <Pill active tone="info">UI Real Data Parity</Pill>
            <Pill tone="warning">Queue Refactor</Pill>
          </Row>
          <Text tone="secondary" size="small">
            Keep feature work behind stable API contracts to avoid UI churn.
          </Text>
        </Stack>

        <Stack gap={10}>
          <H3>Upcoming Verticals</H3>
          <Row gap={8} wrap>
            <Pill tone="success">Checklists</Pill>
            <Pill tone="success">Meal Prep</Pill>
          </Row>
          <Text tone="secondary" size="small">
            Implement both with identical lane checklist for predictable delivery.
          </Text>
        </Stack>
      </Grid>

      <Divider />

      <Stack gap={10}>
        <H2>Definition of Done (Each Vertical)</H2>
        <Table
          headers={['Lane', 'Deliverable', 'Done When', 'Notes']}
          rows={checklistRows}
          striped
        />
      </Stack>

      <Stack gap={10}>
        <H2>Queue Migration Scope (Notifications + Automation Rules)</H2>
        <Table
          headers={['Layer', 'Change', 'Acceptance']}
          rows={queueWorkRows}
          rowTone={['warning', 'warning', undefined, undefined]}
        />
      </Stack>

      <Stack gap={8}>
        <H2>Execution Cadence</H2>
        <Text>Work each phase in this order: DB → Types → Stores → Service → Controller → Tools → UI.</Text>
        <Text tone="secondary" size="small">
          Gate each phase with one smoke test pass and one integration walkthrough before starting the next.
        </Text>
      </Stack>
    </Stack>
  );
}
