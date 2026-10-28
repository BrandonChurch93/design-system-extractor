'use client';
import { FileJson } from 'lucide-react';
import { useState } from 'react';
import { RunDocumentComplete, type RunResponse } from '@dse/schema';
import { upgradeRunDocument } from '@dse/pipeline/upgrade';
import { componentGroupLabels } from '@dse/schema/labels';
import { global, openPage as O } from '../../copy/strings';
import { orderedComponents } from '../../lib/doc';
import { Footer } from '../Footer';
import { PreviewPlaceholder } from '../FitPreview';
import { ComponentPanel } from '../panel/ComponentPanel';
import { RunView } from '../run/RunView';
import styles from './OpenView.module.css';

/** A run.json from the CLI, read and rendered in this browser; nothing is uploaded (D-015). */
export function OpenView() {
  const [run, setRun] = useState<RunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);

  async function read(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const doc = RunDocumentComplete.parse(upgradeRunDocument(JSON.parse(await file.text())));
      setRun({ id: doc.id, status: doc.status, isShowcase: false, document: doc, events: [] });
    } catch {
      setError(global.validation);
    }
  }

  if (run) {
    const doc = run.document;
    const base = doc.local?.base;
    const component = opened ? doc.components?.find((c) => c.id === opened) : undefined;
    const neighbors = orderedComponents(doc, Object.keys(componentGroupLabels)).map((c) => ({ id: c.id, group: c.group }));
    return (
      <PreviewPlaceholder.Provider value={base ? undefined : O.placeholder}>
        <RunView initial={run} storageBase={base} appUrl="" local onOpenComponent={setOpened} />
        {component ? (
          <ComponentPanel runId={run.id} doc={doc} component={component} neighbors={neighbors} base={base} runUrl="run.json" local={{ onNavigate: setOpened, onClose: () => setOpened(null) }} />
        ) : null}
      </PreviewPlaceholder.Provider>
    );
  }

  return (
    <>
    <main id="main" className={styles.main}>
      <h1 className={styles.title}>{O.title}</h1>
      <p className={styles.caption}>{O.caption}</p>
      <label
        className={styles.drop}
        data-over={over || undefined}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void read(e.dataTransfer.files[0]);
        }}
      >
        <FileJson size={20} strokeWidth={1.75} aria-hidden="true" />
        <span className={styles.dropText}>{O.drop}</span>
        <span className={styles.choose}>{O.choose}</span>
        <input type="file" accept="application/json,.json" className="visually-hidden" onChange={(e) => void read(e.target.files?.[0])} />
      </label>
      {error ? <p className={styles.error}>{error}</p> : null}
    </main>
    <Footer />
    </>
  );
}
