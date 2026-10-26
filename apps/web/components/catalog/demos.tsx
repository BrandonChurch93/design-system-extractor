'use client';
import { componentGroupLabels, fill, runStatusLabels, stateLabels } from '@dse/schema/labels';
import { ArrowUpRight, RefreshCw, Share } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { catalog, componentPanel, global, home, recent, runPage, statePages } from '../../copy/strings';
import { CaptureFigure } from '../CaptureViewer';
import { Button } from '../Button';
import { CaptureViewer } from '../CaptureViewer';
import { Card } from '../Card';
import { ChipGroup } from '../ChipGroup';
import { CodeBlock } from '../CodeBlock';
import { EmptyState } from '../EmptyState';
import { Footer } from '../Footer';
import { Input } from '../Input';
import { LiveLog, type LogLine } from '../LiveLog';
import { Meter } from '../Meter';
import { PaletteStrip } from '../PaletteStrip';
import { Pill } from '../Pill';
import { Popover } from '../Popover';
import { PreviewFrame } from '../PreviewFrame';
import { SectionNav } from '../SectionNav';
import { Sheet } from '../Sheet';
import { Skeleton } from '../Skeleton';
import { StateCard } from '../StateCard';
import { Swatch } from '../Swatch';
import { Tabs } from '../Tabs';
import { Tag } from '../Tag';
import { ToastSample, useToast } from '../Toast';
import { TopNav } from '../TopNav';
import { MotionDemo } from './MotionDemo';
import { pageDemos } from './page-demos';
import { v2Demos } from './v2-demos';
import popoverStyles from '../Popover.module.css';
import sheetStyles from '../Sheet.module.css';
import styles from './Catalog.module.css';

export type DemoState = { label: string; node: ReactNode; wide?: boolean; inverse?: boolean };
export type Demo = {
  slug: string;
  name: string;
  tokens: string[];
  /** Height of the 390 px frame. */
  frameHeight: number;
  states: () => DemoState[];
  /** Render the desktop states in a frame of their own (landmarks that must stay unique). */
  isolate?: boolean;
  /** What the 390 px frame shows; defaults to every state stacked. */
  phone?: () => ReactNode;
};

const s = stateLabels;
const sampleHost = 'tidewater.app';
const palette = [
  { value: '#0B1F3A', share: 0.31 },
  { value: '#2458E6', share: 0.2 },
  { value: '#3A3A3A', share: 0.18 },
  { value: '#D6D6D6', share: 0.12 },
  { value: '#F4F6FA', share: 0.1 },
  { value: '#0FA3A3', share: 0.04 },
  { value: '#E8A317', share: 0.03 },
  { value: '#D64545', share: 0.02 },
];
const logLines: LogLine[] = [
  { id: 1, ts: '2026-10-12T16:00:02Z', text: 'queue · picked up by the crawler' },
  { id: 2, ts: '2026-10-12T16:00:05Z', text: 'crawl · sitemap.xml · 281 urls · nav 11 · footer 6' },
  { id: 3, ts: '2026-10-12T16:00:09Z', text: 'select · 3 templates folded (docs ×212, blog ×48, careers ×9) · 12 pages chosen' },
  { id: 4, ts: '2026-10-12T16:00:31Z', text: 'capture · /pricing · 1440 and 390 · 2 screenshots · 1,204 nodes' },
  { id: 5, ts: '2026-10-12T16:00:38Z', text: 'capture · /pricing · hover 14 · focus 9 · tab 23 · open 2' },
  { id: 6, ts: '2026-10-12T16:01:12Z', text: 'tokens · colors 31 clustered from 212 raw values · ΔE threshold 2.3' },
];
const sections = [
  { id: 'catalog-tokens', label: runPage.sectionNav.tokens },
  { id: 'catalog-components', label: runPage.sectionNav.components },
  { id: 'catalog-checks', label: runPage.sectionNav.checks },
  { id: 'catalog-drift', label: runPage.sectionNav.drift },
  { id: 'catalog-exports', label: runPage.sectionNav.exports },
];
const installLine = fill(runPage.mcp.install, { id: 'seedclean0' });

