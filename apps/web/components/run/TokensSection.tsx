'use client';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import type { ColorToken, OverlayToken, RunDocumentPartial } from '@dse/schema';
import { fill, typeRoleLabels } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { count } from '../../lib/format';
import { pagePaths } from '../../lib/doc';
import { Button } from '../Button';
import { Card } from '../Card';
import { PaletteStrip } from '../PaletteStrip';
import { Popover } from '../Popover';
import { Skeleton } from '../Skeleton';
import { shadowGap } from '../../lib/shadow-gap';
import { RegionSkeleton } from './RegionSkeleton';
import { Swatch } from '../Swatch';
import { Tag } from '../Tag';
import { Enter } from '../motion/Enter';
import { CardHead, Section } from './Section';
import { TokenPopover, tokenInfo } from './TokenPopover';
import styles from './TokensSection.module.css';

const T = runPage.tokens;

function ColorGroup({ doc, title, colors, mini }: { doc: RunDocumentPartial; title: string; colors: ColorToken[]; mini?: boolean }) {
  if (!colors.length) return null;
  return (
    <div className={styles.group}>
      <p className={styles.groupLabel}>{title}</p>
      <ul className={styles.swatchRow}>
        {colors.map((c, i) => (
          <Enter as="li" key={c.id} move="extend" index={i}>
            <TokenPopover
              info={tokenInfo(doc, c.id)!}
              trigger={(t) => (mini ? <Swatch value={c.value} size="mini" showHex {...t} /> : <Swatch value={c.value} size="token" caption={fill(runPage.palette.caption, { name: c.name, uses: count(c.usage) })} {...t} />)}
            />
          </Enter>
        ))}
      </ul>
    </div>
  );
}

