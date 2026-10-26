import { Check, type CheckResult, type Checks, type Component, type ComponentType, type Tokens } from '@dse/schema';
import { contrastOf, focusOf, groundOf, labelOf, motionOf, na, tapOf, type Measured } from '../checks/measure';
import type { Item } from '../components/items';
import { stateOf } from '../components/variants';
import type { RunContext } from '../context';
import type { ComponentSources } from './components';

// Stage `checks` (docs/specs/checks.md): five measurements per component, the worst instance or
// variant deciding, `na` excluded from every count.

const interactiveTypes: ComponentType[] = ['button', 'link', 'input', 'select', 'textarea', 'checkbox', 'radio', 'toggle'];
const fieldTypes: ComponentType[] = ['input', 'select', 'textarea', 'checkbox', 'radio', 'toggle'];

type Scored = { m: Measured; it: Item };

/** A failure with the largest shortfall, else a pass (for tap target, the smallest box), else na. */
function worst(list: Scored[], preferSmall = false): Scored | null {
  const fails = list.filter((s) => s.m.status === 'fail').sort((a, b) => b.m.shortfall - a.m.shortfall);
  if (fails.length) return fails[0]!;
  const passes = list.filter((s) => s.m.status === 'pass');
  const side = (s: Scored) => Math.min(Number(s.m.measured?.w), Number(s.m.measured?.h));
  const area = (s: Scored) => Number(s.m.measured?.w) * Number(s.m.measured?.h);
  if (preferSmall) passes.sort((a, b) => side(a) - side(b) || area(a) - area(b));
  return passes[0] ?? list[0] ?? null;
}

/** From the instance's matched rules, or a sibling's when its cluster was read on another page (D-066). */
function placeholderColor(it: Item, siblings: Item[]): string | undefined {
  const from = it.vc.matched[it.el.d] ? it : siblings.find((x) => !x.revealed && x.vc.matched[x.el.d]);
  const rules = from?.vc.matched[from.el.d]?.pseudo.find((p) => p.pseudo === 'placeholder')?.rules ?? [];
  return rules.flatMap((r) => r.declarations).filter((d) => d.name === 'color').pop()?.value;
}

export function checkComponent(c: Component, src: NonNullable<ReturnType<ComponentSources['get']>>, tokens: Tokens): CheckResult[] {
  const normal = src.items.filter((it) => !stateOf(it.el) && !it.revealed);
  const reps = [...new Set([src.first, ...src.variants.values()])];
  const result = (check: Check, s: Scored | null, fallback: Measured): CheckResult => {
    const m = s?.m ?? fallback;
    const variantId = s ? src.variantOf.get(s.it) : undefined;
    return { check, status: m.status, detail: m.detail, ...(m.measured ? { measured: m.measured } : {}), ...(variantId && s && s.it !== src.first ? { variantId } : {}) };
  };
  const interactive = interactiveTypes.includes(c.type);

  const contrast = worst(reps.map((it) => ({ it, m: contrastOf(it, tokens.colors, placeholderColor(it, src.items)) })).filter((s): s is Scored => s.m !== null));

  let focus: Scored | null = null;
  let focusNa = na();
  if (interactive) {
    const measured: Scored[] = [];
    for (const it of reps.filter((r) => !r.revealed)) {
      const rec = (it.vc.states[it.el.d] ?? []).find((r) => r.state === 'focus');
      if (!rec) continue;
      const parent = it.el.p >= 0 ? it.snapshot.elements[it.el.p] : undefined;
      const ground = (parent ? groundOf(it.snapshot, parent) : null) ?? { r: 255, g: 255, b: 255, a: 1 };
      measured.push({ it, m: focusOf(rec.delta, Boolean(rec.reachedByKeyboard), it.el, ground, tokens.colors) });
    }
    focus = worst(measured);
    focusNa = na('Not measured: capture cap');
  }

  let tap: Scored | null = null;
  let tapNa = na();
  if (interactive) {
    const phone = src.items.filter((it) => it.viewport === 'mobile' && !it.revealed);
    tap = worst(phone.map((it) => ({ it, m: tapOf(it.el) })), true);
    tapNa = na('Not present at 390 px');
  }

  let label: Scored | null = null;
  const iconOnly = src.first.fp.iconOnly || src.first.el.text.trim().length < 2;
  if (fieldTypes.includes(c.type) || ((c.type === 'button' || c.type === 'link') && iconOnly)) {
    label = worst(normal.map((it) => ({ it, m: labelOf(it, iconOnly) })));
  }

  const motion = worst(
    src.items
      .filter((it) => !it.revealed)
      .map((it) => ({ it, m: motionOf(it.vc.motionMain[it.el.d], it.vc.motionReduced[it.el.d], it.interactive) }))
      .filter((s): s is Scored => s.m !== null),
  );

  return [result('contrast', contrast, na()), result('focus-visible', focus, focusNa), result('tap-target', tap, tapNa), result('label', label, na()), result('reduced-motion', motion, na())];
}

/** The per-run summary and the by-check lists, the worst eight failures each (docs/specs/checks.md). */
export function summarize(comps: Component[]): Checks {
  const all = comps.flatMap((c) => c.checks.map((r) => ({ c, r })));
  const applicable = all.filter(({ r }) => r.status !== 'na');
  const shortfall = (r: CheckResult) => {
    const m = r.measured ?? {};
    if (r.check === 'contrast') return (r.detail.includes('needs 3:1') ? 3 : 4.5) - Number(m.ratio ?? 0);
    if (r.check === 'tap-target') return 44 - Math.min(Number(m.w ?? 44), Number(m.h ?? 44));
    if (r.check === 'focus-visible') return 3 - Number(m.ratio ?? 0);
    return 1;
  };
  return {
    summary: { passed: applicable.filter(({ r }) => r.status === 'pass').length, failed: applicable.filter(({ r }) => r.status === 'fail').length, applicable: applicable.length, total: comps.length * Check.options.length },
    byCheck: Check.options.map((check) => {
      const mine = applicable.filter(({ r }) => r.check === check);
      return {
        check,
        passed: mine.filter(({ r }) => r.status === 'pass').length,
        applicable: mine.length,
        failing: mine
          .filter(({ r }) => r.status === 'fail')
          .sort((a, b) => shortfall(b.r) - shortfall(a.r))
          .slice(0, 8)
          .map(({ c, r }) => ({ componentId: c.id, name: c.name, detail: r.detail })),
      };
    }),
  };
}

export async function checks(ctx: RunContext, comps: Component[], sources: ComponentSources, tokens: Tokens): Promise<{ components: Component[]; checks: Checks }> {
  const out = comps.map((c) => {
    const src = sources.get(c.id);
    return src ? { ...c, checks: checkComponent(c, src, tokens) } : c;
  });
  const summary = summarize(out);
  await ctx.emit({
    stage: 'checks',
    message: `${summary.summary.applicable} applicable · ${summary.summary.passed} passed · ${summary.summary.failed} failed`,
    patch: { components: out, checks: summary },
  });
  return { components: out, checks: summary };
}
