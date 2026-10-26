'use client';
import type { ReactNode } from 'react';
import { stateLabels } from '@dse/schema/labels';
import { componentPanel, home, howItWorks, runPage } from '../../copy/strings';
import type { RecentRun } from '../../lib/browser-store';
import { tokenIndex } from '../../lib/doc';
import { rail, type Ring } from '../../lib/run-view';
import { Button } from '../Button';
import { Card } from '../Card';
import { CompareView } from '../compare/CompareView';
import { KeyForm, KeyPopover } from '../home/KeyPopover';
import { Showcase } from '../home/Showcase';
import { ShowcaseCard } from '../home/ShowcaseCard';
import { UrlForm } from '../home/UrlForm';
import { EvalTable } from '../how/EvalTable';
import { PipelineStep } from '../how/PipelineStep';
import { ComponentDetail } from '../panel/ComponentDetail';
import { RecentRunRow } from '../recent/RecentRunRow';
import { CheckBadge, CheckList } from '../run/CheckBadge';
import { ChecksSection } from '../run/ChecksSection';
import { ComponentCard, cardTokens } from '../run/ComponentCard';
import { ComponentsSection } from '../run/ComponentsSection';
import { DriftHeadline } from '../run/DriftHeadline';
import { DriftSection } from '../run/DriftSection';
import { ExportsSection } from '../run/ExportsSection';
import { PageList, PageListPopover } from '../run/PageList';
import { PagesCard } from '../run/PagesCard';
import { PaletteRow } from '../run/PaletteRow';
import { RunHeader } from '../run/RunHeader';
import { StageRail } from '../run/StageRail';
import { StatStrip, runStats } from '../run/StatStrip';
import { StatesStrip } from '../run/StatesStrip';
import { TokenBody, tokenInfo } from '../run/TokenPopover';
import { TokensSection } from '../run/TokensSection';
import type { Demo } from './demos';
import { cleanDoc, messyDoc, progressRun, sampleBase } from './sample-runs';
import styles from './Catalog.module.css';

const doc = messyDoc;
const names = tokenIndex(doc);
const comps = doc.components ?? [];
const showcaseEntries = [
  { runId: 'seedclean0', url: 'http://localhost:3000/r/seedclean0', host: 'tidewater.app', name: 'Tidewater', category: 'SaaS' as const, order: 1, stats: cleanDoc.stats!, palette: [{ value: '#0B1F3A', share: 0.6 }, { value: '#E2E8F0', share: 0.15 }, { value: '#2458E6', share: 0.09 }, { value: '#FFFFFF', share: 0.08 }, { value: '#0F8A8A', share: 0.03 }] },
  { runId: 'seedlibra0', url: 'http://localhost:3000/r/seedlibra0', host: 'ledgerly.money', name: 'Ledgerly', category: 'Finance' as const, order: 2, stats: messyDoc.stats!, palette: [{ value: '#3E4451', share: 0.4 }, { value: '#2C3038', share: 0.2 }, { value: '#C5CAD3', share: 0.15 }, { value: '#485FC7', share: 0.1 }, { value: '#0A0A0A', share: 0.1 }] },
  { runId: 'seedtailw0', url: 'http://localhost:3000/r/seedtailw0', host: 'kettle.dev', name: 'Kettle', category: 'Developer tools' as const, order: 3, stats: cleanDoc.stats!, palette: [{ value: '#111111', share: 0.5 }, { value: '#7C5CFF', share: 0.2 }, { value: '#22C55E', share: 0.2 }, { value: '#F4F4F5', share: 0.1 }] },
];
const recentRuns: RecentRun[] = [
  { id: 'seedclean0', host: 'tidewater.app', createdAt: '2026-10-12T16:04:00.000Z', status: 'complete', stats: cleanDoc.stats, palette: showcaseEntries[0]!.palette },
  { id: 'seedlogin0', host: 'app.ledgerly.money', createdAt: '2026-10-11T09:30:00.000Z', status: 'blocked', blockedReason: 'login' },
  { id: 'seedprog02', host: 'kettle.dev', createdAt: '2026-10-10T12:00:00.000Z', status: 'running' },
];
const pending: Ring[] = rail({ ...progressRun.document, pages: undefined, status: 'queued' }, [], 'queued');
const done: Ring[] = rail(doc, [], 'complete');
const now = new Date('2026-10-12T18:00:00.000Z');
const noDoc = { ...doc, tokens: undefined, checks: undefined, drift: undefined };

