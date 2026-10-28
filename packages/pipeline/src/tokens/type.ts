import type { FontFamily, TypeRole, TypeToken } from '@dse/schema';
import { stableId } from '../ids';
import type { RawTokens, RawType } from './collect';
import { TYPE_CAP, TYPE_MIN_ELEMENTS } from './constants';
import { assignRoles, hasHeading, nameTypes } from './type-roles';

export { assignRoles, isMonospace, nameTypes } from './type-roles';

// Type (docs/specs/token-clustering.md, Type): exact tuples, roles, families.

const pagesOf = (m: Map<string, number>) => [...m].map(([pageId, count]) => ({ pageId, count })).sort((a, b) => b.count - a.count || a.pageId.localeCompare(b.pageId));

export function buildType(raw: RawTokens): { tokens: TypeToken[]; families: FontFamily[] } {
  const kept = [...raw.type.values()]
    .filter((t) => t.count >= TYPE_MIN_ELEMENTS || hasHeading(t) || t.pageLargest)
    .sort((a, b) => b.count - a.count || b.size - a.size || a.key.localeCompare(b.key))
    .slice(0, TYPE_CAP);
  const roles = assignRoles(kept);
  const { names, mergedInto } = nameTypes(kept, roles);
  const absorbed = new Map<RawType, RawType[]>();
  for (const [t, into] of mergedInto) absorbed.set(into, [...(absorbed.get(into) ?? []), t]);
  const tokens: TypeToken[] = kept
    .filter((t) => names.has(t))
    .sort((a, b) => b.size - a.size || b.weight - a.weight || b.count - a.count)
    .map((t) => {
      const all = [t, ...(absorbed.get(t) ?? [])];
      const tags = new Map<string, number>();
      const pages = new Map<string, number>();
      for (const m of all) {
        for (const [k, n] of m.tags) tags.set(k, (tags.get(k) ?? 0) + n);
        for (const [k, n] of m.pages) pages.set(k, (pages.get(k) ?? 0) + n);
      }
      return {
        id: stableId(`type:${t.key}`),
        name: names.get(t)!,
        role: roles.get(t)!,
        family: t.family,
        fallbackStack: t.fallbackStack,
        size: t.size,
        lineHeight: t.lineHeight,
        weight: t.weight,
        letterSpacing: t.letterSpacing,
        ...(t.textTransform ? { textTransform: t.textTransform } : {}),
        uppercase: t.textTransform === 'uppercase',
        tags: [...tags].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k]) => k),
        usage: all.reduce((s, m) => s + m.count, 0),
        pages: pagesOf(pages),
        sample: t.sample,
      };
    });
  return { tokens, families: familiesOf(tokens, raw) };
}

/** Sans body family, then the display family if different, then monospace (docs/specs/token-clustering.md). */
function familiesOf(tokens: TypeToken[], raw: RawTokens): FontFamily[] {
  const pick = (role: TypeRole) => tokens.find((t) => t.role === role);
  const order = [pick('body') ?? tokens[0], pick('display') ?? pick('title'), pick('code')].filter(Boolean) as TypeToken[];
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
