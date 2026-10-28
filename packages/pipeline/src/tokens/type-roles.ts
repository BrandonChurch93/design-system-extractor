import type { TypeRole } from '@dse/schema';
import type { RawType } from './collect';

// Type roles and names (docs/specs/token-clustering.md, Type). Pure, so the browser-safe upgrade can use them.

const bodyTags = ['p', 'li', 'td', 'span', 'div'];

export const isMonospace = (t: Pick<RawType, 'family' | 'fallbackStack'>) => /mono|courier|consolas|menlo|monaco/i.test(t.family) || /\bmonospace\b/i.test(t.fallbackStack);

const tagCount = (t: RawType, tags: readonly string[]) => tags.reduce((s, tag) => s + (t.tags.get(tag) ?? 0), 0);
export const hasHeading = (t: RawType) => [...t.tags.keys()].some((k) => /^h[1-6]$/.test(k));

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

