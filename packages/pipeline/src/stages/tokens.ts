import type { SiteVariable, TokenKind, Tokens } from '@dse/schema';
import type { RunContext } from '../context';
import { buildColors } from '../tokens/colors';
import { collect, type RawTokens } from '../tokens/collect';
import { CLUSTER_DELTA_E } from '../tokens/constants';
import { buildMotion, type MotionBuild } from '../tokens/motion';
import { nameColors } from '../tokens/naming';
import { buildOverlays, splitOverlays } from '../tokens/overlays';
import { applySiteNames, collectSiteVariables, freeName } from '../tokens/site-vars';
import { sourcesFrom } from '../tokens/sources';
import { buildBreakpoints, buildRadius, buildShadows, buildSpace } from '../tokens/space';
import { buildType } from '../tokens/type';
import type { CaptureOutput } from './capture';

// Stage `tokens` (docs/specs/token-clustering.md): site variables first, then palette with overlays,
// type, spacing with radius, shadows and breakpoints, then motion, each landing in the run document as
// it is done.

export function rawCountsOf(raw: RawTokens, colors = raw.colors.size): Tokens['rawCounts'] {
  return { colors, fontDecls: raw.fontDecls, spacingValues: raw.space.size, radii: raw.radius.size, shadows: raw.shadows.size };
}

export type ExtractedTokens = Tokens & { motionBuild: MotionBuild };

/** Applies the site's names to one kind's tokens; a generated name a site name already holds takes a letter. */
function siteNames<T extends { id: string; name?: string; siteName?: string }>(kind: TokenKind, list: T[], valueOf: (t: T) => string | number, vars: SiteVariable[], setName: boolean): number {
  const named = applySiteNames(kind, list, valueOf, vars);
  for (const n of named) {
    n.token.siteName = n.variable.name;
    if (setName) n.token.name = n.name;
  }
  if (setName) {
    const taken = new Set(named.map((n) => n.name));
    for (const t of list) if (!t.siteName && t.name !== undefined) t.name = freeName(t.name, taken);
  }
  return named.length;
}

export async function tokens(ctx: RunContext, capture: CaptureOutput): Promise<ExtractedTokens> {
  const raw = collect(sourcesFrom(capture));
  const pageCount = capture.pages.filter((p) => p.status === 'captured').length;
  const rawCounts = rawCountsOf(raw);
  const translucent = splitOverlays(raw);
  const siteVariables = collectSiteVariables(capture);

  const palette = buildColors(raw);
  let siteNamed = siteNames('color', palette.tokens, (t) => t.value, siteVariables, true);
  await ctx.emit({
    stage: 'tokens',
    substage: 'tokens:palette',
    message: `colors ${palette.tokens.length} clustered from ${rawCounts.colors} raw values · ΔE threshold ${CLUSTER_DELTA_E}${palette.merged ? ` · capped, ${palette.merged} merged` : ''}`,
  });
  const naming = await nameColors(ctx, palette.tokens, pageCount);
  const overlays = buildOverlays(translucent, palette.tokens);
  siteNamed += siteNames('color', overlays, (t) => t.value, siteVariables, true);
  await ctx.emit({
    stage: 'tokens',
    substage: 'tokens:palette',
    message: naming.by === 'fallback' ? `color names by fallback (${naming.reason})` : `color names by ${naming.by}${naming.renamed ? ` · ${naming.renamed} renamed` : ''}`,
    data: { by: naming.by, reason: naming.reason, renamed: naming.renamed },
    patch: { tokens: { colors: palette.tokens, overlays } },
  });

  const type = buildType(raw);
  siteNamed += siteNames('type', [...type.tokens].sort((a, b) => b.usage - a.usage), (t) => t.size, siteVariables, true);
  const unloaded = type.families.filter((f) => !f.loaded).map((f) => f.name);
  await ctx.emit({
    stage: 'tokens',
    substage: 'tokens:type',
    message: `type ${type.tokens.length} styles · ${type.families.map((f) => f.name).join(', ') || 'no families'} · ${unloaded.length ? `${unloaded.join(', ')} not loaded` : 'all loaded'}`,
    patch: { tokens: { type: type.tokens, families: type.families } },
  });

  const { space, spaceBase } = buildSpace(raw);
  const radius = buildRadius(raw);
  const shadow = buildShadows(raw);
  const breakpoints = buildBreakpoints(raw);
  siteNamed += siteNames('space', space, (t) => t.value, siteVariables, false);
  siteNamed += siteNames('radius', radius, (t) => t.value, siteVariables, false);
  siteNamed += siteNames('shadow', shadow, (t) => t.value, siteVariables, true);
  siteNamed += siteNames('breakpoint', breakpoints.map((b) => Object.assign(b, { id: `bp${b.value}` })), (t) => t.value, siteVariables, false);
  for (const b of breakpoints) delete (b as { id?: string }).id;
  const off = space.filter((s) => !s.onGrid).length;
  await ctx.emit({
    stage: 'tokens',
    substage: 'tokens:space',
    message: `spacing ${space.length} steps · ${spaceBase.value} px base${spaceBase.clear ? '' : ' (mixed)'}${off ? ` · ${off} off grid` : ''} · ${radius.length} radii · ${shadow.length} shadows`,
    patch: { tokens: { space, spaceBase, radius, shadow, breakpoints, rawCounts } },
  });

  const motionBuild = buildMotion(capture, siteVariables);
  siteNamed += [...motionBuild.duration, ...motionBuild.easing].filter((t) => t.siteName).length;
  await ctx.emit({
    stage: 'tokens',
    substage: 'tokens:motion',
    message: `motion ${motionBuild.duration.length} durations · ${motionBuild.easing.length} easings · ${motionBuild.keyframes.length} keyframes`,
    data: { patterns: motionBuild.motion.patterns.length },
  });
  await ctx.emit({
    stage: 'tokens',
    substage: 'tokens:motion',
    message: `${siteNamed} site variables named tokens · ${overlays.length} overlays`,
    patch: { tokens: { duration: motionBuild.duration, easing: motionBuild.easing, keyframes: motionBuild.keyframes, siteVariables }, motion: motionBuild.motion },
  });

  return {
    colors: palette.tokens,
    overlays,
    type: type.tokens,
    space,
    spaceBase,
    radius,
    shadow,
    duration: motionBuild.duration,
    easing: motionBuild.easing,
    keyframes: motionBuild.keyframes,
    breakpoints,
    siteVariables,
    rawCounts,
    families: type.families,
    motionBuild,
  };
}
