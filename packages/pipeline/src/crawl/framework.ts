import type { FrameworkHint } from '@dse/schema';

/** The framework hint from the start page's class tokens (docs/specs/crawler.md). */
export function frameworkHint(classLists: string[][]): FrameworkHint | undefined {
  const tw = /^(flex|grid|px-\d|py-\d|text-\w+-\d{2,3}|bg-\w+-\d{2,3})$/;
  const bs = /^(btn|container|row|col-\w+)$/;
  const count = (re: RegExp) => classLists.filter((l) => l.some((c) => re.test(c))).length;
  if (count(tw) >= 20) return 'tailwind';
  if (count(bs) >= 20) return 'bootstrap';
  if (count(/^Mui\w+/) > 0) return 'mui';
  if (count(/^chakra-/) > 0) return 'chakra';
  const all = classLists.flat();
  if (all.length) {
    // The capture spec's definition of hashed also covers styled-components' sc- prefix.
    const hashed = all.filter((c) => /^[a-zA-Z_-]*[0-9a-f]{5,}/.test(c) || /^css-[a-z0-9]+/.test(c) || /^sc-[A-Za-z0-9]+/.test(c)).length;
    if (hashed / all.length > 0.5) return 'css-in-js';
  }
  return undefined;
}
