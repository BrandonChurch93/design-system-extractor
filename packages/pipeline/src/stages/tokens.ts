import type { Tokens } from '@dse/schema';
import type { RunContext } from '../context';
import { buildColors } from '../tokens/colors';
import { collect, normalizeShadow, type RawTokens } from '../tokens/collect';
import { CLUSTER_DELTA_E } from '../tokens/constants';
import { nameColors } from '../tokens/naming';
import { sourcesFrom } from '../tokens/sources';
import { buildBreakpoints, buildRadius, buildShadows, buildSpace } from '../tokens/space';
import { buildType } from '../tokens/type';
import type { CaptureOutput } from './capture';

// Stage `tokens` (docs/specs/token-clustering.md): palette, type, then spacing with radius,
// shadows and breakpoints, each landing in the run document as it is done.

// The whole value is one custom property such as var(--shadow-md) or var(--ds-shadow-lg, ...).
const shadowVar = /^var\(--(?:[a-z0-9]+-)*shadow-([a-z0-9]+)\s*(?:,[^)]*)?\)$/;

/** Names a site gives its shadows through custom properties, by normalized value. */
export function siteShadowNames(capture: CaptureOutput): Map<string, string> {
  const votes = new Map<string, Map<string, number>>();
  for (const pc of capture.pages) {
    for (const vc of Object.values(pc.viewports)) {
      if (!vc) continue;
      for (const [d, m] of Object.entries(vc.matched)) {
        const value = normalizeShadow(vc.snapshot.byDse.get(d)?.style['box-shadow'] ?? '');
        if (!value) continue;
        // Rules arrive in cascade order, so the last box-shadow declaration is the one that applies.
        const decl = [...m.rules.flatMap((r) => r.declarations), ...m.inline].filter((x) => x.name === 'box-shadow').pop();
        const name = decl ? shadowVar.exec(decl.value.trim())?.[1] : undefined;
        if (!name) continue;
        const v = votes.get(value) ?? new Map<string, number>();
        v.set(name, (v.get(name) ?? 0) + 1);
        votes.set(value, v);
      }
    }
  }
  return new Map([...votes].map(([value, v]) => [value, [...v].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]![0]]));
}

export function rawCountsOf(raw: RawTokens): Tokens['rawCounts'] {
  return { colors: raw.colors.size, fontDecls: raw.fontDecls, spacingValues: raw.space.size, radii: raw.radius.size, shadows: raw.shadows.size };
}

export async function tokens(ctx: RunContext, capture: CaptureOutput): Promise<Tokens> {
  const raw = collect(sourcesFrom(capture));
  const pageCount = capture.pages.filter((p) => p.status === 'captured').length;

  const palette = buildColors(raw);
  await ctx.emit({
    stage: 'tokens',
    substage: 'tokens:palette',
    message: `colors ${palette.tokens.length} clustered from ${palette.rawCount} raw values · ΔE threshold ${CLUSTER_DELTA_E}${palette.merged ? ` · capped, ${palette.merged} merged` : ''}`,
  });
  const naming = await nameColors(ctx, palette.tokens, pageCount);
  await ctx.emit({
    stage: 'tokens',
    substage: 'tokens:palette',
    message: naming.by === 'fallback' ? `color names by fallback (${naming.reason})` : `color names by ${naming.by}${naming.renamed ? ` · ${naming.renamed} renamed` : ''}`,
    data: { by: naming.by, reason: naming.reason, renamed: naming.renamed },
    patch: { tokens: { colors: palette.tokens } },
  });

  const type = buildType(raw);
  const unloaded = type.families.filter((f) => !f.loaded).map((f) => f.name);
  await ctx.emit({
    stage: 'tokens',
    substage: 'tokens:type',
    message: `type ${type.tokens.length} styles · ${type.families.map((f) => f.name).join(', ') || 'no families'} · ${unloaded.length ? `${unloaded.join(', ')} not loaded` : 'all loaded'}`,
    patch: { tokens: { type: type.tokens, families: type.families } },
  });

  const { space, spaceBase } = buildSpace(raw);
  const radius = buildRadius(raw);
  const shadow = buildShadows(raw, siteShadowNames(capture));
  const breakpoints = buildBreakpoints(raw);
  const rawCounts = rawCountsOf(raw);
  const off = space.filter((s) => !s.onGrid).length;
  await ctx.emit({
    stage: 'tokens',
    substage: 'tokens:space',
    message: `spacing ${space.length} steps · ${spaceBase.value} px base${spaceBase.clear ? '' : ' (mixed)'}${off ? ` · ${off} off grid` : ''} · ${radius.length} radii · ${shadow.length} shadows`,
    patch: { tokens: { space, spaceBase, radius, shadow, breakpoints, rawCounts } },
  });

  return { colors: palette.tokens, type: type.tokens, space, spaceBase, radius, shadow, breakpoints, rawCounts, families: type.families };
}
