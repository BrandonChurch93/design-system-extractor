import { ordinalWords } from '@dse/schema';
import { ancestors, descendants } from '../capture/snapshot';
import type { Item } from './items';

// Names are never numeric (D-084, D-089): a name that repeats takes the context it sits in, then the
// page's last path segment, then an ordinal word.

const landmarks: Record<string, string> = { header: 'header', footer: 'footer', nav: 'nav', aside: 'aside' };
const roleLandmarks: Record<string, string> = { banner: 'header', contentinfo: 'footer', navigation: 'nav', complementary: 'aside' };

/** The page's last path segment, without an extension; the home page is `home`. */
export function pageSegment(path: string): string {
  const seg = decodeURIComponent(path.replace(/\/+$/, '').split('/').pop() ?? '')
    .replace(/\.[a-z0-9]+$/i, '')
    .toLowerCase();
  return seg && seg !== 'index' ? seg : 'home';
}

/** The nearest ancestor landmark, or section with a heading (its first two words), else the page's last path segment. */
export function contextOf(it: Item): string {
  for (const a of ancestors(it.snapshot, it.el)) {
    const byRole = a.role ? roleLandmarks[a.role] : undefined;
    if (byRole) return byRole;
    if (landmarks[a.tag]) return landmarks[a.tag]!;
    if (a.tag === 'section') {
      const h = descendants(it.snapshot, a).find((d) => /^h[1-6]$/.test(d.tag) && d.text.trim());
      if (h) return h.text.trim().toLowerCase().split(/\s+/).slice(0, 2).join(' ').replace(/[^\p{L}\p{N} ]/gu, '');
    }
  }
  return pageSegment(it.page.path);
}

const units = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const onesOrd = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const teens = ['tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth'];

/** An ordinal in words, from second to nine hundred ninety-ninth (written without a hyphen). */
export function ordinal(n: number): string {
  if (n >= 2 && n <= ordinalWords.length + 1) return ordinalWords[n - 2]!;
  const h = Math.floor(n / 100);
  const r = n % 100;
  const head = h ? `${units[h]} hundred` : '';
  if (!r) return `${head}th`;
  const t = Math.floor(r / 10);
  const o = r % 10;
  const tail = r < 10 ? onesOrd[r]! : r < 20 ? teens[r - 10]! : o === 0 ? `${tens[t]!.replace(/y$/, 'ie')}th` : `${tens[t]} ${onesOrd[o]}`;
  return head ? `${head} ${tail}` : tail;
}

export const endsInDigit = (name: string) => /\d\s*\)?$/.test(name.trim());

/**
 * Makes every name unique in first-seen order: the first keeps its name, later ones take
 * `{name} ({context})`, then `({context}, {segment})`, then `({context}, {ordinal})`. A name ending in a
 * number is renamed the same way. Returns the renames of numeric names, for the event line.
 */
export function uniqueNames(list: { name: string; first: Item }[]): { from: string; to: string }[] {
  const taken = new Set<string>();
  const renamed: { from: string; to: string }[] = [];
  for (const w of list) {
    const numeric = endsInDigit(w.name);
    const base = numeric ? w.name.replace(/\s*\d+\s*$/, '').trim() || w.name : w.name;
    if (!numeric && !taken.has(w.name.toLowerCase())) {
      taken.add(w.name.toLowerCase());
      continue;
    }
    const ctx = contextOf(w.first);
    const seg = pageSegment(w.first.page.path);
    const tries = [`${base} (${ctx})`, ...(seg !== ctx ? [`${base} (${ctx}, ${seg})`] : [])];
    for (let n = 2; n < 1000; n++) tries.push(`${base} (${ctx}, ${ordinal(n)})`);
    const name = tries.find((t) => !taken.has(t.toLowerCase()))!;
    taken.add(name.toLowerCase());
    if (numeric) renamed.push({ from: w.name, to: name });
    w.name = name;
  }
  return renamed;
}

/** Kebab case of a name, unique in the run: a repeated slug takes the next free ordinal word. */
export function slugsOf(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((n) => {
    const base =
      n
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'component';
    let slug = base;
    for (let k = 2; used.has(slug); k++) slug = `${base}-${ordinal(k).replace(/ /g, '-')}`;
    used.add(slug);
    return slug;
  });
}
