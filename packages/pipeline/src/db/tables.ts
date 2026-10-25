import { sql } from 'drizzle-orm';
import { boolean, index, integer, jsonb, pgEnum, pgTable, primaryKey, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { BlockedReason, EventLevel, PageStatus, RunStatus, Stage } from '@dse/schema/enums';

const tuple = <T extends string>(values: readonly T[]) => values as [T, ...T[]];

export const runStatus = pgEnum('run_status', tuple(RunStatus.options));
export const blockedReason = pgEnum('blocked_reason', tuple(BlockedReason.options));
export const stage = pgEnum('stage', tuple(Stage.options));
export const eventLevel = pgEnum('event_level', tuple(EventLevel.options));
export const pageStatus = pgEnum('page_status', tuple(PageStatus.options));

const tz = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });

export const runs = pgTable(
  'runs',
  {
    id: text('id').primaryKey(),
    url: text('url').notNull(),
    host: text('host').notNull(),
    status: runStatus('status').notNull().default('queued'),
    blockedReason: blockedReason('blocked_reason'),
    blockedDetail: jsonb('blocked_detail'),
    ownerId: text('owner_id'),
    visitorId: text('visitor_id').notNull(),
    byoKey: boolean('byo_key').notNull().default(false),
    priority: integer('priority').notNull().default(0),
    pageCap: integer('page_cap').notNull(),
    includeUrls: text('include_urls').array().notNull().default(sql`'{}'::text[]`),
    viewports: text('viewports').array().notNull().default(sql`'{desktop,mobile}'::text[]`),
    pipelineVersion: text('pipeline_version').notNull(),
    document: jsonb('document').notNull(),
    stats: jsonb('stats'),
    cost: jsonb('cost'),
    frameworkHint: text('framework_hint'),
    isShowcase: boolean('is_showcase').notNull().default(false),
    unpublished: boolean('unpublished').notNull().default(false),
    createdAt: tz('created_at').notNull().defaultNow(),
    startedAt: tz('started_at'),
    finishedAt: tz('finished_at'),
    durationMs: integer('duration_ms'),
    retentionUntil: tz('retention_until'),
    qaFrozen: boolean('qa_frozen').notNull().default(false),
  },
  (t) => [
    index('runs_host_idx').on(t.host),
    index('runs_visitor_created_idx').on(t.visitorId, t.createdAt),
    index('runs_status_idx').on(t.status),
    index('runs_retention_idx').on(t.retentionUntil),
  ],
);

export const runPages = pgTable(
  'run_pages',
  {
    id: text('id').notNull(),
    runId: text('run_id')
      .notNull()
      .references(() => runs.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    path: text('path').notNull(),
    reason: text('reason').notNull(),
    templateGroup: text('template_group'),
    templateSize: integer('template_size'),
    selected: boolean('selected').notNull().default(false),
    order: integer('order').notNull(),
    status: pageStatus('status').notNull().default('pending'),
    nodeCount: integer('node_count').notNull().default(0),
    captureDesktopKey: text('capture_desktop_key'),
    captureMobileKey: text('capture_mobile_key'),
    title: text('title').notNull().default(''),
    h1: text('h1').notNull().default(''),
  },
  (t) => [primaryKey({ columns: [t.runId, t.id] })],
);

export const runEvents = pgTable(
  'run_events',
  {
    id: serial('id').primaryKey(),
    runId: text('run_id')
      .notNull()
      .references(() => runs.id, { onDelete: 'cascade' }),
    ts: tz('ts').notNull().defaultNow(),
    stage: stage('stage').notNull(),
    substage: text('substage'),
    level: eventLevel('level').notNull().default('info'),
    message: text('message').notNull(),
    data: jsonb('data'),
  },
  (t) => [index('run_events_run_id_idx').on(t.runId, t.id)],
);

export const visitors = pgTable('visitors', {
  id: text('id').primaryKey(),
  firstSeen: tz('first_seen').notNull().defaultNow(),
  lastSeen: tz('last_seen').notNull().defaultNow(),
  runsTotal: integer('runs_total').notNull().default(0),
});

// V2 seams: present, unused in v1 (docs/specs/v2-seams.md).
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  createdAt: tz('created_at').notNull().defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  providerRef: text('provider_ref').notNull(),
  plan: text('plan').notNull(),
  status: text('status').notNull(),
  currentPeriodEnd: tz('current_period_end'),
});

export type RunRow = typeof runs.$inferSelect;
export type NewRunRow = typeof runs.$inferInsert;
export type RunPageRow = typeof runPages.$inferSelect;
export type RunEventRow = typeof runEvents.$inferSelect;
