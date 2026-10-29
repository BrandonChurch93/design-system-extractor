/** Whether a path is the synthetic missing page `syntheticNotFoundPath` makes (`stages/discover.ts`, D-041). */
export const isSyntheticNotFoundPath = (path: string) => /\/[0-9a-f]{10}-does-not-exist\/?$/.test(path);
