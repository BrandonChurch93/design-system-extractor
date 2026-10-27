import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import * as schema from '../src';
import { completeRun, partialsByStage } from './fixtures/complete-run';

const copyMd = readFileSync(resolve(import.meta.dirname, '../../../docs/design/copy.md'), 'utf8');
const dataModelMd = readFileSync(resolve(import.meta.dirname, '../../../docs/specs/data-model.md'), 'utf8');

describe('run document', () => {
  it('validates a complete document', () => {
    const r = schema.RunDocumentComplete.safeParse(completeRun);
    expect(r.success, r.success ? '' : z.prettifyError(r.error)).toBe(true);
  });

  it('validates the partial document after every stage', () => {
    const stages = partialsByStage(completeRun);
    expect(stages.map((s) => s.stage)).toEqual([
      'queue',
      'discover',
      'select',
      'capture',
      'tokens:palette',
      'tokens:type',
      'tokens:space',
      'tokens:motion',
      'components',
      'previews',
      'checks',
      'drift',
      'exports',
      'done',
    ]);
    for (const { stage, doc } of stages) {
      const r = schema.RunDocumentPartial.safeParse(doc);
      expect(r.success, `${stage}: ${r.success ? '' : z.prettifyError(r.error)}`).toBe(true);
    }
  });

  it('rejects a partial document as complete', () => {
    const tokensOnly = partialsByStage(completeRun).find((s) => s.stage === 'tokens:space')!.doc;
    expect(schema.RunDocumentComplete.safeParse(tokensOnly).success).toBe(false);
  });

  it('rejects invalid enum values', () => {
    const cases: [string, unknown][] = [
      ['status', { ...completeRun, status: 'paused' }],
      ['blocked reason', { ...completeRun, blockedReason: 'captcha' }],
      ['framework hint', { ...completeRun, frameworkHint: 'svelte' }],
      ['page reason', { ...completeRun, pages: [{ ...completeRun.pages[0], reason: 'pricing' }] }],
      ['component type', { ...completeRun, components: [{ ...completeRun.components[0], type: 'carousel' }] }],
      ['state', { ...completeRun, components: [{ ...completeRun.components[0], states: [{ state: 'pressed', captured: true, delta: [] }] }] }],
      ['check', { ...completeRun, checks: { ...completeRun.checks, byCheck: [{ check: 'contrast-aa', passed: 0, applicable: 0, failing: [] }] } }],
      ['color group', { ...completeRun, tokens: { ...completeRun.tokens, colors: [{ ...completeRun.tokens.colors[0], group: 'accent' }] } }],
      ['viewport', { ...completeRun, viewports: ['tablet'] }],
    ];
    for (const [what, doc] of cases) expect(schema.RunDocumentComplete.safeParse(doc).success, what).toBe(false);
  });

  it('rejects malformed ids and hex values', () => {
    expect(schema.RunId.safeParse('ABC123def4').success).toBe(false);
    expect(schema.RunId.safeParse('abc123def45').success).toBe(false);
    expect(schema.EntityId.safeParse('abc12345').success).toBe(true);
    expect(schema.Hex.safeParse('#0b1f3a').success).toBe(false);
    expect(schema.Hex.safeParse('#0B1F3A80').success).toBe(true);
  });

  it('generates ids of the right shape', () => {
    for (let i = 0; i < 200; i++) {
      expect(schema.RunId.safeParse(schema.newRunId()).success).toBe(true);
      expect(schema.EntityId.safeParse(schema.newId()).success).toBe(true);
      expect(schema.VisitorId.safeParse(schema.newVisitorId()).success).toBe(true);
    }
  });
});

describe('enums and labels', () => {
  const enumNames = Object.keys(schema.enums) as schema.EnumName[];

  it('defines every enum named in data-model.md', () => {
    const listLine = dataModelMd.split('\n').find((l) => l.startsWith('Enums (`packages/schema/src/enums.ts`)'));
    expect(listLine).toBeDefined();
    const named = [...listLine!.matchAll(/`([A-Z][A-Za-z]+)`/g)].map((m) => m[1]);
    expect(named.length).toBeGreaterThan(20);
    for (const name of named) expect(enumNames, name).toContain(name);
  });

  it('has a label for every value of every enum', () => {
    for (const name of enumNames) {
      const values = schema.enums[name].options as readonly string[];
      const map = schema.labels[name] as Record<string, string>;
      expect(Object.keys(map).sort(), name).toEqual([...values].sort());
      for (const v of values) expect(map[v]?.trim().length, `${name}.${v}`).toBeGreaterThan(0);
    }
  });

  it('takes every label verbatim from copy.md', () => {
    const all = enumNames.flatMap((name) => Object.values(schema.labels[name] as Record<string, string>));
    const v = schema.variantWords;
    const extra = [...Object.values(schema.checkDescriptions), schema.frameworkDetected, v.single, ...v.ranked, v.outlined, v.ghost, v.small, v.large, ...Object.values(v.third), ...schema.ordinalWords.slice(0, 3), ...Object.values(schema.durationRoleLabels)];
    for (const label of [...all, ...extra]) expect(copyMd.includes(`\`${label}\``), label).toBe(true);
  });

  it('maps every component type to a group', () => {
    for (const t of schema.ComponentType.options) expect(schema.ComponentGroup.options).toContain(schema.componentGroupOf[t]);
  });

  it('fills placeholders', () => {
    expect(schema.fill(schema.pageReasonLabels.template, { group: 'docs', n: 212 })).toBe('docs template, 1 of 212');
    expect(schema.fill('{a} and {b}', { a: 1 })).toBe('1 and {b}');
  });
});

