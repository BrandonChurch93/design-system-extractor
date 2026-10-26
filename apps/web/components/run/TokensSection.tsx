'use client';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import type { ColorToken, RunDocumentPartial } from '@dse/schema';
import { fill, typeRoleLabels } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { count } from '../../lib/format';
import { pagePaths } from '../../lib/doc';
import { Button } from '../Button';
import { Card } from '../Card';
import { Popover } from '../Popover';
import { Skeleton } from '../Skeleton';
import { Swatch } from '../Swatch';
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
                      {typeRoleLabels[x.role]}
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
      {t.breakpoints?.length ? <p className={styles.note}>{fill(T.breakpoints, { list: t.breakpoints.join(' · ') })}</p> : null}
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
          <li key={r.id} className={styles.sample44}>
            <TokenPopover
              info={tokenInfo(doc, r.id)!}
              trigger={(t) => (
                <button type="button" className={styles.sampleButton} {...t}>
                  <span className={styles.radiusBox} style={{ borderRadius: r.isPill ? 9999 : r.value }} aria-hidden="true" />
                  <span className={styles.sampleLabel}>{r.isPill ? T.pill : r.value}</span>
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
  return (
    <Card>
      <CardHead title={T.shadow} meta={count(shadows.length)} />
      <ul className={styles.samples}>
        {shadows.map((s) => (
          <li key={s.id} className={styles.sample44}>
            <TokenPopover
              info={tokenInfo(doc, s.id)!}
              trigger={(t) => (
                <button type="button" className={styles.sampleButton} {...t}>
                  <span className={styles.shadowBox} style={{ boxShadow: s.value }} aria-hidden="true" />
                  <span className={styles.sampleLabel}>{s.name}</span>
                </button>
              )}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Tokens: the Color card, then Type beside a stack of Spacing, Radius and Shadow. */
export function TokensSection({ doc }: { doc: RunDocumentPartial }) {
  const t = doc.tokens;
  const rc = t?.rawCounts;
  return (
    <Section id="tokens" title={T.heading} caption={rc ? fill(T.caption, { rawColors: count(rc.colors), fontDecls: count(rc.fontDecls), spacingValues: count(rc.spacingValues) }) : undefined}>
      {t?.colors ? <ColorCard doc={doc} /> : <Skeleton height={300} radius="lg" />}
      {doc.darkThemeDetected ? <p className={styles.note}>{T.darkTheme}</p> : null}
      <div className={styles.split}>
        {t?.type ? <TypeCard doc={doc} /> : <Skeleton height={520} radius="lg" />}
        <div className={styles.stack}>
          {t?.space ? <SpacingCard doc={doc} /> : <Skeleton height={300} radius="lg" />}
          <div className={styles.pair}>
            {t?.radius ? <RadiusCard doc={doc} /> : <Skeleton height={140} radius="lg" />}
            {t?.shadow ? <ShadowCard doc={doc} /> : <Skeleton height={140} radius="lg" />}
          </div>
        </div>
      </div>
    </Section>
  );
}
