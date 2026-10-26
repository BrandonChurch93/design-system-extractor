import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test } from '@playwright/test';
import { freezeClock, qaPages, settle, viewports, withFullHeight } from './pages';

// Design QA: the evidence the gate reviews (docs/evals.md). Writes qa/{page}/{viewport}/{state}.png,
// a keyboard focus walk per page, and qa/index.html.

const out = resolve(import.meta.dirname, '../../qa');

for (const vp of viewports) {
  for (const p of qaPages) {
    for (const st of p.states) {
      test(`${p.name} · ${vp.name} · ${st.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await freezeClock(page);
        if (st.before) await st.before(page);
        await page.goto(st.path ?? p.path);
        await settle(page);
        if (st.setup) await st.setup(page);
        const dir = join(out, p.name, vp.name);
        mkdirSync(dir, { recursive: true });
        await withFullHeight(page, () => page.screenshot({ path: join(dir, `${st.name}.png`) }));
      });
    }

    test(`${p.name} · ${vp.name} · focus walk`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(p.path);
      await settle(page);
      const dir = join(out, p.name, vp.name, 'focus');
      mkdirSync(dir, { recursive: true });
      await page.locator('body').click({ position: { x: 1, y: 1 } });
      for (let i = 0; i < 60; i++) {
        await page.keyboard.press('Tab');
        const box = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;
          el.scrollIntoView({ block: 'center', behavior: 'instant' });
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        });
        if (!box) continue;
        const pad = 16;
        const clip = {
          x: Math.max(0, box.x - pad),
          y: Math.max(0, box.y - pad),
          width: Math.min(vp.width - Math.max(0, box.x - pad), box.w + pad * 2),
          height: Math.min(vp.height - Math.max(0, box.y - pad), box.h + pad * 2),
        };
        if (clip.width < 4 || clip.height < 4) continue;
        await page.screenshot({ path: join(dir, `${String(i).padStart(2, '0')}.png`), clip });
      }
    });
  }
}

test.afterAll(() => {
  const rows: string[] = [];
  for (const p of qaPages) {
    for (const vp of viewports) {
      const dir = join(out, p.name, vp.name);
      let shots: string[] = [];
      try {
        shots = readdirSync(dir).filter((f) => f.endsWith('.png'));
      } catch {
        continue;
      }
      let focus: string[] = [];
      try {
        focus = readdirSync(join(dir, 'focus')).filter((f) => f.endsWith('.png'));
      } catch {
        focus = [];
      }
      rows.push(
        `<section><h2>${p.name} · ${vp.name}</h2><div class="row">${shots
          .map((f) => `<figure><a href="${p.name}/${vp.name}/${f}"><img src="${p.name}/${vp.name}/${f}" loading="lazy"></a><figcaption>${f}</figcaption></figure>`)
          .join('')}</div><div class="focus">${focus.map((f) => `<img src="${p.name}/${vp.name}/focus/${f}" loading="lazy">`).join('')}</div></section>`,
      );
    }
  }
  writeFileSync(
    join(out, 'index.html'),
    `<!doctype html><meta charset="utf-8"><title>Design QA</title><style>body{font:14px system-ui;margin:24px;background:#FCFAF8;color:#23201E}h2{font-size:16px}.row{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}figure{margin:0;width:280px}figure img{width:100%;border:1px solid #ddd}.focus{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.focus img{max-height:90px;border:1px solid #ddd}</style>${rows.join('')}`,
  );
});
