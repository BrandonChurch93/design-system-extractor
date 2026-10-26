'use client';
import { Copy, Share } from 'lucide-react';
import { fill } from '@dse/schema/labels';
import { global, runPage } from '../../copy/strings';
import { Button } from '../Button';
import { Popover } from '../Popover';
import { useToast } from '../Toast';
import styles from './SharePopover.module.css';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** The run's link with Copy and Copy as markdown (docs/design/components.md, SharePopover). */
export function SharePopover({ url, host }: { url: string; host: string }) {
  const toast = useToast();
  return (
    <Popover
      label={runPage.share.label}
      width={360}
      placement="bottom-end"
      trigger={(t) => (
        <Button variant="ghost" icon={Share} {...t}>
          {runPage.buttons.share}
        </Button>
      )}
    >
      <div className={styles.body}>
        <label className={styles.label} htmlFor="dse-share-url">
          {runPage.share.label}
        </label>
        <div className={styles.row}>
          <input id="dse-share-url" className={styles.url} readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
          <Button
            variant="ghost"
            size="sm"
            icon={Copy}
            onClick={async () => {
              if (await copyText(url)) toast.show(global.toasts.linkCopied);
            }}
          >
            {runPage.share.copy}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            if (await copyText(fill(runPage.share.markdownText, { host, url }))) toast.show(global.toasts.copied);
          }}
        >
          {runPage.share.markdown}
        </Button>
      </div>
    </Popover>
  );
}
