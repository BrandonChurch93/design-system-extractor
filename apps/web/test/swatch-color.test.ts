import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Swatch } from '../components/Swatch';
import { nearWhite } from '../lib/palette';

// A pattern row writes the site's own colors, in any CSS form (the portfolio's rgb(12 10 9 / 85%) failed the page).

describe('the swatch reads any CSS color', () => {
  it('finds near white in hex, rgb with alpha and named forms, and never throws', () => {
    expect(nearWhite('#FFFFFF')).toBe(true);
    expect(nearWhite('#0B1F3A')).toBe(false);
    expect(nearWhite('rgb(12 10 9 / 85%)')).toBe(false);
    expect(nearWhite('rgba(255, 255, 255, 0.5)')).toBe(true);
    expect(nearWhite('not a color')).toBe(false);
  });
  it('renders a swatch for an rgb value', () => {
    expect(renderToStaticMarkup(createElement(Swatch, { value: 'rgb(12 10 9 / 85%)', size: 'mini', showHex: false }))).toContain('background:rgb(12 10 9 / 85%)');
  });
});