function Wide({ children }: { children: ReactNode }) {
  return <div className={styles.fullWidth}>{children}</div>;
}

export const pageDemos: Demo[] = [
  {
    slug: 'url-form',
    name: 'UrlForm',
    tokens: ['surface', 'line', 'line-strong', 'ink', 'radius-md', 'caption', 'focus'],
    frameHeight: 300,
    states: () => [{ label: stateLabels.default, wide: true, node: <UrlForm runsPerDay={2} pageCap={12} byoPageCap={40} /> }],
  },
  {
    slug: 'key-popover',
    name: 'KeyPopover',
    tokens: ['surface', 'shadow-card', 'radius-lg', 'caption', 'label'],
    frameHeight: 300,
    states: () => [
      {
        label: stateLabels.default,
        node: (
          <KeyPopover
            byoPageCap={40}
            trigger={(t) => (
              <button type="button" className={styles.linkButton} {...t}>
                {home.capsKey}
              </button>
            )}
          />
        ),
      },
      { label: stateLabels.open, node: <Card className={styles.popoverBox}><KeyForm byoPageCap={40} /></Card> },
    ],
  },
  {
    slug: 'showcase-card',
    name: 'ShowcaseCard',
    tokens: ['surface', 'line-soft', 'shadow-card', 'shadow-card-hover', 'radius-lg', 'h3', 'meta', 'caption', 'tag'],
    frameHeight: 600,
    states: () => [
      { label: stateLabels.default, node: <div className={styles.cardBox}><ShowcaseCard entry={showcaseEntries[0]!} /></div> },
      { label: stateLabels.hover, node: <div className={styles.cardBox}><ShowcaseCard entry={showcaseEntries[1]!} forceState="hover" /></div> },
      { label: stateLabels.focus, node: <div className={styles.cardBox}><ShowcaseCard entry={showcaseEntries[2]!} forceState="focus" /></div> },
    ],
  },
  {
    slug: 'showcase-grid',
    name: 'ShowcaseGrid and CategoryFilter',
    tokens: ['space-5', 'h2', 'caption', 'ink (selected chip)'],
    frameHeight: 900,
    states: () => [{ label: stateLabels.default, wide: true, node: <Showcase entries={showcaseEntries} /> }],
  },
  {
    slug: 'run-header',
    name: 'RunHeader',
    tokens: ['title', 'meta', 'caption', 'muted', 'space-7'],
    frameHeight: 420,
    states: () => [
      { label: runPage.buttons.export, wide: true, node: <RunHeader headingLevel={2} host="tidewater.app" crumbs={[{ label: 'Showcase', href: '/' }, { label: 'tidewater.app' }]} mode="complete" meta="12 pages · 2 viewports · crawled Oct 12 2026 · 2 min 41 s · Tailwind detected" pages={doc.pages ?? []} runId="catalogmsy" url="https://tidewater.app/" shareUrl="https://design-system-extractor.vercel.app/r/catalogmsy" /> },
      { label: runPage.eyebrow, wide: true, node: <RunHeader headingLevel={2} host="tidewater.app" crumbs={[]} mode="progress" meta="Crawling 7 of 12 pages · 2 viewports · 1 min 12 s elapsed · usually finishes in about 3 minutes" pages={[]} onCancel={() => {}} /> },
    ],
  },
  {
    slug: 'page-list-popover',
    name: 'PageListPopover and PagesCard',
    tokens: ['meta', 'caption', 'muted', 'line-soft'],
    frameHeight: 700,
    states: () => [
      {
        label: stateLabels.default,
        node: (
          <PageListPopover
            pages={doc.pages ?? []}
            trigger={(t) => (
              <button type="button" className={styles.linkButton} {...t}>
                12 pages
              </button>
            )}
          />
        ),
      },
      { label: 'PagesCard', wide: true, node: <PagesCard pages={progressRun.document.pages} /> },
      { label: 'PageList', node: <Card><PageList pages={(doc.pages ?? []).slice(0, 4)} /></Card> },
    ],
  },
  {
    slug: 'stat-strip',
    name: 'StatStrip',
    tokens: ['stat', 'label', 'meta', 'line-soft', 'radius-lg', 'shadow-card'],
    frameHeight: 420,
    states: () => [
      { label: runPage.buttons.export, wide: true, node: <StatStrip cells={runStats(doc.stats!)} /> },
      { label: runPage.eyebrow, wide: true, node: <StatStrip cells={runStats({ colors: 23, typeStyles: 9 })} /> },
    ],
  },
  {
    slug: 'palette-row',
    name: 'PaletteRow',
    tokens: ['label', 'hex', 'caption', 'radius-md', 'shadow-swatch'],
    frameHeight: 520,
    states: () => [
      { label: runPage.buttons.export, wide: true, node: <PaletteRow doc={doc} /> },
      { label: runPage.eyebrow, wide: true, node: <PaletteRow doc={noDoc} /> },
    ],
  },
  {
    slug: 'token-popover',
    name: 'TokenPopover',
    tokens: ['surface', 'shadow-card', 'h3', 'hex', 'meta', 'line-soft'],
    frameHeight: 520,
    states: () => [{ label: stateLabels.open, node: <Card className={styles.popoverBox}><TokenBody info={tokenInfo(doc, doc.tokens!.colors![0]!.id)!} /></Card> }],
  },
  {
    slug: 'drift-headline',
    name: 'DriftHeadline',
    tokens: ['inverse-bg', 'inverse-ink', 'inverse-muted', 'drift', 'body-sm', 'radius-lg'],
    frameHeight: 360,
    states: () => [
      { label: runPage.buttons.export, wide: true, node: <DriftHeadline drift={doc.drift} /> },
      { label: runPage.eyebrow, wide: true, node: <DriftHeadline /> },
    ],
  },
  {
    slug: 'tokens-section',
    name: 'TokenGroup, TypeScaleRow, SpacingBar, RadiusSample and ShadowSample',
    tokens: ['label', 'hex', 'caption', 'h3', 'ink (bars, outlines)', 'surface-tint', 'radius-sm'],
    frameHeight: 1800,
    states: () => [{ label: runPage.tokens.heading, wide: true, node: <Wide><TokensSection doc={doc} /></Wide> }],
  },
  {
    slug: 'component-card',
    name: 'ComponentCard, StatesStrip and CheckBadge',
    tokens: ['surface', 'surface-tint', 'line-soft', 'shadow-card', 'radius-lg', 'h3', 'caption', 'tag', 'ink (dots, badge)'],
    frameHeight: 1300,
    states: () => [
      { label: 'Live', node: <div className={styles.cardBox}><ComponentCard component={comps[0]!} href="#" base={sampleBase} tokens={cardTokens(comps[0]!, names)} /></div> },
      { label: runPage.captured, node: <div className={styles.cardBox}><ComponentCard component={comps[4]!} href="#" base={sampleBase} tokens={cardTokens(comps[4]!, names)} /></div> },
      { label: componentPanel.openAsPage, node: <div className={styles.cardBox}><ComponentCard component={comps[1]!} href="#" base={sampleBase} tokens={cardTokens(comps[1]!, names)} opened /></div> },
      { label: 'StatesStrip', node: <StatesStrip states={comps[0]!.states} base={sampleBase} name={comps[0]!.name} /> },
      { label: 'CheckBadge', node: <div className={styles.row}><CheckBadge checks={comps[0]!.checks} name={comps[0]!.name} /><CheckBadge checks={comps.find((c) => c.checks.some((r) => r.status === 'fail'))?.checks ?? []} name="Icon button" /></div> },
    ],
  },
  {
    slug: 'component-grid',
    name: 'ComponentFilter and ComponentGrid',
    tokens: ['space-5', 'chip', 'h2', 'caption'],
    frameHeight: 1800,
    states: () => [
      { label: runPage.buttons.export, wide: true, node: <Wide><ComponentsSection doc={doc} landed base={sampleBase} hrefFor={() => '#'} /></Wide> },
    ],
  },
  {
    slug: 'checks-section',
    name: 'ChecksSummary and ChecksTable',
    tokens: ['stat', 'label', 'body-sm', 'meta', 'line', 'line-soft'],
    frameHeight: 1100,
    states: () => [
      { label: runPage.checks.heading, wide: true, node: <Wide><ChecksSection doc={doc} /></Wide> },
    ],
  },
  {
    slug: 'drift-section',
    name: 'DriftNumbers, DriftProposal, VariantCollapseList and EvidenceTable',
    tokens: ['stat', 'drift-sub', 'caption', 'hex', 'meta', 'line-soft', 'surface-tint'],
    frameHeight: 2200,
    states: () => [{ label: runPage.drift.heading, wide: true, node: <Wide><DriftSection doc={doc} base={sampleBase} /></Wide> }],
  },
  {
    slug: 'exports-section',
    name: 'ExportCard',
    tokens: ['surface', 'shadow-card', 'h3', 'meta', 'code', 'surface-tint'],
    frameHeight: 1300,
    states: () => [{ label: runPage.exports.heading, wide: true, node: <Wide><ExportsSection doc={doc} landed runUrl="https://design-system-extractor.vercel.app/r/catalogmsy" source={{ kind: 'api', runId: 'catalogmsy' }} /></Wide> }],
  },
  {
    slug: 'stage-rail',
    name: 'StageRail',
    tokens: ['ink (rings, connector)', 'line-strong', 'label', 'muted', 'radius-lg'],
    frameHeight: 520,
    states: () => [
      { label: runPage.meta.waiting, wide: true, node: <StageRail rings={pending} /> },
      { label: runPage.eyebrow, wide: true, node: <StageRail rings={rail(progressRun.document, progressRun.events, 'running')} /> },
      { label: runPage.buttons.export, wide: true, node: <StageRail rings={done} /> },
    ],
  },
  {
    slug: 'component-panel',
    name: 'ComponentPanel and ComponentPage',
    tokens: ['surface', 'shadow-panel', 'line-soft', 'h2', 'label', 'caption', 'code', 'radius-lg'],
    frameHeight: 2200,
    states: () => [
      {
        label: stateLabels.open,
        wide: true,
        node: (
          <Card className={styles.panelBox}>
            <ComponentDetail doc={doc} component={comps[0]!} base={sampleBase} runUrl="https://design-system-extractor.vercel.app/r/catalogmsy" />
          </Card>
        ),
      },
      { label: 'CheckList', node: <Card className={styles.popoverBox}><CheckList checks={comps[0]!.checks} /></Card> },
    ],
  },
  {
    slug: 'compare',
    name: 'CompareModeToggle, CompareColumns, DeltaStrip, TokenDiff and ChangeTable',
    tokens: ['title-sm', 'h2-sm', 'stat', 'meta', 'ink (after border, selected segment)', 'line-strong'],
    frameHeight: 1600,
    states: () => [{ label: stateLabels.default, wide: true, node: <Wide><CompareView a={messyDoc} b={{ ...cleanDoc, createdAt: '2026-11-23T16:00:00.000Z' }} shareUrl="https://design-system-extractor.vercel.app/compare" now={now.toISOString()} embedded /></Wide> }],
  },
  {
    slug: 'recent-run-row',
    name: 'RecentRunRow',
    tokens: ['h3', 'meta', 'caption', 'line-soft', 'radius-sm', 'line-strong (empty block)'],
    frameHeight: 500,
    states: () => [
      {
        label: stateLabels.default,
        wide: true,
        node: (
          <Card>
            <ul>
              {recentRuns.map((r) => (
                <RecentRunRow key={r.id} run={r} now={now} />
              ))}
            </ul>
          </Card>
        ),
      },
    ],
  },
  {
    slug: 'pipeline-step',
    name: 'PipelineStep and EvalTable',
    tokens: ['h3', 'body-sm', 'muted', 'meta', 'ink (ring)', 'line-soft'],
    frameHeight: 1200,
    states: () => [
      {
        label: howItWorks.pipeline,
        wide: true,
        node: (
          <Card>
            <ol>
              {howItWorks.steps.slice(0, 3).map((st, i) => (
                <PipelineStep key={st.name} n={i + 1} index={i} name={st.name} body={st.body} who={st.who} />
              ))}
            </ol>
          </Card>
        ),
      },
      { label: howItWorks.testing.heading, wide: true, node: <Card className={styles.flushCard}><EvalTable /></Card> },
      { label: howItWorks.buttons.try, node: <Button variant="ghost" href="/">{howItWorks.buttons.try}</Button> },
    ],
  },
];