describe('types named in data-model.md', () => {
  const names = [
    'RunDocumentPartial',
    'RunDocumentComplete',
    'Page',
    'CaptureRef',
    'ColorToken',
    'TypeToken',
    'SpaceToken',
    'RadiusToken',
    'ShadowToken',
    'OverlayToken',
    'DurationToken',
    'EasingToken',
    'Keyframes',
    'BreakpointToken',
    'SiteVariable',
    'MotionPattern',
    'ComponentMotion',
    'Component',
    'Variant',
    'Instance',
    'StateCapture',
    'Preview',
    'CheckResult',
    'CheckSummary',
    'Drift',
    'ProposedColor',
    'Cost',
    'Stats',
    'Limits',
  ];

  it('exports each as a Zod schema under the same name', () => {
    const exported = schema as unknown as Record<string, unknown>;
    for (const n of names) expect(exported[n], n).toBeInstanceOf(z.ZodType);
  });
});

describe('entitlements', () => {
  it('has the v1 free plan and the v2 placeholders', () => {
    expect(schema.plans.free).toEqual({ runsPerDay: 2, pageCap: 12, includeCap: 5, viewports: ['desktop', 'mobile'], retentionDays: 90, privateRuns: false, scheduledRuns: false, priority: 0, teamSeats: 1 });
    expect(schema.plans.pro.priority).toBe(5);
    expect(schema.plans.team.retentionDays).toBeNull();
    for (const id of schema.PlanId.options) expect(schema.Limits.safeParse(schema.plans[id]).success).toBe(true);
  });

  it('keeps byo out of plans and lifts only runs and pages', () => {
    expect(Object.keys(schema.plans)).not.toContain('byo');
    expect(schema.byoLimits.runsPerDay).toBe(Infinity);
    expect(schema.byoLimits.pageCap).toBe(40);
    expect(schema.byoLimits.includeCap).toBe(5);
  });

  it('applies the env-configured free limits', () => {
    expect(schema.planLimits('free', { DSE_VISITOR_RUNS_PER_DAY: '3', DSE_PAGE_CAP: '10' })).toMatchObject({ runsPerDay: 3, pageCap: 10 });
    expect(schema.planLimits('free', {})).toMatchObject({ runsPerDay: 2, pageCap: 12 });
    expect(schema.byoLimitsFrom({ DSE_BYO_PAGE_CAP: '30' }).pageCap).toBe(30);
  });
});

describe('api contracts', () => {
  it('accepts a run request and rejects extra fields and long include lists', () => {
    expect(schema.CreateRunBody.safeParse({ url: 'https://a.com', include: ['https://a.com/x'] }).success).toBe(true);
    expect(schema.CreateRunBody.safeParse({ url: 'https://a.com', key: 'sk-ant-x' }).success).toBe(false);
    expect(schema.CreateRunBody.safeParse({ url: 'https://a.com', include: Array(6).fill('https://a.com/x') }).success).toBe(false);
  });

  it('tells a created run from a blocked result', () => {
    expect(schema.CreateRunResponse.safeParse({ id: 'abc123def4', runsLeft: 1 }).success).toBe(true);
    expect(
      schema.CreateRunResponse.safeParse({ blocked: 'budget', detail: { used: 2, budget: 2, runsToday: 41, resetsAt: '2026-10-26T06:00:00.000Z' }, runsLeft: 1 }).success,
    ).toBe(true);
    expect(schema.CreateRunResponse.safeParse({ blocked: 'busy', detail: { queued: 23 }, runsLeft: null }).success).toBe(true);
  });
});

describe('env', () => {
  it('validates the example values and catches bad shapes', () => {
    const example = readFileSync(resolve(import.meta.dirname, '../../../.env.example'), 'utf8');
    const parsed = Object.fromEntries(
      example
        .split('\n')
        .filter((l) => /^[A-Z_]+=/.test(l))
        .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
    );
    const issues = schema.validateEnv(parsed).map((i) => i.key);
    expect(issues.sort()).toEqual(['ANTHROPIC_API_KEY', 'DSE_ADMIN_TOKEN', 'DSE_JOB_ENCRYPTION_KEY']);
    expect(schema.allowedPrivateHosts({ DSE_ALLOW_PRIVATE_HOSTS: 'localhost:4100,localhost:4300' })).toEqual(['localhost:4100', 'localhost:4300']);
    expect(schema.allowedPrivateHosts({ NODE_ENV: 'production', DSE_ALLOW_PRIVATE_HOSTS: 'localhost:4100' })).toEqual([]);
  });
});
