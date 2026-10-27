import type { FontFamily, TypeRole, TypeToken } from '@dse/schema';
import { stableId } from '../ids';
import type { RawTokens, RawType } from './collect';
import { TYPE_CAP, TYPE_MIN_ELEMENTS } from './constants';

// Type (docs/specs/token-clustering.md, Type): exact tuples, roles, families.

const bodyTags = ['p', 'li', 'td', 'span', 'div'];

export const isMonospace = (t: Pick<RawType, 'family' | 'fallbackStack'>) => /mono|courier|consolas|menlo|monaco/i.test(t.family) || /\bmonospace\b/i.test(t.fallbackStack);

const tagCount = (t: RawType, tags: readonly string[]) => tags.reduce((s, tag) => s + (t.tags.get(tag) ?? 0), 0);
const hasHeading = (t: RawType) => [...t.tags.keys()].some((k) => /^h[1-6]$/.test(k));

/**
 * Roles from size against body, never from tags (D-087): body is the most common tuple on running-text
 * tags; the rest by ratio, then the small styles by size and weight; monospace is code; the rest text.
 */
export function assignRoles(types: RawType[]): Map<RawType, TypeRole> {
  const roles = new Map<RawType, TypeRole>();
  for (const t of types) if (isMonospace(t)) roles.set(t, 'code');
  const open = () => types.filter((t) => !roles.has(t));
  const body =
    open()
      .filter((t) => tagCount(t, bodyTags) > 0)
      .sort((a, b) => tagCount(b, bodyTags) - tagCount(a, bodyTags) || b.count - a.count || a.key.localeCompare(b.key))[0] ?? [...open()].sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))[0];
  if (!body) return roles;
  roles.set(body, 'body');
  for (const t of open()) {
    const ratio = t.size / body.size;
    const less = body.size - t.size;
    const em = t.letterSpacing / t.size;
    // Weight 400 in the rules reads as "not a label weight": below 500 (D-090).
    const light = t.weight < 500;
    if (ratio >= 2.5) roles.set(t, 'display');
    else if (ratio >= 1.75) roles.set(t, 'title');
    else if (ratio >= 1.35) roles.set(t, 'heading');
    else if (ratio >= 1.1) roles.set(t, 'subheading');
    else if (t.textTransform === 'uppercase' && em >= 0.04 - 1e-9 && t.size <= body.size) roles.set(t, 'eyebrow');
    else if (Math.abs(less) <= 1 && t.weight >= 500) roles.set(t, 'label');
    else if (less >= 1 && less <= 2 && light) roles.set(t, 'body-sm');
    else if (less >= 3 && light) roles.set(t, 'caption');
    else roles.set(t, 'text');
  }
  return roles;
}

const smaller = ['sm', 'xs', 'xxs'];
const larger = ['lg', 'xl', 'xxl'];

/**
 * Names: the role, `text-{size}` for text; the second and later tuples of one name take words, not
 * numbers, against the first: weight (`-strong`, `-soft`), size graded by rank (`-sm`, `-xs`, `-xxs`;
 * `-lg`, `-xl`, `-xxl`), tracking (`-wide`), joined while a name is taken. Past the words a tuple is
 * named by its size, as text is; one that differs in nothing nameable merges into the one holding the
 * name (D-087, D-089, D-090).
 */
export function nameTypes(types: RawType[], roles: Map<RawType, TypeRole>): { names: Map<RawType, string>; mergedInto: Map<RawType, RawType> } {
  const names = new Map<RawType, string>();
  const mergedInto = new Map<RawType, RawType>();
  const holder = new Map<string, RawType>();
  const baseOf = (t: RawType) => (roles.get(t) === 'text' ? `text-${Math.round(t.size)}` : roles.get(t)!);
  const groups = new Map<string, RawType[]>();
  for (const t of types) groups.set(baseOf(t), [...(groups.get(baseOf(t)) ?? []), t]);
  for (const [base, group] of groups) {
    const sorted = [...group].sort((a, b) => b.size - a.size || b.weight - a.weight || b.count - a.count || a.key.localeCompare(b.key));
    const first = sorted[0]!;
    names.set(first, base);
    holder.set(base, first);
    const down = [...new Set(sorted.filter((t) => t.size < first.size).map((t) => t.size))].sort((a, b) => b - a);
    const up = [...new Set(sorted.filter((t) => t.size > first.size).map((t) => t.size))].sort((a, b) => a - b);
    for (const t of sorted.slice(1)) {
      // A role that already says small grades on from it: body-sm, then body-xs, never body-sm-sm (D-090).
      const small = base.endsWith('-sm') && t.size < first.size;
      const sizeWord = t.size < first.size ? ((small ? smaller.slice(1) : smaller)[down.indexOf(t.size)] ?? '') : t.size > first.size ? (larger[up.indexOf(t.size)] ?? '') : '';
      const words = [t.weight > first.weight ? 'strong' : t.weight < first.weight ? 'soft' : '', sizeWord ? `size:${sizeWord}` : '', t.letterSpacing > first.letterSpacing ? 'wide' : ''].filter(Boolean);
      let name = base;
      for (const w of words) {
        name = w.startsWith('size:') ? (small ? `${name.replace(/-sm(?=-|$)/, '')}-${w.slice(5)}` : `${name}-${w.slice(5)}`) : `${name}-${w}`;
        if (!holder.has(name)) break;
      }
      if (holder.has(name) && t.size !== holder.get(name)!.size) name = `${base}-${Math.round(t.size)}`;
      if (holder.has(name)) {
        mergedInto.set(t, holder.get(name)!);
        continue;
      }
      names.set(t, name);
      holder.set(name, t);
    }
  }
  return { names, mergedInto };
}

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
