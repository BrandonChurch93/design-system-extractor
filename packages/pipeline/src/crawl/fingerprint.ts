import { createHash } from 'node:crypto';
import { parse, type DefaultTreeAdapterMap } from 'parse5';

type Node = DefaultTreeAdapterMap['node'];
type Element = DefaultTreeAdapterMap['element'];

function isElement(n: Node): n is Element {
  return 'tagName' in n;
}

function children(n: Node): Element[] {
  return 'childNodes' in n ? (n.childNodes as Node[]).filter(isElement) : [];
}

function find(n: Node, tag: string): Element | null {
  if (isElement(n) && n.tagName === tag) return n;
  for (const c of 'childNodes' in n ? (n.childNodes as Node[]) : []) {
    const r = find(c, tag);
    if (r) return r;
  }
  return null;
}

function text(n: Node): string {
  if ('value' in n && n.nodeName === '#text') return (n as { value: string }).value;
  return ('childNodes' in n ? (n.childNodes as Node[]) : []).map(text).join('');
}

/** Class tokens with digits and hashed segments stripped, so two posts share one template. */
function cleanClasses(el: Element): string[] {
  const cls = el.attrs.find((a) => a.name === 'class')?.value ?? '';
  return cls
    .split(/\s+/)
    .filter(Boolean)
    .map((c) => c.toLowerCase().replace(/[0-9a-f]{5,}/g, '').replace(/\d+/g, ''))
    .filter((c) => c && c !== '-' && !/^(css|sc)-$/.test(c));
}

export type PageFacts = { fingerprint: string; title: string; h1: string };

/**
 * The template fingerprint (docs/specs/crawler.md): the tag sequence of body's first three levels
 * plus the sorted set of class tokens on those elements, digits and hashes stripped, SHA-1.
 */
export function pageFacts(html: string): PageFacts {
  const doc = parse(html);
  const body = find(doc, 'body');
  const tags: string[] = [];
  const classes = new Set<string>();
  const walk = (el: Element, depth: number) => {
    if (depth > 3) return;
    for (const c of children(el)) {
      if (['script', 'style', 'noscript', 'template'].includes(c.tagName)) continue;
      tags.push(`${depth}:${c.tagName}`);
      for (const k of cleanClasses(c)) classes.add(k);
      walk(c, depth + 1);
    }
  };
  if (body) walk(body, 1);
  const fingerprint = createHash('sha1').update(`${tags.join(',')}|${[...classes].sort().join(' ')}`).digest('hex');
  const titleEl = find(doc, 'title');
  const h1El = body ? find(body, 'h1') : null;
  const clip = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 120);
  return { fingerprint, title: titleEl ? clip(text(titleEl)) : '', h1: h1El ? clip(text(h1El)) : '' };
}
