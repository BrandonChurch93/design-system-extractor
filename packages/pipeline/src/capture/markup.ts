/**
 * The markup of each element and the computed value of every custom property its rules name, for
 * previews (docs/specs/preview-fidelity.md). Runs in the page. Markup over the cap is left out.
 */
export function markupOf(arg: { items: { d: string; vars: string[] }[]; cap: number }): Record<string, { html: string; vars: Record<string, string> }> {
  const out: Record<string, { html: string; vars: Record<string, string> }> = {};
  for (const it of arg.items) {
    const el = document.querySelector(`[data-dse-id="${it.d}"]`);
    if (!el) continue;
    const html = el.outerHTML;
    const cs = getComputedStyle(el);
    const vars: Record<string, string> = {};
    for (const v of it.vars) {
      const value = cs.getPropertyValue(v).trim();
      if (value) vars[v] = value;
    }
    out[it.d] = { html: html.length <= arg.cap ? html : '', vars };
  }
  return out;
}
