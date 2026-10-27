'use client';
import type { ReactNode } from 'react';
import type { RunDocumentPartial } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { count, ratio } from '../../lib/format';
import { pagePaths } from '../../lib/doc';
import { Pill } from '../Pill';
import { Popover, type PopoverTriggerProps } from '../Popover';
import styles from './TokenPopover.module.css';

const P = runPage.tokenPopover;

type Section = { title: string; lines: string[] };
export type TokenInfo = { name: string; value: string; swatch?: string; usage: number; sections: Section[]; namedBy?: string; foundOn?: string[] };

/** A token's provenance (D-008): value, name, usage, pages, absorbed values, contrast pairs. */
export function tokenInfo(doc: RunDocumentPartial, id: string): TokenInfo | null {
  const t = doc.tokens;
  if (!t) return null;
  const paths = pagePaths(doc);
  const pages = (list: { pageId: string; count: number }[]): Section => ({ title: P.seenOn, lines: list.map((p) => fill(P.pageLine, { path: paths.get(p.pageId) ?? p.pageId, n: count(p.count) })) });
  const colors = new Map((t.colors ?? []).map((c) => [c.id, c]));
  const named = (siteName?: string) => (siteName ? { namedBy: siteName } : {});
  const c = colors.get(id);
  if (c) {
    const sections = [pages(c.pages)];
    if (c.rawValues.length > 1) sections.push({ title: P.raw, lines: c.rawValues.map((r) => fill(P.rawLine, { value: r.value, n: count(r.count) })) });
    if (c.contrastPairs.length)
      sections.push({ title: P.contrast, lines: c.contrastPairs.map((p) => fill(P.contrastLine, { fg: colors.get(p.fg)?.name ?? p.fg, bg: colors.get(p.bg)?.name ?? p.bg, ratio: ratio(p.ratio) })) });
    return { name: c.name, value: c.value, swatch: c.value, usage: c.usage, sections, ...named(c.siteName) };
  }
  const ty = t.type?.find((x) => x.id === id);
  if (ty) return { name: ty.name, value: `${ty.family} · ${ty.size} / ${ty.lineHeight} · ${ty.weight}`, usage: ty.usage, sections: [pages(ty.pages)], ...named(ty.siteName), ...(ty.tags.length ? { foundOn: ty.tags } : {}) };
  const o = t.overlays?.find((x) => x.id === id);
  if (o) {
    const sections = [pages(o.pages)];
    if (o.rawValues.length > 1) sections.push({ title: P.raw, lines: o.rawValues.map((r) => fill(P.rawLine, { value: r.value, n: count(r.count) })) });
    return { name: o.name, value: o.value, swatch: o.value, usage: o.usage, sections, ...named(o.siteName) };
  }
  const du = t.duration?.find((x) => x.id === id);
  if (du) {
    const sections = [pages(du.pages)];
    if (du.rawValues.length > 1) sections.push({ title: P.raw, lines: du.rawValues });
    return { name: du.name, value: fill(runPage.motion.ms, { ms: count(du.ms) }), usage: du.usage, sections, ...named(du.siteName) };
  }
  const ea = t.easing?.find((x) => x.id === id);
  if (ea) return { name: ea.name, value: ea.value, usage: ea.usage, sections: [pages(ea.pages)], ...named(ea.siteName) };
  const sp = t.space?.find((x) => x.id === id);
  if (sp)
    return {
      name: `space-${sp.value}`,
      value: `${sp.value} px`,
      usage: sp.usage,
      sections: [pages(sp.pages), { title: P.contexts, lines: [fill(P.contextLine, { padding: count(sp.contexts.padding), margin: count(sp.contexts.margin), gap: count(sp.contexts.gap) })] }],
      ...named(sp.siteName),
    };
  const r = t.radius?.find((x) => x.id === id);
  if (r) return { name: r.isPill ? 'radius-pill' : `radius-${r.value}`, value: r.isPill ? '9999 px' : `${r.value} px`, usage: r.usage, sections: [pages(r.pages)], ...named(r.siteName) };
  const sh = t.shadow?.find((x) => x.id === id);
  if (sh) return { name: `shadow-${sh.name}`, value: sh.value, usage: sh.usage, sections: [pages(sh.pages)], ...named(sh.siteName) };
  return null;
}

export function TokenBody({ info }: { info: TokenInfo }) {
  return (
    <div className={styles.body}>
      <div className={styles.head}>
        {info.swatch ? <span className={styles.chip} style={{ background: info.swatch }} aria-hidden="true" /> : null}
        <span className={styles.ident}>
          <span className={styles.name}>{info.name}</span>
          <span className={styles.value}>{info.value}</span>
        </span>
        <span className={styles.usage}>{info.usage === 1 ? P.oneUse : fill(P.uses, { n: count(info.usage) })}</span>
      </div>
      {info.namedBy || info.foundOn ? (
        <div className={styles.notes}>
          {info.namedBy ? <Pill variant="soft">{runPage.namedBySite}</Pill> : null}
          {info.namedBy ? <p className={styles.note}>{fill(P.namedBy, { variable: info.namedBy })}</p> : null}
          {info.foundOn ? <p className={styles.note}>{fill(P.foundOn, { tags: info.foundOn.join(' · ') })}</p> : null}
        </div>
      ) : null}
      {info.sections.map((s) => (
        <div key={s.title} className={styles.section}>
          <p className={styles.title}>{s.title}</p>
          <ul className={styles.lines}>
            {s.lines.map((l, i) => (
              <li key={`${l}-${i}`}>{l}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function TokenPopover({ info, trigger }: { info: TokenInfo; trigger: (p: PopoverTriggerProps) => ReactNode }) {
  return (
    <Popover label={info.name} width={360} trigger={trigger}>
      <TokenBody info={info} />
    </Popover>
  );
}
