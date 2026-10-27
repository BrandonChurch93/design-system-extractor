'use client';
import { Copy, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import type * as ExportsModule from '@dse/pipeline/exports';
import type { ExportSet, RunDocumentPartial } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { global, runPage } from '../../copy/strings';
import { fileSize } from '../../lib/format';
import { Button } from '../Button';
import { Card } from '../Card';
import { ChipGroup } from '../ChipGroup';
import { CodeBlock } from '../CodeBlock';
import { RegionSkeleton } from './RegionSkeleton';
import { useToast } from '../Toast';
import { Enter } from '../motion/Enter';
import { Section } from './Section';
import styles from './ExportsSection.module.css';

const X = runPage.exports;
type TextFormat = 'tokens.css' | 'tokens.json' | 'tailwind.tokens.js' | 'tokens.w3c.json' | 'motion.css' | 'motion.json' | 'design-system.md' | 'prompt.md';
const cards: { format: TextFormat; copy: { name: string; file: string } }[] = [
  { format: 'tokens.css', copy: X.cards.css },
  { format: 'tokens.json', copy: X.cards.json },
  { format: 'tailwind.tokens.js', copy: X.cards.tailwind },
  { format: 'tokens.w3c.json', copy: X.cards.w3c },
  { format: 'motion.css', copy: X.cards.motionCss },
  { format: 'motion.json', copy: X.cards.motionJson },
  { format: 'design-system.md', copy: X.cards.md },
  { format: 'prompt.md', copy: X.cards.prompt },
];

type Exporters = typeof ExportsModule;

/** Where the files come from: the API for a stored run, the browser itself for a local one. */
export type ExportSource = { kind: 'api'; runId: string } | { kind: 'local'; storageBase?: string };

function useExporters(): Exporters | null {
  const [mod, setMod] = useState<Exporters | null>(null);
  useEffect(() => {
    let live = true;
    void import('@dse/pipeline/exports').then((m) => live && setMod(m));
    return () => {
      live = false;
    };
  }, []);
  return mod;
}

function save(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Eight export cards, the set toggle, Download all, and the MCP card (docs/design/components.md). */
export function ExportsSection({ doc, landed, runUrl, source }: { doc: RunDocumentPartial; landed: boolean; runUrl: string; source: ExportSource }) {
  const [set, setSet] = useState<ExportSet>('proposed');
  const mod = useExporters();
  const toast = useToast();
  const generate = (format: TextFormat) => mod?.generateExport(doc, format, { set, runUrl });
  const sizes = new Map(mod && landed ? cards.map((c) => [c.format, new TextEncoder().encode(generate(c.format)!.body).length]) : []);
  const href = (format: string) => (source.kind === 'api' ? `/api/runs/${source.runId}/export/${format}?set=${set}` : undefined);

  async function copyPrompt() {
    const file = generate('prompt.md');
    if (!file) return;
    try {
      await navigator.clipboard.writeText(file.body);
      toast.show(global.toasts.copied);
    } catch {
      // clipboard refused
    }
  }

  async function downloadAll() {
    if (!mod || source.kind !== 'local') return;
    const bytes = await mod.allZip(doc, { set, runUrl }, async (key) => {
      if (!source.storageBase) return null;
      try {
        const res = await fetch(`${source.storageBase.replace(/\/$/, '')}/${key}`, { signal: AbortSignal.timeout(30_000) });
        return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
      } catch {
        return null;
      }
    });
    save(`${doc.host ?? 'run'}-${set}.zip`, bytes.slice().buffer, 'application/zip');
  }

  return (
    <Section id="exports" title={X.heading} caption={X.caption}>
      {landed ? (
        <>
          <div className={styles.bar}>
            <ChipGroup
              label={X.heading}
              value={set}
              onChange={setSet}
              options={[
                { value: 'proposed', label: X.proposed },
                { value: 'raw', label: X.raw },
              ]}
            />
            {href('all.zip') ? (
              <Button variant="ghost" size="sm" icon={Download} href={href('all.zip')!}>
                {X.downloadAll}
              </Button>
            ) : (
              <Button variant="ghost" size="sm" icon={Download} onClick={downloadAll}>
                {X.downloadAll}
              </Button>
            )}
          </div>
          <ul className={styles.grid}>
            {cards.map((c, i) => {
              const size = sizes.get(c.format);
              const file = c.format === 'prompt.md' ? c.copy.file : fill(c.copy.file, { size: size !== undefined ? fileSize(size) : '…' });
              return (
                <Enter as="li" key={c.format} move="reveal" index={i}>
                  <Card className={styles.card}>
                    <h3 className={styles.name}>{c.copy.name}</h3>
                    <p className={styles.file}>{file}</p>
                    {c.format === 'prompt.md' ? (
                      <Button variant="ghost" size="sm" icon={Copy} onClick={copyPrompt} className={styles.action}>
                        {X.copyPrompt}
                      </Button>
                    ) : href(c.format) ? (
                      <Button variant="ghost" size="sm" icon={Download} href={href(c.format)!} className={styles.action}>
                        {X.download}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Download}
                        className={styles.action}
                        onClick={() => {
                          const f = generate(c.format);
                          if (f) save(f.filename, f.body, f.contentType);
                        }}
                      >
                        {X.download}
                      </Button>
                    )}
                  </Card>
                </Enter>
              );
            })}
          </ul>
          {source.kind === 'api' ? (
            <Enter move="reveal" index={6}>
              <Card className={styles.mcp}>
                <div className={styles.mcpHead}>
                  <h3 className={styles.name}>{runPage.mcp.title}</h3>
                  <p className={styles.tools}>{runPage.mcp.caption}</p>
                </div>
                <CodeBlock code={fill(runPage.mcp.install, { id: source.runId })} label={runPage.mcp.title} />
                <p className={styles.tools}>{runPage.mcp.tools}</p>
              </Card>
            </Enter>
          ) : null}
        </>
      ) : (
        <RegionSkeleton region="exports" />
      )}
    </Section>
  );
}
