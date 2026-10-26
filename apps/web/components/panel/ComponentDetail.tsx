'use client';
import { Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import type * as ExportsModule from '@dse/pipeline/exports';
import type { Component, RunDocumentPartial, State } from '@dse/schema';
import { capturedReasonLabels, fill, stateLabels } from '@dse/schema/labels';
import { componentPanel as P, global, runPage } from '../../copy/strings';
import { checkCounts, fileUrl } from '../../lib/doc';
import { count } from '../../lib/format';
import { Button } from '../Button';
import { CaptureViewer } from '../CaptureViewer';
import { ChipGroup } from '../ChipGroup';
import { CodeBlock } from '../CodeBlock';
import { FitPreview } from '../FitPreview';
import { Tabs } from '../Tabs';
import { Tag } from '../Tag';
import { useToast } from '../Toast';
import { CheckList } from '../run/CheckBadge';
import { TokenPopover, tokenInfo } from '../run/TokenPopover';
import styles from './ComponentDetail.module.css';

const stateOrder = Object.keys(stateLabels) as State[];

function pct(n: number | undefined): string {
  return (Math.round((n ?? 0) * 10) / 10).toFixed(1);
}

function fidelity(c: { preview: Component['preview'] }): string {
  const p = c.preview;
  if (p.mode === 'live') return fill(P.fidelityLive, { pct: pct(p.diffPct) });
  const reason = p.capturedReason ? fill(capturedReasonLabels[p.capturedReason], { pct: pct(p.diffPct) }) : '';
  return fill(P.fidelityCaptured, { reason });
}

async function copy(text: string, toast: { show: (m: string) => void }) {
  try {
    await navigator.clipboard.writeText(text);
    toast.show(global.toasts.copied);
  } catch {
    // clipboard refused
  }
}

/** The panel's sections, also laid out as the component page (docs/design/components.md). */
export function ComponentDetail({ doc, component: c, base, runUrl }: { doc: RunDocumentPartial; component: Component; base?: string; runUrl: string }) {
  const toast = useToast();
  const [variantId, setVariantId] = useState(c.variants[0]!.id);
  const [tab, setTab] = useState<'html' | 'css' | 'tailwind'>('html');
  const [viewer, setViewer] = useState(false);
  const [allPages, setAllPages] = useState(false);
  const [exporters, setExporters] = useState<typeof ExportsModule | null>(null);
  useEffect(() => {
    let live = true;
    void import('@dse/pipeline/exports').then((m) => live && setExporters(m));
    return () => {
      live = false;
    };
  }, []);

  const variant = c.variants.find((v) => v.id === variantId) ?? c.variants[0]!;
  const first = c.provenance.firstSeen;
  const firstPage = doc.pages?.find((p) => p.id === first.pageId);
  const capture = firstPage?.captures[first.viewport];
  const seen = c.provenance.pages;
  const seenPaths = seen.map((p) => p.path);
  const viewportPx = first.viewport === 'desktop' ? 1440 : 390;
  const captured = c.states.filter((s) => s.captured).sort((a, b) => stateOrder.indexOf(a.state) - stateOrder.indexOf(b.state));
  const missing = c.states.filter((s) => !s.captured);
  const ownChecks = c.checks.filter((r) => !r.variantId || r.variantId === c.variants[0]!.id);
  const otherChecks = c.checks.filter((r) => r.variantId && r.variantId !== c.variants[0]!.id && r.status === 'fail');
  const counts = checkCounts(ownChecks);
  const tokens = [...new Map(c.tokensUsed.map((u) => [u.tokenId, u])).values()];
  const variantName = (id: string) => c.variants.find((v) => v.id === id)?.name;
  const tabs = [
    { value: 'html' as const, label: runPage.codeTabs.html, panel: <CodeBlock code={c.code.html} label={runPage.codeTabs.html} /> },
    { value: 'css' as const, label: runPage.codeTabs.css, panel: <CodeBlock code={c.code.css} label={runPage.codeTabs.css} /> },
    ...(doc.frameworkHint === 'tailwind' && c.code.tailwind ? [{ value: 'tailwind' as const, label: runPage.codeTabs.tailwind, panel: <CodeBlock code={c.code.tailwind} label={runPage.codeTabs.tailwind} /> }] : []),
  ];
  const seenLine = (n: number) => fill(P.seenOn, { paths: seenPaths.slice(0, 4).join(', '), n: count(n) });

  return (
    <div className={styles.detail}>
      <section className={styles.section} aria-labelledby={`v-${c.id}`}>
        <div className={styles.sectionHead}>
          <h3 id={`v-${c.id}`} className={styles.label}>
            {P.variants}
          </h3>
          <p className={styles.caption}>{fidelity(variant)}</p>
        </div>
        {c.variants.length > 1 ? <ChipGroup label={P.variants} value={variantId} onChange={setVariantId} options={c.variants.map((v) => ({ value: v.id, label: v.name }))} /> : null}
        <div className={styles.ground}>
          <FitPreview preview={variant.preview} base={base} title={fill(runPage.previewTitle, { name: `${c.name} · ${variant.name}` })} padding={0} />
        </div>
        {c.responsiveVariant ? <p className={styles.caption}>{c.responsiveVariant.note}</p> : null}
      </section>

      <section className={styles.section} aria-labelledby={`s-${c.id}`}>
        <h3 id={`s-${c.id}`} className={styles.label}>
          {P.source}
        </h3>
        {first.sourceCrop && base ? (
          <div className={styles.source} style={{ aspectRatio: `${first.sourceCrop.width} / ${first.sourceCrop.height}`, maxWidth: first.sourceCrop.width * 2 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- storage-origin crop at its CSS size */}
            <img src={fileUrl(base, first.sourceCrop.key)} alt={`${first.path} · ${c.name}`} className={styles.sourceImg} />
            <span
              className={styles.outline}
              aria-hidden="true"
              style={{
                left: `${(first.sourceCrop.outline.x / first.sourceCrop.width) * 100}%`,
                top: `${(first.sourceCrop.outline.y / first.sourceCrop.height) * 100}%`,
                width: `${(first.sourceCrop.outline.w / first.sourceCrop.width) * 100}%`,
                height: `${(first.sourceCrop.outline.h / first.sourceCrop.height) * 100}%`,
              }}
            />
          </div>
        ) : null}
        <ul className={styles.facts}>
          <li>
            {capture && base ? (
              <a href={fileUrl(base, capture.screenshotKey)} className={styles.link} target="_blank" rel="noopener noreferrer">
                {fill(P.sourceLine, { path: first.path, viewport: viewportPx })}
              </a>
            ) : (
              fill(P.sourceLine, { path: first.path, viewport: viewportPx })
            )}
          </li>
          <li>
            <code className={styles.selector}>{first.selector}</code>
          </li>
          <li>
            {seen.length > 4 && !allPages ? (
              <button type="button" className={styles.linkButton} onClick={() => setAllPages(true)}>
                {seenLine(seen.length - 4)}
              </button>
            ) : (
              <span>{seenPaths.join(', ')}</span>
            )}
          </li>
        </ul>
        {allPages ? (
          <ul className={styles.pageCounts}>
            {seen.map((p) => (
              <li key={p.pageId}>{fill(runPage.tokenPopover.pageLine, { path: p.path, n: count(p.count) })}</li>
            ))}
          </ul>
        ) : null}
        {capture && base ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => setViewer(true)} className={styles.start}>
              {P.showOnPage}
            </Button>
            <CaptureViewer open={viewer} onClose={() => setViewer(false)} src={fileUrl(base, capture.screenshotKey)!} path={first.path} viewport={viewportPx} width={capture.width} height={capture.height} box={first.bbox} />
          </>
        ) : null}
      </section>

      <section className={styles.section} aria-labelledby={`st-${c.id}`}>
        <h3 id={`st-${c.id}`} className={styles.label}>
          {fill(P.states, { n: count(captured.length) })}
        </h3>
        <ul className={styles.states}>
          {captured.map((s) => {
            const htmlKey = c.preview.mode === 'live' ? (s.state === 'default' ? c.preview.htmlKey : c.preview.stateHtmlKeys?.[s.state]) : undefined;
            const preview = htmlKey ? { ...c.preview, mode: 'live' as const, htmlKey } : s.cropKey ? { ...c.preview, mode: 'captured' as const, cropKey: s.cropKey, width: c.preview.width + 16, height: c.preview.height + 16 } : c.preview;
            return (
              <li key={s.state} className={styles.state}>
                <div className={styles.stateGround}>
                  <FitPreview preview={preview} base={base} title={fill(runPage.statePreviewTitle, { name: c.name, state: stateLabels[s.state] })} padding={4} showCaptured={false} lazy />
                </div>
                <span className={styles.caption}>{stateLabels[s.state]}</span>
              </li>
            );
          })}
        </ul>
        {missing.length ? <p className={styles.caption}>{fill(P.notCaptured, { names: missing.map((s) => (s.reason ? `${stateLabels[s.state]} (${s.reason})` : stateLabels[s.state])).join(' · ') })}</p> : null}
      </section>

      <section className={styles.section} aria-labelledby={`ch-${c.id}`}>
        <h3 id={`ch-${c.id}`} className={styles.label}>
          {fill(P.checks, { passed: count(counts.passed), applicable: count(counts.applicable), variant: c.variants[0]!.name })}
        </h3>
        <CheckList checks={ownChecks} />
        {otherChecks.length ? (
          <div className={styles.rule}>
            <CheckList checks={otherChecks} variantName={variantName} />
          </div>
        ) : null}
      </section>

      <section className={styles.section} aria-labelledby={`t-${c.id}`}>
        <h3 id={`t-${c.id}`} className={styles.label}>
          {P.tokens}
        </h3>
        <div className={styles.tags}>
          {tokens.map((u) => {
            const info = tokenInfo(doc, u.tokenId);
            return info ? (
              <TokenPopover
                key={u.tokenId}
                info={info}
                trigger={(t) => (
                  <Tag interactive {...t}>
                    {info.name}
                  </Tag>
                )}
              />
            ) : null;
          })}
        </div>
        {c.unmapped.length ? (
          <div className={styles.rule}>
            <p className={styles.caption}>{P.unmapped}</p>
            <ul className={styles.unmapped}>
              {c.unmapped.map((u) => (
                <li key={`${u.property}-${u.value}`}>{`${u.property} ${u.value}`}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className={styles.section}>
        <Tabs items={tabs} value={tab} onChange={setTab} label={c.name} />
      </section>

      <div className={styles.actions}>
        <Button
          variant="primary"
          icon={Copy}
          disabled={!exporters}
          onClick={() => exporters && copy(exporters.generateExport(doc, 'component-prompt.md', { runUrl, componentId: c.id }).body, toast)}
        >
          {P.actions.copyPrompt}
        </Button>
        <Button variant="ghost" onClick={() => copy(`${c.code.html}\n\n${c.code.css}`, toast)}>
          {P.actions.copyCode}
        </Button>
      </div>

      <p className={styles.caption}>{fill(P.footer, { paths: seenPaths.slice(0, 4).join(', '), n: count(Math.max(0, seen.length - 4)), path: first.path, viewport: viewportPx })}</p>
    </div>
  );
}

