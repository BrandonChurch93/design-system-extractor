/** Whether a stored document was written by a build before `target` (its `pipelineVersion`, D-092). */
export function storedBefore(doc: { pipelineVersion?: string }, target: string): boolean {
  const parts = (v: string) => v.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const a = parts(doc.pipelineVersion ?? '0.0.0');
  const b = parts(target);
  for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) < (b[i] ?? 0);
  return false;
}
