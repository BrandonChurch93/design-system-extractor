import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Plus Jakarta Sans in WOFF for the image renderer, which cannot read WOFF2 (D-057). */
export async function ogFonts() {
  const read = async (file: string): Promise<ArrayBuffer> => {
    for (const base of [process.cwd(), join(process.cwd(), 'apps/web')]) {
      try {
        const b = await readFile(join(/* turbopackIgnore: true */ base, 'assets/og', file));
        return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
      } catch {
        // try the next base
      }
    }
    throw new Error(`OG font ${file} not found`);
  };
  return [
    { name: 'Plus Jakarta Sans', data: await read('plus-jakarta-sans-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
    { name: 'Plus Jakarta Sans', data: await read('plus-jakarta-sans-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
  ];
}
