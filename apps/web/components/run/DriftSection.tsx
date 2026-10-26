'use client';
import { ArrowRight } from 'lucide-react';
import type { DriftNumber, RunDocumentPartial } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { count } from '../../lib/format';
import { Card } from '../Card';
import { FitPreview } from '../FitPreview';
import { Skeleton } from '../Skeleton';
import { Swatch } from '../Swatch';
import { CountUp } from '../motion/CountUp';
import { Enter } from '../motion/Enter';
import { Section } from './Section';
import { TokenPopover, tokenInfo } from './TokenPopover';
import styles from './DriftSection.module.css';

const D = runPage.drift;

function NumberCard({ n, index }: { n: DriftNumber; index: number }) {
  const [, words] = D.numbers[n.kind].match(/^\{n\}(.*)→ \{m\}$/) ?? [];
  return (
    <Enter as="li" move="reveal" index={index} className={styles.number}>
      <Card className={styles.numberCard}>
        <p className={styles.figures}>
          <CountUp value={n.before} className={styles.stat} />
          <span className={styles.words}>{words}</span>
          <ArrowRight size={20} strokeWidth={1.75} aria-hidden="true" className={styles.arrow} />
          <span className="visually-hidden">→</span>
          <CountUp value={n.after} className={styles.stat} />
        </p>
        <p className={styles.numberCaption}>{n.caption}</p>
      </Card>
    </Enter>
  );
}

function Proposal({ doc }: { doc: RunDocumentPartial }) {
  const drift = doc.drift!;
  const neutrals = (doc.tokens?.colors ?? []).filter((c) => c.group === 'neutral').sort((a, b) => b.oklch.l - a.oklch.l);
  const proposed = drift.proposal.colors.filter((c) => c.group === 'neutral');
  const pages = new Set(neutrals.flatMap((c) => c.pages.map((p) => p.pageId))).size;
  const text = neutrals.reduce((s, c) => s + c.uses.text, 0);
  const border = neutrals.reduce((s, c) => s + c.uses.border, 0);
  return (
    <Card className={styles.proposal}>
      <div className={styles.side}>
        <p className={styles.sideTitle}>{fill(D.current, { n: count(neutrals.length) })}</p>
        <ul className={styles.minis}>
          {neutrals.map((c, i) => (
            <Enter as="li" key={c.id} move="extend" index={i}>
              <TokenPopover info={tokenInfo(doc, c.id)!} trigger={(t) => <Swatch value={c.value} size="mini" showHex={false} aria-label={c.name} {...t} />} />
            </Enter>
          ))}
        </ul>
        <p className={styles.caption}>{fill(D.spread, { pages: count(pages), textUses: count(text), borderUses: count(border) })}</p>
      </div>
      <div className={styles.side}>
        <p className={styles.sideTitle}>{fill(D.proposed, { m: count(proposed.length) })}</p>
        <ul className={styles.proposedList}>
          {proposed.map((p) => {
            const others = p.absorbs.filter((a) => a !== p.name);
            return (
              <li key={p.name} className={styles.proposedRow}>
                <span className={styles.miniChip} style={{ background: p.value }} aria-hidden="true" />
                <span className={styles.proposedName}>{p.name}</span>
                <span className={styles.absorbs}>{others.length ? fill(D.absorbs, { values: others.join(', ') }) : D.unchanged}</span>
              </li>
            );
          })}
        </ul>
        {drift.proposal.contrastKept ? <p className={styles.caption}>{D.proposalFooter}</p> : null}
      </div>
    </Card>
  );
}

function Collapses({ doc, base }: { doc: RunDocumentPartial; base?: string }) {
  const comps = new Map((doc.components ?? []).map((c) => [c.id, c]));
  const rows = doc.drift!.variantCollapses.filter((v) => comps.has(v.componentId));
  if (!rows.length) return null;
  return (
    <ul className={styles.collapses}>
      {rows.map((v) => {
        const c = comps.get(v.componentId)!;
        const variants = [v.keep, ...v.merge].map((id) => c.variants.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => Boolean(x));
        return (
          <li key={`${v.componentId}-${v.keep}`}>
            <Card className={styles.collapse}>
              <p className={styles.sideTitle}>{c.name}</p>
              <div className={styles.collapsePreviews}>
                {variants.map((x) => (
                  <figure key={x.id} className={styles.collapseFigure}>
                    <div className={styles.collapseGround}>
                      <FitPreview preview={x.preview} base={base} title={fill(runPage.previewTitle, { name: `${c.name} · ${x.name}` })} showCaptured={false} lazy />
                    </div>
                    <figcaption className={styles.caption}>{x.name}</figcaption>
                  </figure>
                ))}
              </div>
              <p className={styles.caption}>{v.delta}</p>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

function Evidence({ doc }: { doc: RunDocumentPartial }) {
  const rows = doc.drift!.evidence;
  if (!rows.length) return null;
  const E = D.evidence;
  return (
    <Card className={styles.tableCard}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{E.a}</th>
            <th scope="col">{E.b}</th>
            <th scope="col">{E.delta}</th>
            <th scope="col">{E.seenOn}</th>
            <th scope="col">{E.uses}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.a}-${r.b}-${i}`}>
              <td>{r.a}</td>
              <td>{r.b}</td>
              <td>{r.delta}</td>
              <td className={styles.paths}>{r.pages.join(', ')}</td>
              <td>{`${count(r.usesA)} · ${count(r.usesB)}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/** Numbers first, proposal second, evidence last (docs/design/pages.md, Drift report). */
export function DriftSection({ doc, base }: { doc: RunDocumentPartial; base?: string }) {
  const drift = doc.drift;
  return (
    <Section id="drift" title={D.heading} caption={D.caption}>
      {drift ? (
        <>
          {drift.narrative ? <p className={styles.narrative}>{drift.narrative}</p> : null}
          {drift.numbers.length ? (
            <ul className={styles.numbers}>
              {drift.numbers.map((n, i) => (
                <NumberCard key={n.kind} n={n} index={i} />
              ))}
            </ul>
          ) : null}
          <Proposal doc={doc} />
          <Collapses doc={doc} base={base} />
          <Evidence doc={doc} />
        </>
      ) : (
        <>
          <Skeleton height={150} radius="lg" />
          <Skeleton height={260} radius="lg" />
        </>
      )}
    </Section>
  );
}
