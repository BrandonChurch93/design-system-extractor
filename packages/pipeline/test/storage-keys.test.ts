import { describe, expect, it } from 'vitest';
import { contentTypeFor, isIntermediateKey, keys, testS3Config } from '../src/storage';

describe('storage keys', () => {
  it('builds every path in data-model.md', () => {
    expect(keys.pageScreenshot('abc123def4', 'pg000001', 'desktop')).toBe('runs/abc123def4/pages/pg000001/desktop.png');
    expect(keys.pageSnapshot('abc123def4', 'pg000001', 'mobile')).toBe('runs/abc123def4/pages/pg000001/mobile.snapshot.json.gz');
    expect(keys.pageCss('abc123def4', 'pg000001', 'mobile')).toBe('runs/abc123def4/pages/pg000001/mobile.css.json.gz');
    expect(keys.componentCrop('abc123def4', 'cm000001', 'hover')).toBe('runs/abc123def4/components/cm000001/hover.png');
    expect(keys.componentSource('abc123def4', 'cm000001', 'desktop')).toBe('runs/abc123def4/components/cm000001/source-desktop.png');
    expect(keys.componentPreview('abc123def4', 'cm000001')).toBe('runs/abc123def4/components/cm000001/preview.html');
    expect(keys.componentStatePreview('abc123def4', 'cm000001', 'focus')).toBe('runs/abc123def4/components/cm000001/preview-focus.html');
    expect(keys.variantPreview('abc123def4', 'cm000001', 'va000001')).toBe('runs/abc123def4/components/cm000001/variants/va000001/preview.html');
    expect(keys.variantStatePreview('abc123def4', 'cm000001', 'va000001', 'hover')).toBe('runs/abc123def4/components/cm000001/variants/va000001/preview-hover.html');
    expect(keys.og('abc123def4')).toBe('runs/abc123def4/og.png');
    expect(keys.showcase()).toBe('showcase/showcase.json');
  });

  it('marks only the snapshot and matched-CSS files as intermediate', () => {
    expect(isIntermediateKey(keys.pageSnapshot('abc123def4', 'pg000001', 'desktop'))).toBe(true);
    expect(isIntermediateKey(keys.pageCss('abc123def4', 'pg000001', 'desktop'))).toBe(true);
    expect(isIntermediateKey(keys.pageScreenshot('abc123def4', 'pg000001', 'desktop'))).toBe(false);
  });

  it('assigns content types and refuses unknown extensions', () => {
    expect(contentTypeFor('a/preview.html')).toBe('text/html; charset=utf-8');
    expect(contentTypeFor('a/b.png')).toBe('image/png');
    expect(contentTypeFor('a/b.snapshot.json.gz')).toBe('application/gzip');
    expect(contentTypeFor('showcase/showcase.json')).toBe('application/json');
    expect(() => contentTypeFor('a/b.exe')).toThrow();
  });

  it('points the test config at the test bucket', () => {
    const c = testS3Config({
      STORAGE_ENDPOINT: 'http://localhost:9000',
      STORAGE_REGION: 'us-east-1',
      STORAGE_BUCKET: 'dse',
      STORAGE_ACCESS_KEY: 'k',
      STORAGE_SECRET_KEY: 's',
      STORAGE_PUBLIC_BASE_URL: 'http://localhost:9000/dse',
    });
    expect(c.bucket).toBe('dse-test');
    expect(c.publicBaseUrl).toBe('http://localhost:9000/dse-test');
  });
});