function Group({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

/** A row of the same component in several states, each captioned. */
function States({ items }: { items: { label: string; node: ReactNode }[] }) {
  return (
    <div className={styles.statesRow}>
      {items.map(({ label, node }) => (
        <figure key={label} className={styles.figure}>
          {node}
          <figcaption className={styles.figcaption}>{label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function ChipDemo({ force }: { force?: { value: string; state: 'hover' | 'focus' } }) {
  const [v, setV] = useState('all');
  return (
    <ChipGroup
      label={runPage.sectionNav.components}
      value={v}
      onChange={setV}
      forceState={force}
      options={[
        { value: 'all', label: 'All', count: 46 },
        { value: 'buttons', label: componentGroupLabels.buttons, count: 6 },
        { value: 'inputs', label: componentGroupLabels.inputs, count: 9 },
        { value: 'navigation', label: componentGroupLabels.navigation, count: 7 },
      ]}
    />
  );
}

function TabsDemo({ forceFocus }: { forceFocus?: 'html' | 'css' }) {
  const [v, setV] = useState<'html' | 'css' | 'tailwind'>('css');
  return (
    <Tabs
      label={runPage.codeTabs.html}
      value={v}
      onChange={setV}
      forceFocus={forceFocus}
      items={[
        { value: 'html', label: runPage.codeTabs.html, panel: <CodeBlock code={'<a class="btn btn-primary" href="#">Start free</a>'} /> },
        { value: 'css', label: runPage.codeTabs.css, panel: <CodeBlock code={'.btn-primary {\n  background: var(--color-blue-600);\n  border-radius: var(--radius-md);\n  padding: 12px 22px;\n}'} /> },
        { value: 'tailwind', label: runPage.codeTabs.tailwind, panel: <CodeBlock code={'<a class="rounded-md bg-blue-600 px-[22px] py-3">Start free</a>'} /> },
      ]}
    />
  );
}

function PopoverDemo() {
  return (
    <Popover
      label={statePages.recentRuns}
      width={360}
      trigger={(p) => (
        <button {...p} type="button" className={styles.linkButton}>
          12 pages
        </button>
      )}
    >
      <PopoverBody />
    </Popover>
  );
}

function PopoverBody() {
  return (
    <ul className={styles.pageList}>
      {[
        ['/', 'home'],
        ['/pricing', 'tables, toggles'],
        ['/signup', 'forms'],
        ['/docs/api/rate-limits', 'docs template, 1 of 212'],
      ].map(([path, reason]) => (
        <li key={path}>
          <span className={styles.meta}>{path}</span>
          <span className={styles.captionMuted}>{reason}</span>
        </li>
      ))}
    </ul>
  );
}

function SheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        {runPage.buttons.share}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} label={runPage.buttons.share} handleLabel={global.icons.close}>
        <PopoverBody />
      </Sheet>
    </>
  );
}

function ToastDemo() {
  const toast = useToast();
  return (
    <Button size="sm" onClick={() => toast.show(global.toasts.linkCopied)}>
      {runPage.buttons.share}
    </Button>
  );
}

function CaptureDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" icon={ArrowUpRight} onClick={() => setOpen(true)}>
        {componentPanel.showOnPage}
      </Button>
      <CaptureViewer
        open={open}
        onClose={() => setOpen(false)}
        src="/catalog/sample-capture.png"
        path="/"
        viewport={1440}
        width={1440}
        height={900}
        box={{ x: 48, y: 373, w: 112, h: 42 }}
      />
    </>
  );
}

const primitiveDemos: Demo[] = [
  {
    slug: 'motion',
    name: 'Motion',
    tokens: ['motion-fast 160', 'motion-base 260', 'motion-slow 420', 'motion-stage 600', 'ease-standard', 'ease-exit', 'stagger 30 · cap 12'],
    frameHeight: 600,
    states: () => [{ label: 'draw · wipe · extend · count · slide · reveal', node: <MotionDemo replayLabel={catalog.replay} />, wide: true }],
  },
  {
    slug: 'top-nav',
    name: 'TopNav',
    isolate: true,
    tokens: ['h3 700', 'body-sm 500', 'ink', 'ink-2', 'line', 'space-6', 'nav-height 68'],
    frameHeight: 300,
    states: () => [
      { label: s.default, node: <div className={styles.bleed}><TopNav /></div>, wide: true },
    ],
    phone: () => (
      <div className={styles.stack}>
        <TopNav />
        <TopNav forceMenuOpen />
      </div>
    ),
  },
  {
    slug: 'footer',
    name: 'Footer',
    tokens: ['caption', 'muted', 'ink-2', 'line', 'space-5'],
    frameHeight: 240,
    states: () => [{ label: s.default, node: <div className={styles.bleed}><Footer context={<span>Run seedclean0 · cost $0.04</span>} /></div>, wide: true }],
  },
  {
    slug: 'section-nav',
    name: 'SectionNav',
    tokens: ['label 500', 'radius-pill', 'ink', 'inverse-ink', 'surface-tint', 'line'],
    frameHeight: 180,
    states: () => [
      { label: s.default, node: <SectionNav items={sections} label={`${global.sectionsLabel} · ${s.default}`} forceActive="catalog-tokens" forceStuck={false} />, wide: true },
      { label: s.scrolled, node: <SectionNav items={sections} label={`${global.sectionsLabel} · ${s.scrolled}`} forceActive="catalog-components" forceStuck />, wide: true },
    ],
  },
  {
    slug: 'button',
    name: 'Button',
    tokens: ['button', 'ink', 'inverse-ink', 'surface', 'line', 'line-strong', 'radius-md', 'space-4', 'space-5', 'space-6', 'focus'],
    frameHeight: 520,
    states: () => [
      {
        label: 'primary',
        node: (
          <States
            items={[
              { label: s.default, node: <Button variant="primary">{runPage.buttons.export}</Button> },
              { label: s.hover, node: <Button variant="primary" forceState="hover">{runPage.buttons.export}</Button> },
              { label: s.focus, node: <Button variant="primary" forceState="focus">{runPage.buttons.export}</Button> },
              { label: s.active, node: <Button variant="primary" forceState="active">{runPage.buttons.export}</Button> },
              { label: s.disabled, node: <Button variant="primary" disabled>{runPage.buttons.export}</Button> },
            ]}
          />
        ),
      },
      {
        label: 'ghost',
        node: (
          <States
            items={[
              { label: s.default, node: <Button icon={Share}>{runPage.buttons.share}</Button> },
              { label: s.hover, node: <Button icon={Share} forceState="hover">{runPage.buttons.share}</Button> },
              { label: s.focus, node: <Button icon={Share} forceState="focus">{runPage.buttons.share}</Button> },
              { label: s.active, node: <Button icon={Share} forceState="active">{runPage.buttons.share}</Button> },
              { label: s.disabled, node: <Button icon={Share} disabled>{runPage.buttons.share}</Button> },
            ]}
          />
        ),
      },
      {
        label: 'inverse',
        inverse: true,
        node: (
          <States
            items={[
              { label: s.default, node: <Button variant="inverse">{runPage.buttons.runAgain}</Button> },
              { label: s.hover, node: <Button variant="inverse" forceState="hover">{runPage.buttons.runAgain}</Button> },
              { label: s.focus, node: <Button variant="inverse" forceState="focus">{runPage.buttons.runAgain}</Button> },
              { label: s.active, node: <Button variant="inverse" forceState="active">{runPage.buttons.runAgain}</Button> },
              { label: s.disabled, node: <Button variant="inverse" disabled>{runPage.buttons.runAgain}</Button> },
            ]}
          />
        ),
      },
      {
        label: 'size',
        node: (
          <States
            items={[
              { label: 'sm', node: <Button key="sm" size="sm" icon={RefreshCw}>{runPage.buttons.runAgain}</Button> },
              { label: 'md', node: <Button key="md" size="md" icon={RefreshCw}>{runPage.buttons.runAgain}</Button> },
              { label: 'xl', node: <Button key="xl" size="xl" variant="primary">{home.extract}</Button> },
            ]}
          />
        ),
      },
    ],
    phone: () => (
      <div className={styles.stack}>
        <Button size="xl" variant="primary" block>
          {home.extract}
        </Button>
        <Group>
          <Button variant="primary">{runPage.buttons.export}</Button>
          <Button icon={Share}>{runPage.buttons.share}</Button>
          <Button>{runPage.buttons.compare}</Button>
        </Group>
      </div>
    ),
  },
  {
    slug: 'chip',
    name: 'Chip and ChipGroup',
    tokens: ['label 500', 'meta', 'surface', 'line', 'line-strong', 'ink', 'inverse-ink', 'radius-pill'],
    frameHeight: 200,
    states: () => [
      { label: s.default, node: <ChipDemo /> },
      { label: s.hover, node: <ChipDemo force={{ value: 'inputs', state: 'hover' }} /> },
      { label: s.focus, node: <ChipDemo force={{ value: 'buttons', state: 'focus' }} /> },
    ],
    phone: () => <ChipDemo />,
  },
  {
    slug: 'tag',
    name: 'Tag',
    tokens: ['tag', 'surface-tint', 'ink-2', 'radius-pill'],
    frameHeight: 120,
    states: () => [
      { label: s.default, node: <Group>{['blue-600', 'radius-md', 'body', 'space-16'].map((t) => <Tag key={t}>{t}</Tag>)}</Group> },
      { label: 'button', node: <Group>{['blue-600', 'radius-md'].map((t) => <Tag key={t} interactive>{t}</Tag>)}</Group> },
    ],
  },
  {
    slug: 'pill',
    name: 'Pill',
    tokens: ['caption 600', 'ink', 'line-strong', 'muted', 'inverse-ink', 'radius-pill'],
    frameHeight: 140,
    states: () => [
      { label: 'solid', node: <Group><Pill variant="solid">{runStatusLabels.complete}</Pill></Group> },
      {
        label: 'soft',
        node: (
          <Group>
            {(['running', 'blocked', 'failed', 'cancelled'] as const).map((st) => (
              <Pill key={st}>{runStatusLabels[st]}</Pill>
            ))}
            <Pill>{runPage.deterministic}</Pill>
          </Group>
        ),
      },
      { label: 'inverse', node: <Group><Pill variant="inverse">{runPage.modelHaiku}</Pill></Group> },
    ],
  },
  {
    slug: 'card',
    name: 'Card',
    tokens: ['surface', 'line-soft', 'radius-lg', 'shadow-card', 'shadow-card-hover', 'space-5', 'space-4'],
    frameHeight: 420,
    states: () => [
      { label: s.default, node: <Card><p className={styles.cardText}>{sampleHost}</p></Card> },
      { label: `link · ${s.hover}`, node: <Card href="/catalog#card" forceState="hover"><p className={styles.cardText}>{sampleHost}</p></Card> },
      { label: `link · ${s.focus}`, node: <Card href="/catalog#card" forceState="focus"><p className={styles.cardText}>{sampleHost}</p></Card> },
    ],
  },
  {
    slug: 'input',
    name: 'Input',
    tokens: ['body', 'label', 'caption', 'surface', 'line', 'line-strong', 'muted', 'ink-2', 'radius-md', 'focus'],
    frameHeight: 520,
    states: () => [
      { label: s.default, node: <Input label={home.inputLabel} hideLabel placeholder={home.placeholder} /> },
      { label: s.hover, node: <Input label={home.inputLabel} hideLabel placeholder={home.placeholder} forceState="hover" /> },
      { label: s.focus, node: <Input label={home.inputLabel} hideLabel defaultValue="https://tidewater.app" forceState="focus" /> },
      { label: s.error, node: <Input label={home.inputLabel} hideLabel defaultValue="tidewater" error={home.errors.notUrl} /> },
      { label: s.disabled, node: <Input label={home.inputLabel} hideLabel placeholder={home.placeholder} disabled /> },
      { label: 'xl', node: <Input label={home.inputLabel} hideLabel placeholder={home.placeholder} size="xl" />, wide: true },
    ],
  },
  {
    slug: 'tabs',
    name: 'Tabs',
    tokens: ['label 500', 'ink-2', 'ink', 'line', 'motion-base'],
    frameHeight: 300,
    states: () => [
      { label: s.selected, node: <TabsDemo /> },
      { label: s.focus, node: <TabsDemo forceFocus="html" /> },
    ],
  },
  {
    slug: 'popover',
    name: 'Popover',
    tokens: ['surface', 'line-soft', 'radius-lg', 'shadow-card', 'space-5', 'motion-fast'],
    frameHeight: 320,
    states: () => [
      { label: s.default, node: <PopoverDemo /> },
      {
        label: s.open,
        node: (
          <div className={popoverStyles.popover} style={{ position: 'relative', width: 360, maxWidth: '100%' }}>
            <PopoverBody />
          </div>
        ),
      },
    ],
  },
  {
    slug: 'sheet',
    name: 'Sheet',
    tokens: ['surface', 'radius-lg', 'shadow-sheet', 'line-strong', 'scrim', 'motion-slow'],
    frameHeight: 420,
    states: () => [
      { label: s.default, node: <SheetDemo /> },
      {
        label: s.open,
        node: (
          <div className={styles.sheetFrame}>
            <div className={sheetStyles.scrim} style={{ position: 'absolute' }} />
            <div className={`${sheetStyles.sheet} ${sheetStyles.content}`} style={{ position: 'absolute' }}>
              <div className={sheetStyles.handleHit} aria-hidden="true">
                <span className={sheetStyles.handle} />
              </div>
              <div className={sheetStyles.body} tabIndex={0}>
                <PopoverBody />
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    slug: 'toast',
    name: 'Toast',
    tokens: ['inverse-bg', 'inverse-ink', 'radius-md', 'body-sm 500', 'motion-slow'],
    frameHeight: 160,
    states: () => [
      { label: s.default, node: <ToastSample message={global.toasts.linkCopied} /> },
      { label: 'trigger', node: <ToastDemo /> },
    ],
  },
  {
    slug: 'skeleton',
    name: 'Skeleton',
    tokens: ['skeleton', 'surface-tint', 'radius-sm'],
    frameHeight: 260,
    states: () => [
      {
        label: 'bg',
        node: (
          <div className={styles.stackSm}>
            <Skeleton height={96} width="100%" radius="md" />
            <Skeleton height={14} width="40%" />
          </div>
        ),
      },
      {
        label: 'surface',
        node: (
          <Card>
            <div className={styles.stackSm}>
              <Skeleton height={34} width={80} on="surface" />
              <Skeleton height={14} width={120} on="surface" />
            </div>
          </Card>
        ),
      },
    ],
  },
  {
    slug: 'meter',
    name: 'Meter',
    tokens: ['skeleton', 'ink', 'radius-pill'],
    frameHeight: 180,
    states: () => [
      { label: '0', node: <Meter value={0} max={2} label="0 of 2" animate={false} /> },
      { label: '1.24 of 2.00', node: <Meter value={1.24} max={2} label="1.24 of 2.00" animate={false} /> },
      { label: '2.00 of 2.00', node: <Meter value={2} max={2} label="2.00 of 2.00" animate={false} /> },
    ],
  },
  {
    slug: 'code-block',
    name: 'CodeBlock',
    tokens: ['code', 'surface-tint', 'line-soft', 'radius-sm'],
    frameHeight: 220,
    states: () => [{ label: s.default, node: <CodeBlock code={installLine} label={runPage.mcp.title} />, wide: true }],
  },
  {
    slug: 'live-log',
    name: 'LiveLog',
    tokens: ['inverse-bg', 'inverse-ink', 'inverse-muted', 'inverse-line', 'code', 'radius-lg'],
    frameHeight: 520,
    states: () => [
      { label: s.open, node: <LiveLog lines={logLines} animateNew={false} label={`${runPage.liveLog.label} · ${s.open}`} />, wide: true },
      { label: 'collapsed', node: <LiveLog lines={logLines} defaultCollapsed animateNew={false} label={`${runPage.liveLog.label} · ${runPage.liveLog.collapse}`} />, wide: true },
    ],
  },
  {
    slug: 'empty-state',
    name: 'EmptyState',
    tokens: ['h3', 'body-sm', 'muted', 'space-3'],
    frameHeight: 280,
    states: () => [{ label: s.default, node: <EmptyState title={recent.empty.title} body={recent.empty.body} action={{ label: recent.empty.action, href: '/' }} />, wide: true }],
  },
  {
    slug: 'state-card',
    name: 'StateCard',
    tokens: ['label', 'title-sm', 'body', 'muted', 'line-soft', 'space-7', 'radius-lg'],
    frameHeight: 640,
    states: () => [
      {
        label: s.default,
        wide: true,
        node: (
          <StateCard
            level={2}
            eyebrow={statePages.budget.eyebrow}
            title={statePages.budget.title}
            body={<p>{fill(statePages.budget.body, { hours: 7 })}</p>}
            detail={
              <>
                <Meter value={2} max={2} label={fill(statePages.budget.meter, { used: '$2.00', budget: '$2.00' })} animate={false} />
                <p className={styles.captionMuted}>
                  {fill(statePages.budget.meter, { used: '$2.00', budget: '$2.00' })} · {fill(statePages.budget.runsToday, { n: 41 })}
                </p>
              </>
            }
            primary={<Button variant="primary">{fill(statePages.budget.extract, { host: sampleHost })}</Button>}
            secondary={
              <>
                <Button href="/">{statePages.browseShowcase}</Button>
                <Button href="/recent">{statePages.recentRuns}</Button>
              </>
            }
            footer={statePages.budget.footer}
          />
        ),
      },
    ],
  },
  {
    slug: 'swatch',
    name: 'Swatch',
    tokens: ['hex', 'caption', 'ink-2', 'muted', 'radius-md', 'radius-sm', 'shadow-swatch', 'line-soft'],
    frameHeight: 520,
    states: () => [
      {
        label: 'xl',
        wide: true,
        node: (
          <div className={styles.swatchRow} data-labels={`${s.default} · ${s.hover} · ${s.focus}`}>
            <Swatch value="#0B1F3A" caption="navy-900 · 412 uses" />
            <Swatch value="#2458E6" caption="blue-600 · 268 uses" forceState="hover" />
            <Swatch value="#0FA3A3" caption="teal-500 · 54 uses" forceState="focus" />
            <Swatch value="#F4F6FA" caption="gray-50 · 220 uses" />
          </div>
        ),
      },
      {
        label: 'token',
        node: (
          <Group>
            <Swatch value="#0B1F3A" size="token" caption="navy-900 · 412 uses" />
            <Swatch value="#FFFFFF" size="token" caption="white · 980 uses" />
          </Group>
        ),
      },
      {
        label: 'mini',
        node: (
          <Group>
            {['#3A3A3A', '#6B6B6B', '#6E6E6E', '#B5B5B5', '#D6D6D6', '#F4F6FA'].map((v) => (
              <Swatch key={v} value={v} size="mini" showHex aria-label={v} />
            ))}
          </Group>
        ),
      },
    ],
  },
  {
    slug: 'palette-strip',
    name: 'PaletteStrip',
    tokens: ['radius-lg (clipped by the card)', 'radius-sm', 'line-strong'],
    frameHeight: 220,
    states: () => [
      { label: 'card', node: <Card flush><PaletteStrip bands={palette} /></Card>, wide: true },
      {
        label: 'block',
        node: (
          <Group>
            <PaletteStrip bands={palette} block />
            <PaletteStrip bands={[]} block />
          </Group>
        ),
      },
    ],
  },
  {
    slug: 'preview-frame',
    name: 'PreviewFrame',
    tokens: ['surface-tint (the ground the caller gives it)'],
    frameHeight: 260,
    states: () => [
      { label: 'live', node: <div className={styles.previewGround}><PreviewFrame mode="live" src="/catalog/sample-preview.html" title="Primary button preview" width={128} height={58} /></div> },
      { label: runPage.captured, node: <div className={styles.previewGround}><PreviewFrame mode="captured" src="/catalog/sample-crop.png" title="Primary button preview" width={128} height={58} /></div> },
    ],
  },
  {
    slug: 'capture-viewer',
    name: 'CaptureViewer',
    tokens: ['bg', 'ink (outline)', 'line', 'shadow-card', 'meta'],
    frameHeight: 200,
    states: () => [
      { label: 'trigger', node: <CaptureDemo /> },
      {
        label: s.open,
        wide: true,
        node: (
          <div className={styles.captureFrame}>
            <CaptureFigure src="/catalog/sample-capture.png" alt="/ at 1440 px" width={1440} height={900} box={{ x: 48, y: 373, w: 112, h: 42 }} />
          </div>
        ),
      },
    ],
  },
];

export const demos: Demo[] = [...primitiveDemos, ...pageDemos, ...v2Demos];
