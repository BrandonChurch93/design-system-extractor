// The token rules' numbers (docs/specs/token-clustering.md). The ΔE threshold is shown in the Tokens caption.

export const CLUSTER_DELTA_E = 2.3;
export const ALPHA_MATCH = 0.05;
export const NEUTRAL_CHROMA = 0.03;
export const SEMANTIC_SHARE = 0.7;
export const COLOR_CAP = 80;

export const TYPE_CAP = 24;
export const TYPE_MIN_ELEMENTS = 3;

export const SPACE_MIN = 1;
export const SPACE_MAX = 200;
export const SPACE_STEP_CAP = 12;
export const OFF_GRID_SHARE = 0.02;
export const BASE_SHARE = 0.85;

export const RADIUS_CAP = 6;
export const PILL_RADIUS = 999;
export const SHADOW_BUCKETS = 3;
export const SHADOW_NAMES = ['sm', 'md', 'lg'] as const;
export const BREAKPOINT_CAP = 6;

/** Twelve hue words by OKLCH hue, each band starting at `from` degrees (D-051). */
export const hueBands = [
  { word: 'pink', from: 0 },
  { word: 'red', from: 15 },
  { word: 'orange', from: 40 },
  { word: 'amber', from: 65 },
  { word: 'yellow', from: 90 },
  { word: 'lime', from: 115 },
  { word: 'green', from: 135 },
  { word: 'teal', from: 165 },
  { word: 'cyan', from: 200 },
  { word: 'blue', from: 230 },
  { word: 'indigo', from: 275 },
  { word: 'violet', from: 295 },
  { word: 'pink', from: 325 },
] as const;

export function hueWord(h: number): string {
  const hue = ((h % 360) + 360) % 360;
  let word: string = hueBands[0].word;
  for (const b of hueBands) if (hue >= b.from) word = b.word;
  return word;
}

/** The lightness step of a name: gray-50 for the lightest to 950 for the darkest. */
export function lightnessStep(l: number): number {
  const steps: [number, number][] = [
    [0.97, 50],
    [0.93, 100],
    [0.87, 200],
    [0.78, 300],
    [0.66, 400],
    [0.55, 500],
    [0.44, 600],
    [0.34, 700],
    [0.24, 800],
    [0.15, 900],
  ];
  for (const [min, step] of steps) if (l >= min) return step;
  return 950;
}

export type SemanticRole = 'success' | 'warning' | 'danger' | 'info';

/** The semantic role a hue can carry; null when it fits no band and the cluster stays brand. */
export function semanticRoleOf(h: number): SemanticRole | null {
  if (h >= 120 && h <= 170) return 'success';
  if (h >= 40 && h <= 95) return 'warning';
  if (h < 40 || h >= 330) return 'danger';
  if (h >= 200 && h <= 280) return 'info';
  return null;
}
