import { customAlphabet } from 'nanoid';
import { z } from 'zod';

/** Lowercase letters and digits (docs/glossary.md). */
export const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

export const RunId = z.string().regex(/^[0-9a-z]{10}$/, 'a run id is 10 lowercase letters and digits');
export type RunId = z.infer<typeof RunId>;

/** Page, component, variant, instance and token ids. */
export const EntityId = z.string().regex(/^[0-9a-z]{8}$/, 'an id is 8 lowercase letters and digits');
export type EntityId = z.infer<typeof EntityId>;

export const VisitorId = z.string().regex(/^[0-9A-Za-z_-]{16}$/);
export type VisitorId = z.infer<typeof VisitorId>;

export const newRunId = customAlphabet(ID_ALPHABET, 10);
export const newId = customAlphabet(ID_ALPHABET, 8);
/** The `dse_v` cookie value: a 16-character nanoid (docs/specs/caps-and-budget.md). */
export const newVisitorId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-', 16);
