import type { CandidateSource, PageReason } from '@dse/schema';

// Both scoring passes of docs/specs/page-selection.md.

type Row = { test: (path: string, segments: string[]) => boolean; score: number; reason: PageReason; mandatory?: boolean };

const seg = (re: RegExp) => (_p: string, s: string[]) => s.some((x) => re.test(x));
const first = (re: RegExp) => (_p: string, s: string[]) => s.length === 1 && re.test(s[0]!);
const under = (re: RegExp) => (_p: string, s: string[]) => s.length >= 2 && re.test(s[0]!);

const docsRe = /^(docs|documentation|developers|api|reference|guides)$/i;
const blogRe = /^(blog|news|articles|journal)$/i;

const rows: Row[] = [
  { test: (p) => p === '/', score: 3, reason: 'home', mandatory: true },
  { test: seg(/^(pricing|plans|plan)$/i), score: 3, reason: 'tables-toggles' },
  { test: seg(/^(signup|sign-up|register|get-started|start|trial)$/i), score: 2, reason: 'forms' },
  { test: seg(/^(login|signin|sign-in)$/i), score: 2, reason: 'forms-errors' },
  { test: seg(/^(contact|demo|request-demo|support)$/i), score: 2, reason: 'forms' },
  { test: seg(/^(features|product|platform|solutions)$/i), score: 2, reason: 'nav' },
  { test: first(docsRe), score: 2, reason: 'code-blocks' },
  { test: under(docsRe), score: 1, reason: 'code-blocks' },
  { test: first(blogRe), score: 1, reason: 'list-template' },
  { test: under(blogRe), score: 1, reason: 'post-template' },
  { test: seg(/^(changelog|updates|releases)$/i), score: 2, reason: 'badges-timeline' },
  { test: seg(/^(about|team|company)$/i), score: 1, reason: 'about' },
  { test: seg(/^(careers|jobs)$/i), score: 1, reason: 'careers' },
  { test: seg(/^(settings|dashboard|app)$/i), score: 1, reason: 'app' },
];

export const sourceBonus: Record<CandidateSource, number> = {
  start: 0,
  include: 0,
  header: 1,
  nav: 1,
  footer: 0.5,
  sitemap: 0,
  body: 0,
  synthetic: 0,
};

const sourceReason: Record<CandidateSource, PageReason> = {
  start: 'home',
  include: 'added',
  header: 'nav',
  nav: 'nav',
  footer: 'footer',
  sitemap: 'sitemap',
  body: 'body',
  synthetic: 'empty-state',
};

export function segmentsOf(path: string): string[] {
  return path
    .split('?')[0]!
    .split('/')
    .filter(Boolean);
}

export type PreScore = { score: number; reason: PageReason; mandatory: boolean; matchedRow: boolean };

/** Path patterns, source bonus and depth penalty (the pass that picks what to fingerprint). */
export function preScore(path: string, source: CandidateSource): PreScore {
  const segments = segmentsOf(path);
  let score = 0;
  let best: Row | null = null;
  let mandatory = false;
  if (source === 'synthetic') {
    score += 2;
    best = { test: () => true, score: 2, reason: 'empty-state' };
  } else {
    for (const r of rows) {
      if (!r.test(path, segments)) continue;
      score += r.score;
      if (r.mandatory) mandatory = true;
      if (!best || r.score > best.score) best = r;
    }
  }
  if (source === 'include') {
    score += 10;
    mandatory = true;
    best = { test: () => true, score: 10, reason: 'added' };
  }
  score += sourceBonus[source];
  score -= 0.5 * Math.max(0, segments.length - 1);
  return { score, reason: best ? best.reason : sourceReason[source], mandatory, matchedRow: Boolean(best) };
}

/** The final score adds the template bonus and the fingerprint fetch penalty. */
export function finalScore(pre: number, opts: { templateSize?: number; fetchFailed: boolean }): number {
  let s = pre;
  if ((opts.templateSize ?? 0) >= 10) s += 0.5;
  if (opts.fetchFailed) s -= 5;
  return s;
}