/** Translucent colors over a ground half light, half dark, then each by name (D-086). */
function OverlayGroup({ doc, overlays }: { doc: RunDocumentPartial; overlays: OverlayToken[] }) {
  if (!overlays.length) return null;
  const list = [...overlays].sort((a, b) => b.usage - a.usage);
  return (
    <div className={styles.group}>
      <p className={styles.groupLabel}>{T.overlays}</p>
      <p className={styles.groupCaption}>{T.overlaysCaption}</p>
      <span className={styles.overlayGround}>
        <PaletteStrip bands={list.map((o) => ({ value: o.value, share: o.usage }))} height={48} />
      </span>
      <ul className={styles.overlayNames}>
        {list.map((o) => (
          <li key={o.id}>
            <TokenPopover
              info={tokenInfo(doc, o.id)!}
              trigger={(t) => (
                <Tag interactive {...t}>
                  {o.name}
                </Tag>
              )}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ColorCard({ doc }: { doc: RunDocumentPartial }) {
  const colors = [...(doc.tokens?.colors ?? [])].sort((a, b) => b.usage - a.usage);
  const neutral = colors.filter((c) => c.group === 'neutral').sort((a, b) => b.oklch.l - a.oklch.l);
  return (
    <Card className={styles.colorCard}>
      <CardHead title={T.color} />
      <div className={styles.groups}>
        <ColorGroup doc={doc} title={T.groups.brand} colors={colors.filter((c) => c.group === 'brand')} />
        <ColorGroup doc={doc} title={fill(T.groups.neutral, { n: count(neutral.length) })} colors={neutral} mini={neutral.length > 8} />
        <ColorGroup doc={doc} title={T.groups.semantic} colors={colors.filter((c) => c.group === 'semantic')} />
        <OverlayGroup doc={doc} overlays={doc.tokens?.overlays ?? []} />
      </div>
    </Card>
  );
}

function TypeCard({ doc }: { doc: RunDocumentPartial }) {
  const [all, setAll] = useState(false);
  const styleList = [...(doc.tokens?.type ?? [])].sort((a, b) => b.size - a.size || b.weight - a.weight);
  const families = doc.tokens?.families ?? [];
  const shown = all ? styleList : styleList.slice(0, 8);
  return (
    <div className={styles.stack}>
      <Card>
        <CardHead title={T.type} meta={fill(T.typeMeta, { families: families.map((f) => f.name).join(' · '), n: count(styleList.length) })} />
        <ul className={styles.typeList}>
          {shown.map((x, i) => (
            <Enter as="li" key={x.id} move="wipe" index={i} className={styles.typeRow}>
              <TokenPopover
                info={tokenInfo(doc, x.id)!}
                trigger={(t) => (
                  <button type="button" className={styles.typeButton} {...t}>
                    <span className={styles.spec}>{`${x.size} / ${x.lineHeight} · ${x.weight}`}</span>
                    <span
                      className={styles.sample}
                      style={{
                        fontFamily: `${JSON.stringify(x.family)}, ${x.fallbackStack || 'sans-serif'}`,
                        fontSize: `min(${x.size}px, 11vw)`,
                        lineHeight: `${x.lineHeight / x.size}`,
                        fontWeight: x.weight,
                        letterSpacing: x.letterSpacing ? `${x.letterSpacing}px` : undefined,
                      }}
                    >
                      {x.name === x.role ? typeRoleLabels[x.role] : x.name}
                    </span>
                  </button>
                )}
              />
            </Enter>
          ))}
        </ul>
        {styleList.length > 8 && !all ? (
          <Button variant="ghost" size="sm" onClick={() => setAll(true)} className={styles.more}>
            {fill(T.showAllStyles, { n: count(styleList.length) })}
          </Button>
        ) : null}
      </Card>
      {families
        .filter((f) => !f.loaded)
        .map((f) => (
          <p key={f.name} className={styles.note}>
            {fill(T.fontNotLoaded, { family: f.name, fallback: f.fallback ?? 'sans-serif' })}
          </p>
        ))}
    </div>
  );
}

function SpacingCard({ doc }: { doc: RunDocumentPartial }) {
  const t = doc.tokens!;
  const steps = [...(t.space ?? [])].sort((a, b) => a.value - b.value);
  const max = Math.max(1, ...steps.map((s) => s.value));
  const base = t.spaceBase?.value ?? 4;
  const paths = pagePaths(doc);
  return (
    <Card>
      <CardHead title={T.spacing} meta={fill(T.spacingMeta, { n: count(steps.filter((s) => s.onGrid).length), base })} />
      <ul className={styles.bars}>
        {steps.map((s, i) => (
          <li key={s.id} className={styles.bar}>
            <span className={styles.barValue}>{s.value}</span>
            <span className={styles.barTrack}>
              <Enter move="extend" index={i} className={styles.barFill} style={{ width: `max(4px, ${(s.value / max) * 100}%)` }} aria-hidden />
            </span>
            {!s.onGrid ? (
              <Popover
                label={fill(T.offGrid, { base })}
                trigger={(p) => (
                  <button type="button" className={styles.alert} aria-label={fill(T.offGrid, { base })} {...p}>
                    <TriangleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                )}
              >
                <p className={styles.popTitle}>{fill(T.offGrid, { base })}</p>
                <ul className={styles.popLines}>
                  {s.pages.map((p) => (
                    <li key={p.pageId}>{fill(runPage.tokenPopover.pageLine, { path: paths.get(p.pageId) ?? p.pageId, n: count(p.count) })}</li>
                  ))}
                </ul>
              </Popover>
            ) : (
              <span className={styles.alertSpace} aria-hidden="true" />
            )}
          </li>
        ))}
      </ul>
      {t.breakpoints?.length ? <p className={styles.note}>{fill(T.breakpoints, { list: t.breakpoints.map((b) => b.value).join(' · ') })}</p> : null}
    </Card>
  );
}

function RadiusCard({ doc }: { doc: RunDocumentPartial }) {
  const radii = [...(doc.tokens?.radius ?? [])].sort((a, b) => a.value - b.value);
  return (
    <Card>
      <CardHead title={T.radius} meta={count(radii.length)} />
      <ul className={styles.samples}>
        {radii.map((r) => (
          <li key={r.id}>
            <TokenPopover
              info={tokenInfo(doc, r.id)!}
              trigger={(t) => (
                <button type="button" className={styles.sampleButton} {...t}>
                  <span className={styles.radiusBox} style={{ borderRadius: r.isPill || r.value >= 36 ? 9999 : r.value }} aria-hidden="true" />
                  <span className={styles.sampleLabel}>{r.isPill ? T.pill : fill(T.radiusValue, { value: count(r.value) })}</span>
                </button>
              )}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ShadowCard({ doc }: { doc: RunDocumentPartial }) {
  const shadows = doc.tokens?.shadow ?? [];
  // A gap twice the largest blur, and half of it around the list, so no shadow reaches a neighbor or the card's edge (D-103).
  const gap = shadowGap(shadows.map((s) => s.value));
  return (
    <Card>
      <CardHead title={T.shadow} meta={count(shadows.length)} />
      <ul className={styles.samples} style={{ gap, padding: gap / 2 }} data-testid="shadow-samples">
        {shadows.map((s) => (
          <li key={s.id}>
            <TokenPopover
              info={tokenInfo(doc, s.id)!}
              trigger={(t) => (
                <button type="button" className={styles.sampleButton} {...t}>
                  <span className={styles.shadowBox} style={{ boxShadow: s.value }} aria-hidden="true" />
                  <span className={styles.sampleLabel}>{s.name}</span>
                  <span className={styles.shadowValue}>{splitLayers(s.value).map((l, i) => <span key={i}>{l}</span>)}</span>
                </button>
              )}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** A shadow's layers, one per line. */
function splitLayers(value: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  return [...out, cur.trim()].filter(Boolean);
}

/** Tokens: the Color card, then Type beside Spacing, then Radius and Shadow in a row of their own (D-103). */
export function TokensSection({ doc }: { doc: RunDocumentPartial }) {
  const t = doc.tokens;
  const rc = t?.rawCounts;
  return (
    <Section id="tokens" title={T.heading} caption={rc ? fill(T.caption, { rawColors: count(rc.colors), fontDecls: count(rc.fontDecls), spacingValues: count(rc.spacingValues) }) : undefined}>
      {t?.colors ? <ColorCard doc={doc} /> : <Skeleton height={646} radius="lg" />}
      {doc.darkThemeDetected ? <p className={styles.note}>{T.darkTheme}</p> : null}
      <div className={styles.split}>
        {t?.type ? <TypeCard doc={doc} /> : <RegionSkeleton region="type" />}
        {t?.space ? <SpacingCard doc={doc} /> : <RegionSkeleton region="spacing" />}
      </div>
      {t?.radius?.length === 0 && t.shadow?.length === 0 ? null : (
        <div className={styles.pair}>
          {t?.radius ? t.radius.length ? <RadiusCard doc={doc} /> : null : <RegionSkeleton region="radius" />}
          {t?.shadow ? t.shadow.length ? <ShadowCard doc={doc} /> : null : <RegionSkeleton region="shadow" />}
        </div>
      )}
    </Section>
  );
}
