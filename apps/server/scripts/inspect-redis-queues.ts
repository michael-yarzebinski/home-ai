/**
 * Inspect Redis for leftover Home Assistant event buffers / BullMQ keys.
 *
 * The ha-events BullMQ queue was removed; device automations now run immediately.
 * This script remains useful to find stale `ha_event:*` keys from older deploys.
 *
 * Usage:
 *   npm run redis:inspect -w @home-ai/server
 *   npm run redis:inspect -w @home-ai/server -- --device-id <uuid>
 *   npm run redis:inspect -w @home-ai/server -- --keys
 *   npm run redis:inspect -w @home-ai/server -- --json
 */

import { config } from "dotenv";
import { resolve } from "path";
import Redis from "ioredis";
import { Job, Queue } from "bullmq";

config({ path: resolve(__dirname, "../../../.env") });

/** Optional legacy queue names to probe (empty after ha-events removal). */
const KNOWN_QUEUES = [] as const;
const HA_EVENT_PREFIX = "ha_event:";
const JOB_STATES = [
  "waiting",
  "active",
  "delayed",
  "completed",
  "failed",
  "paused",
] as const;

type JobState = (typeof JOB_STATES)[number];

type CliOptions = {
  queue?: string;
  jobsPerState: number;
  eventsPerBuffer: number;
  deviceId?: string;
  json: boolean;
  listKeys: boolean;
};

type EventQueueItem = {
  entityId: string;
  oldState: string;
  newState: string;
  ruleIds: string[];
};

type EventQueueBuffer = {
  events: EventQueueItem[];
  ruleIds: string[];
};

type JobSummary = {
  id: string | undefined;
  name: string;
  state: JobState;
  attemptsMade: number;
  timestamp: string | null;
  processedOn: string | null;
  finishedOn: string | null;
  delayMs: number | null;
  runAt: string | null;
  failedReason: string | null;
  data: unknown;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    jobsPerState: 10,
    eventsPerBuffer: 5,
    json: false,
    listKeys: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    switch (arg) {
      case "--queue":
      case "-q":
        options.queue = argv[++i];
        break;
      case "--jobs":
      case "-n":
        options.jobsPerState = Number(argv[++i]);
        break;
      case "--events":
      case "-e":
        options.eventsPerBuffer = Number(argv[++i]);
        break;
      case "--device-id":
      case "-d":
        options.deviceId = argv[++i];
        break;
      case "--json":
        options.json = true;
        break;
      case "--keys":
        options.listKeys = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith("-")) {
          throw new Error(`Unknown option: ${arg}`);
        }
    }
  }

  if (Number.isNaN(options.jobsPerState) || options.jobsPerState < 0) {
    throw new Error("--jobs must be a non-negative number");
  }

  if (Number.isNaN(options.eventsPerBuffer) || options.eventsPerBuffer < 0) {
    throw new Error("--events must be a non-negative number");
  }

  return options;
}

function printHelp(): void {
  console.log(`Inspect Redis queues and HA event buffers.

Options:
  -q, --queue <name>       Queue to inspect (default: all known queues)
  -n, --jobs <count>       Max jobs to show per state (default: 10)
  -e, --events <count>     Max buffered events to show per device (default: 5)
  -d, --device-id <id>     Show a specific ha_event:<deviceId> buffer
      --json               Print machine-readable JSON
      --keys               List BullMQ-related Redis keys
  -h, --help               Show this help

Known queues: ${KNOWN_QUEUES.join(", ")}
`);
}

function formatDate(value: number | undefined | null): string | null {
  if (value == null) {
    return null;
  }

  return new Date(value).toISOString();
}

function summarizeJob(job: Job, state: JobState): JobSummary {
  const delayMs = typeof job.opts.delay === "number" ? job.opts.delay : null;
  const runAt =
    state === "delayed" && job.timestamp != null && delayMs != null
      ? new Date(job.timestamp + delayMs).toISOString()
      : null;

  return {
    id: job.id,
    name: job.name,
    state,
    attemptsMade: job.attemptsMade,
    timestamp: formatDate(job.timestamp),
    processedOn: formatDate(job.processedOn),
    finishedOn: formatDate(job.finishedOn),
    delayMs,
    runAt,
    failedReason: job.failedReason ?? null,
    data: job.data,
  };
}

async function scanKeys(redis: Redis, pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = "0";

  do {
    const [nextCursor, batch] = await redis.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      100,
    );
    cursor = nextCursor;
    keys.push(...batch);
  } while (cursor !== "0");

  return keys.sort();
}

async function loadHaEventBuffers(
  redis: Redis,
  deviceId?: string,
): Promise<Array<{ deviceId: string; buffer: EventQueueBuffer }>> {
  const keys = deviceId
    ? [`${HA_EVENT_PREFIX}${deviceId}`]
    : await scanKeys(redis, `${HA_EVENT_PREFIX}*`);

  const buffers: Array<{ deviceId: string; buffer: EventQueueBuffer }> = [];

  for (const key of keys) {
    const raw = await redis.get(key);
    if (!raw) {
      continue;
    }

    try {
      buffers.push({
        deviceId: key.slice(HA_EVENT_PREFIX.length),
        buffer: JSON.parse(raw) as EventQueueBuffer,
      });
    } catch {
      buffers.push({
        deviceId: key.slice(HA_EVENT_PREFIX.length),
        buffer: {
          events: [],
          ruleIds: [],
        },
      });
    }
  }

  return buffers;
}

