import styles from './PreviewFrame.module.css';

type PreviewFrameProps = {
  /** live: a sandboxed iframe on the storage origin; captured: the crop image. */
  mode: 'live' | 'captured';
  src: string;
  title: string;
  width: number;
  height: number;
  lazy?: boolean;
};

/** Never srcdoc (D-017): the preview document's own CSP governs it, as in the worker's check. */
export function PreviewFrame({ mode, src, title, width, height, lazy }: PreviewFrameProps) {
  if (mode === 'captured') {
    // eslint-disable-next-line @next/next/no-img-element -- storage-origin crops at their CSS size
    return <img src={src} alt={title} width={width} height={height} className={styles.frame} loading={lazy ? 'lazy' : undefined} />;
  }
  return (
    <iframe
      src={src}
      title={title}
      sandbox=""
      width={width}
      height={height}
      loading={lazy ? 'lazy' : undefined}
      referrerPolicy="no-referrer"
      className={styles.frame}
      tabIndex={-1}
    />
  );
}
