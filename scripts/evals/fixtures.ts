// The eval fixtures and their floors (docs/evals.md, Thresholds).
export const evalFixtures = ['clean', 'messy', 'tailwind', 'css-in-js', 'library'] as const;
export type EvalFixture = (typeof evalFixtures)[number];

export type Floors = {
  tokens: { precision: number; recall: number };
  components: { precision: number; recall: number };
  variants: number;
  states: number;
  checks: { failures: number; passes: number };
  drift: { recall?: number; falseFindings?: number };
  liveRate: number;
  motion: { patternRecall: number };
};

export const floors: Record<EvalFixture, Floors> = {
  clean: { tokens: { precision: 1.0, recall: 0.98 }, components: { precision: 0.95, recall: 0.95 }, variants: 0.95, states: 0.95, checks: { failures: 1, passes: 1 }, drift: { falseFindings: 0 }, liveRate: 0.9, motion: { patternRecall: 0.9 } },
  messy: { tokens: { precision: 0.97, recall: 0.98 }, components: { precision: 0.9, recall: 0.9 }, variants: 0.9, states: 0.9, checks: { failures: 1, passes: 1 }, drift: { recall: 1 }, liveRate: 0.85, motion: { patternRecall: 0.9 } },
  tailwind: { tokens: { precision: 0.98, recall: 0.96 }, components: { precision: 0.92, recall: 0.9 }, variants: 0.9, states: 0.9, checks: { failures: 1, passes: 1 }, drift: { falseFindings: 0 }, liveRate: 0.9, motion: { patternRecall: 0.9 } },
  'css-in-js': { tokens: { precision: 0.96, recall: 0.95 }, components: { precision: 0.88, recall: 0.87 }, variants: 0.85, states: 0.9, checks: { failures: 1, passes: 1 }, drift: { falseFindings: 0 }, liveRate: 0.75, motion: { patternRecall: 0.9 } },
  library: { tokens: { precision: 0.99, recall: 0.97 }, components: { precision: 0.95, recall: 0.93 }, variants: 0.9, states: 0.9, checks: { failures: 1, passes: 1 }, drift: { falseFindings: 0 }, liveRate: 0.9, motion: { patternRecall: 0.9 } },
};
