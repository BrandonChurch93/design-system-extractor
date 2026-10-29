import { RunResponse } from '@dse/schema';
import { contrastFallback } from '../apps/web/lib/ground';
import { labelRows, logPositions } from '../apps/web/lib/duration-axis';
for (const id of process.argv.slice(2)) {
  const r = RunResponse.parse(await (await fetch(`http://localhost:3000/api/runs/${id}`)).json());
  const d = r.document;
  const comps = d.components ?? [];
  const p = d.stats?.previews;
  const checked = comps.filter((c) => c.preview.capturedReason !== 'not-checked' && c.preview.capturedReason !== 'no-crop');
  const live = comps.filter((c) => c.preview.mode === 'live').length;
  const coreChecked = checked.filter((c) => c.tier === 'core');
  console.log(`${id} · ${d.host} · ${r.status} · ${Math.round((d.durationMs ?? 0) / 1000)} s · $${d.cost?.usd?.toFixed(4)} · ${d.pages?.length} pages · ${comps.length} components`);
  console.log('previews', JSON.stringify(p), `live of checked ${live} of ${checked.length} = ${((100 * live) / Math.max(1, checked.length)).toFixed(1)}%`, `core ${coreChecked.filter((c) => c.preview.mode === 'live').length} of ${coreChecked.length}`);
  console.log('passing', JSON.stringify(d.stats?.componentsPassing), 'checks', d.stats?.checksPassed, 'of', d.stats?.checksApplicable);
  const hidden = comps.filter((c) => c.instances.some((i) => i.hiddenAtCapture) || /skip/i.test(c.name));
  for (const c of hidden) console.log('hidden/skip', c.name, c.preview.mode, c.preview.capturedReason ?? '', c.preview.width, c.preview.height, c.instances.filter((i) => i.hiddenAtCapture).length, 'hidden instances');
  const fb = comps.filter((c) => contrastFallback(c.preview.fill, c.preview.ground ?? c.ground));
  console.log('contrast fallback', fb.length, 'of', comps.length, fb.slice(0, 12).map((c) => `${c.name} ${c.preview.fill} on ${c.preview.ground ?? c.ground}`).join('; '));
  console.log('no-crop', comps.filter((c) => c.preview.capturedReason === 'no-crop').map((c) => c.name).join(', ') || 'none');
  const nf = comps.filter((c) => /404 page|does not exist/.test(c.name) || /does-not-exist/.test(c.provenance.firstSeen.path));
  console.log('404 page components', nf.map((c) => `${c.name} [${c.type}] ${c.provenance.firstSeen.path}`).join('; ') || 'none');
  console.log('names with does not exist', comps.filter((c) => /does not exist/.test(c.name)).length, 'patterns dangling', (d.motion?.patterns ?? []).filter((x) => x.componentId && !comps.some((c) => c.id === x.componentId)).length);
  const ms = (d.tokens?.duration ?? []).map((x) => x.ms).sort((a, b) => a - b);
  const rows = labelRows(logPositions(ms, 1064), ms.map((v) => `${v.toLocaleString('en-US')} ms`));
  console.log('durations', ms.join(','), 'dropped at 1440', rows.filter((x) => x === null).length);
  console.log('keyframes', d.tokens?.keyframes?.length, 'patterns', d.motion?.patterns.length, 'easings', d.tokens?.easing?.length, 'radius', d.tokens?.radius?.length, 'shadows', (d.tokens?.shadow ?? []).map((s) => s.value).join(' | '));
}
