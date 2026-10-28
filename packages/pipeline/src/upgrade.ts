import { componentsPassing, previewCounts, TypeRole, type TypeRole as Role } from '@dse/schema';
import { easingUsedBy } from './components/used-by';
import { slugsOf } from './components/slug';
import { SHADOW_NAMES } from './tokens/constants';
import { assignRoles, nameTypes, type RawType } from './tokens/type-roles';

// Upgrading stored documents (docs/specs/data-model.md, D-092): a stored document keeps the shape of
// the build that wrote it; every read path brings it to the current shape first. Each step checks the
// shape it fills as well as the version, so upgrading twice equals upgrading once. Browser-safe: /open
// runs it. `pipelineVersion` is left as it was.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any>;

function below(version: unknown, target: string): boolean {
  const parts = (v: string) => v.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const a = parts(typeof version === 'string' ? version : '0.0.0');
  const b = parts(target);
  for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) < (b[i] ?? 0);
  return false;
}

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const roleSet = new Set<string>(TypeRole.options);

/** v1.0 roles were tag words; `body` was the running-text tuple, which is what the v1.1 rule reads tags for. */
function rawOf(t: Json): RawType {
  const tag = t.role === 'body' ? 'p' : /^h[1-6]$/.test(String(t.role)) ? String(t.role) : undefined;
  return {
    key: String(t.id ?? t.name),
    family: String(t.family ?? ''),
    fallbackStack: String(t.fallbackStack ?? ''),
    size: Number(t.size),
    lineHeight: Number(t.lineHeight),
    weight: Number(t.weight),
    letterSpacing: Number(t.letterSpacing ?? 0),
    ...(t.textTransform ? { textTransform: String(t.textTransform) } : {}),
    count: Number(t.usage ?? 1),
    tags: new Map(tag ? [[tag, Number(t.usage ?? 1)]] : []),
    pages: new Map(),
    sample: String(t.sample ?? ''),
    homeLargest: false,
    pageLargest: false,
  };
}

/** Roles and names recomputed from stored tuples with the v1.1 rules; a tuple the rules would merge keeps its own, unique name. */
function recompute(list: Json[]): { roles: Role[]; names: string[] } {
  const raws = list.map(rawOf);
  const roles = assignRoles(raws);
  const { names } = nameTypes(raws, roles);
  const taken = new Set<string>();
  const out = raws.map((r) => {
    const role = roles.get(r) ?? 'text';
    let name = names.get(r) ?? `${role === 'text' ? 'text' : role}-${Math.round(r.size)}`;
    if (taken.has(name)) name = `${name}-${Math.round(r.lineHeight)}`;
    for (let c = 98; taken.has(name); c++) name = `${name.replace(/[a-z]$/, '')}${String.fromCharCode(c)}`;
    taken.add(name);
    return { role, name };
  });
  return { roles: out.map((o) => o.role), names: out.map((o) => o.name) };
}

function toV11(doc: Json): void {
  if (!isObject(doc.motion)) doc.motion = { patterns: [], truncatedPages: [], intersectionObservers: 0 };
  const t = doc.tokens;
  if (isObject(t)) {
    for (const k of ['overlays', 'duration', 'easing', 'keyframes', 'siteVariables']) if (!Array.isArray(t[k])) t[k] = [];
    // v1.0 took any `--shadow-{name}` suffix; v1.1 keeps only valid token names, else the bucket name by rank.
    if (Array.isArray(t.shadow)) {
      const valid = (n: unknown) => typeof n === 'string' && /^[a-zA-Z][\w-]*$/.test(n);
      const taken = new Set(t.shadow.filter((x: Json) => valid(x.name)).map((x: Json) => x.name));
      t.shadow.forEach((x: Json, i: number) => {
        if (valid(x.name)) return;
        const name = [SHADOW_NAMES[i] as string | undefined, `shadow-${i + 1}`].find((n) => n && !taken.has(n)) ?? `shadow-${i + 1}x`;
        taken.add(name);
        x.name = name;
      });
    }
    if (Array.isArray(t.breakpoints)) t.breakpoints = t.breakpoints.map((b: unknown) => (typeof b === 'number' ? { value: b, usage: 0 } : b));
    const type: Json[] = Array.isArray(t.type) ? t.type : [];
    const renamed = new Map<string, string>();
    if (type.some((x) => typeof x.uppercase !== 'boolean' || !roleSet.has(x.role))) {
      const { roles, names } = recompute(type);
      type.forEach((x, i) => {
        renamed.set(x.name, names[i]!);
        x.role = roles[i];
        x.name = names[i];
        x.uppercase = x.textTransform === 'uppercase';
        if (!Array.isArray(x.tags)) x.tags = [];
      });
    }
    const proposal = doc.drift?.proposal;
    if (isObject(proposal)) {
      const ptype: Json[] = Array.isArray(proposal.type) ? proposal.type : [];
      if (renamed.size > 0 || ptype.some((x) => !roleSet.has(x.role))) {
        const { roles } = recompute(ptype);
        ptype.forEach((x, i) => {
          x.role = roles[i];
          if (renamed.has(x.name)) x.name = renamed.get(x.name);
          if (Array.isArray(x.absorbs)) x.absorbs = x.absorbs.map((n: string) => renamed.get(n) ?? n);
        });
      }
      if (!Array.isArray(proposal.durations)) proposal.durations = [];
      if (!Array.isArray(proposal.easings)) proposal.easings = [];
    }
  }
  const comps: Json[] = Array.isArray(doc.components) ? doc.components : [];
  if (comps.some((c) => typeof c.slug !== 'string')) {
    const used = new Set(comps.filter((c) => typeof c.slug === 'string').map((c) => c.slug as string));
    const slugs = slugsOf([...comps.filter((c) => typeof c.slug === 'string').map((c) => c.name), ...comps.filter((c) => typeof c.slug !== 'string').map((c) => c.name)]).slice(used.size);
    let i = 0;
    for (const c of comps) if (typeof c.slug !== 'string') c.slug = slugs[i++];
  }
  for (const c of comps) {
    if (c.tier !== 'core' && c.tier !== 'page') c.tier = 'core';
    if (c.motion === undefined) c.motion = null;
  }
}

function toV12(doc: Json): void {
  const comps: Json[] = Array.isArray(doc.components) ? doc.components : [];
  const easing: Json[] | undefined = doc.tokens?.easing;
  if (Array.isArray(easing) && easing.some((e) => !isObject(e.usedBy))) {
    doc.tokens.easing = easingUsedBy(easing as never, comps as never, (doc.motion?.patterns ?? []) as never);
  }
  if (isObject(doc.stats) && Array.isArray(doc.components)) {
    if (!isObject(doc.stats.componentsPassing)) doc.stats.componentsPassing = componentsPassing(comps.map((c) => ({ checks: Array.isArray(c.checks) ? c.checks : [] })) as never);
    if (!isObject(doc.stats.previews) && comps.every((c) => isObject(c.preview))) doc.stats.previews = previewCounts(comps as never);
  }
}

/** Brings a stored run document to the current shape by its `pipelineVersion`. Returns a new object. */
export function upgradeRunDocument<T>(input: T): T {
  if (!isObject(input)) return input;
  const doc = structuredClone(input) as Json;
  if (below(doc.pipelineVersion, '1.1.0')) toV11(doc);
  if (below(doc.pipelineVersion, '1.2.0')) toV12(doc);
  return doc as T;
}
