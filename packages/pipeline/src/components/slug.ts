import { ordinalWords } from '@dse/schema';

// Ordinal words and slugs: pure, so the browser-safe upgrade can use them.

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
