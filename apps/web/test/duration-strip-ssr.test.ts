import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { RunDocumentPartial } from '@dse/schema';
import messy from '../../../packages/pipeline/test/fixtures/runs/messy.json';
import { DurationStrip } from '../components/run/DurationStrip';

// Chrome keeps six significant digits of an inline length, and hydration compares what it kept with the
// client's value: a tick at 65.75860145844834px hydrated as a mismatch in development (D-114).

describe('the duration strip server render', () => {
  it('writes every tick position with two decimals at most', () => {
    const doc = messy as unknown as RunDocumentPartial;
    const html = renderToStaticMarkup(createElement(DurationStrip, { durations: doc.tokens!.duration!, doc }));
    const lefts = [...html.matchAll(/left:([\d.]+)px/g)].map((m) => m[1]!);
    expect(lefts.length).toBe(doc.tokens!.duration!.filter((d) => d.ms <= 2000).length);
    expect(lefts.filter((v) => /\.\d{3,}/.test(v))).toEqual([]);
  });
});
