import type { FontFamily, TypeRole, TypeToken } from '@dse/schema';
import { stableId } from '../ids';
import type { RawTokens, RawType } from './collect';
import { DISPLAY_MIN_WEIGHT, TYPE_CAP, TYPE_MIN_ELEMENTS } from './constants';

// Type (docs/specs/token-clustering.md, Type): exact tuples, roles, families.

const headingTags = ['h1', 'h2', 'h3', 'h4'] as const;
const bodyTags = ['p', 'li', 'td', 'span'];

export const isMonospace = (t: Pick<RawType, 'family' | 'fallbackStack'>) => /mono|courier|consolas|menlo|monaco/i.test(t.family) || /\bmonospace\b/i.test(t.fallbackStack);

const tagCount = (t: RawType, tags: readonly string[]) => tags.reduce((s, tag) => s + (t.tags.get(tag) ?? 0), 0);
const hasHeading = (t: RawType) => [...t.tags.keys()].some((k) => /^h[1-6]$/.test(k));

/** Roles in the spec's order: display, code, h1 to h4, body, then body-sm, label and caption against body. */
export function assignRoles(types: RawType[]): Map<RawType, TypeRole> {
  const roles = new Map<RawType, TypeRole>();
  const open = () => types.filter((t) => !roles.has(t));
  const display = types.filter((t) => t.homeLargest && t.weight >= DISPLAY_MIN_WEIGHT).sort((a, b) => b.size - a.size || b.count - a.count)[0];
  if (display) roles.set(display, 'display');
  for (const t of open()) if (isMonospace(t)) roles.set(t, 'code');
  for (const t of open()) {
    const top = headingTags.map((h) => ({ h, n: t.tags.get(h) ?? 0 })).sort((a, b) => b.n - a.n)[0]!;
    if (top.n > 0) roles.set(t, top.h);
  }
  const body = open()
    .filter((t) => tagCount(t, bodyTags) > 0)
    .sort((a, b) => tagCount(b, bodyTags) - tagCount(a, bodyTags) || b.count - a.count)[0];
  if (body) roles.set(body, 'body');
  for (const t of open()) {
    if (!body) break;
    const less = body.size - t.size;
    if (less >= 1 && less <= 2 && t.weight === 400) roles.set(t, 'body-sm');
    else if (less >= 1 && less <= 3 && t.weight >= 500) roles.set(t, 'label');
    else if (less >= 3 && t.weight === 400) roles.set(t, 'caption');
  }
  for (const t of open()) roles.set(t, 'other');
  return roles;
}

export function buildType(raw: RawTokens): { tokens: TypeToken[]; families: FontFamily[] } {
  const kept = [...raw.type.values()]
    .filter((t) => t.count >= TYPE_MIN_ELEMENTS || hasHeading(t) || t.pageLargest)
    .sort((a, b) => b.count - a.count || b.size - a.size || a.key.localeCompare(b.key))
    .slice(0, TYPE_CAP);
  const roles = assignRoles(kept);
  const seen = new Map<TypeRole, number>();
  const named = new Map<RawType, string>();
  for (const t of kept) {
    const role = roles.get(t)!;
    const n = (seen.get(role) ?? 0) + 1;
    seen.set(role, n);
    named.set(t, n === 1 ? role : `${role}-${n}`);
  }
  const tokens: TypeToken[] = [...kept]
    .sort((a, b) => b.size - a.size || b.weight - a.weight || b.count - a.count)
    .map((t) => ({
      id: stableId(`type:${t.key}`),
      name: named.get(t)!,
      role: roles.get(t)!,
      family: t.family,
      fallbackStack: t.fallbackStack,
      size: t.size,
      lineHeight: t.lineHeight,
      weight: t.weight,
      letterSpacing: t.letterSpacing,
      ...(t.textTransform ? { textTransform: t.textTransform } : {}),
      usage: t.count,
      pages: [...t.pages].map(([pageId, count]) => ({ pageId, count })).sort((a, b) => b.count - a.count || a.pageId.localeCompare(b.pageId)),
      sample: t.sample,
    }));
  return { tokens, families: familiesOf(tokens, raw) };
}

/** Sans body family, then the display family if different, then monospace (docs/specs/token-clustering.md). */
function familiesOf(tokens: TypeToken[], raw: RawTokens): FontFamily[] {
  const pick = (role: TypeRole) => tokens.find((t) => t.role === role);
  const order = [pick('body') ?? tokens[0], pick('display') ?? pick('h1'), pick('code')].filter(Boolean) as TypeToken[];
  const rest = tokens.filter((t) => !order.includes(t));
  const out: FontFamily[] = [];
  for (const t of [...order, ...rest]) {
    if (out.some((f) => f.name === t.family)) continue;
    const face = raw.families.get(t.family);
    const fallback = t.fallbackStack
      .split(',')
      .map((f) => f.trim().replace(/^['"]|['"]$/g, ''))
      .find((f) => f && f !== t.family);
    // A family with no @font-face is a system font, which has nothing to load.
    out.push({ name: t.family, loaded: face ? face.loaded : true, ...(fallback ? { fallback } : {}) });
  }
  return out;
}