async function inspectQueue(
  queueName: string,
  connection: { host: string; port: number },
  jobsPerState: number,
): Promise<{
  name: string;
  counts: Record<string, number>;
  jobs: Record<JobState, JobSummary[]>;
}> {
  const queue = new Queue(queueName, { connection });
  const counts = await queue.getJobCounts(...JOB_STATES);
  const jobs = {} as Record<JobState, JobSummary[]>;

  for (const state of JOB_STATES) {
    const stateJobs =
      jobsPerState === 0
        ? []
        : await queue.getJobs([state], 0, jobsPerState - 1, false);
    jobs[state] = stateJobs.map((job) => summarizeJob(job, state));
  }

  await queue.close();

  return {
    name: queueName,
    counts,
    jobs,
  };
}

function printTextReport(
  report: {
    redis: { host: string; port: number; ping: string };
    queues: Awaited<ReturnType<typeof inspectQueue>>[];
    haEventBuffers: Awaited<ReturnType<typeof loadHaEventBuffers>>;
    bullKeys?: string[];
  },
  eventsPerBuffer: number,
): void {
  console.log("Redis queue inspection");
  console.log("======================");
  console.log(`Redis: ${report.redis.host}:${report.redis.port} (${report.redis.ping})`);
  console.log("");

  for (const queue of report.queues) {
    console.log(`Queue: ${queue.name}`);
    console.log("Counts:");
    for (const state of JOB_STATES) {
      console.log(`  ${state.padEnd(12)} ${queue.counts[state] ?? 0}`);
    }
    console.log("");

    for (const state of JOB_STATES) {
      const jobs = queue.jobs[state];
      if (jobs.length === 0) {
        continue;
      }

      console.log(`  ${state} jobs:`);
      for (const job of jobs) {
        const timing =
          job.runAt != null
            ? ` runsAt=${job.runAt}`
            : job.finishedOn != null
              ? ` finished=${job.finishedOn}`
              : "";
        console.log(
          `    - id=${job.id} name=${job.name} attempts=${job.attemptsMade}${timing}`,
        );
        console.log(`      data=${JSON.stringify(job.data)}`);
        if (job.failedReason) {
          console.log(`      failedReason=${job.failedReason}`);
        }
      }
      console.log("");
    }
  }

  console.log("HA event buffers (ha_event:<deviceId>)");
  if (report.haEventBuffers.length === 0) {
    console.log("  (none)");
  } else {
    for (const entry of report.haEventBuffers) {
      console.log(`  deviceId=${entry.deviceId}`);
      console.log(`    events=${entry.buffer.events.length}`);
      console.log(`    ruleIds=${entry.buffer.ruleIds.join(", ") || "(none)"}`);
      const visibleEvents =
        eventsPerBuffer === 0
          ? []
          : entry.buffer.events.slice(0, eventsPerBuffer);
      for (const [index, event] of visibleEvents.entries()) {
        console.log(
          `    [${index}] ${event.entityId}: ${event.oldState} -> ${event.newState} (rules=${event.ruleIds.length})`,
        );
      }
      const hiddenCount = entry.buffer.events.length - visibleEvents.length;
      if (hiddenCount > 0) {
        console.log(`    ... ${hiddenCount} more event(s) (use --events to show more)`);
      }
      console.log("");
    }
  }

  if (report.bullKeys != null) {
    console.log("BullMQ Redis keys");
    if (report.bullKeys.length === 0) {
      console.log("  (none)");
    } else {
      for (const key of report.bullKeys) {
        console.log(`  ${key}`);
      }
    }
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const host = process.env.REDIS_HOST ?? "localhost";
  const port = Number(process.env.REDIS_PORT ?? 6379);
  const connection = { host, port };

  const redis = new Redis({
    host,
    port,
    maxRetriesPerRequest: 1,
    connectTimeout: 5_000,
    lazyConnect: true,
  });

  try {
    await redis.connect();
    const ping = await redis.ping();

    const queueNames = options.queue
      ? [options.queue]
      : [...KNOWN_QUEUES];

    const [queues, haEventBuffers, bullKeys] = await Promise.all([
      Promise.all(
        queueNames.map((queueName) =>
          inspectQueue(queueName, connection, options.jobsPerState),
        ),
      ),
      loadHaEventBuffers(redis, options.deviceId),
      options.listKeys ? scanKeys(redis, "bull:*") : Promise.resolve(undefined),
    ]);

    const report = {
      redis: { host, port, ping },
      queues,
      haEventBuffers,
      bullKeys,
    };

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printTextReport(report, options.eventsPerBuffer);
    }
  } finally {
    await redis.quit();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to inspect Redis queues: ${message}`);
  process.exit(1);
});
