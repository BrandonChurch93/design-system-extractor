// Formatting by the copy rules (docs/design/copy.md, Rules 4 and 9). Dates read in UTC so a run
// shows the same day to every reader and in every screenshot.

const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

/** Rule 9: numbers under ten in running sentences are words. */
export function numberWord(n: number): string {
  return Number.isInteger(n) && n >= 0 && n < 10 ? words[n]! : count(n);
}

/** Tabular counts with thousands separators: "1,044". */
export function count(n: number): string {
  return n.toLocaleString('en-US');
}

/** "2 min 41 s", "41 s", "1 h 4 min". */
export function duration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${s % 60} s`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

/** "$0.41"; a run that cost something under a cent reads "$0.01". */
export function cost(usd: number): string {
  if (usd > 0 && usd < 0.01) return '$0.01';
  return `$${usd.toFixed(2)}`;
}

/** Dollars for meters: "$1.94". */
export function dollars(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Oct 12 2026" (the run meta line). */
export function runDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()} ${d.getUTCFullYear()}`;
}

/** "Oct 12" (Recent runs, Compare buttons). */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** "16:04" in the reader's own clock (Recent runs). */
export function clock(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "00:12.4": a log line's offset from the run start. */
export function logOffset(ts: string, start: string): string {
  const ms = Math.max(0, Date.parse(ts) - Date.parse(start));
  const m = Math.floor(ms / 60_000);
  const s = (ms % 60_000) / 1000;
  return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
}

/** "4 KB" for an export's size; under a kilobyte reads "1 KB". */
export function fileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** A ratio as copy writes it: floored to one decimal, "4.1:1" (D-051). */
export function ratio(r: number): string {
  return `${(Math.floor(r * 10) / 10).toFixed(1)}:1`;
}

/** Joins with the interpunct the copy uses between facts. */
export const dots = (parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' · ');

/** "1 page" or "{n} pages" per the copy's singular forms. */
export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many.replace('{n}', count(n));
}
