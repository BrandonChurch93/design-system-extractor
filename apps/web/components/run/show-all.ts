import { STAGGER_CAP } from '../../lib/motion';

/** Rows the keyframes, patterns and near-duplicates lists show before Show all (D-104, D-113). */
export const FIRST_ROWS = 6;

/** A row revealed by Show all takes its place in staggers of 12, as the ComponentGrid's do. */
export const revealIndex = (index: number) => (index - FIRST_ROWS) % STAGGER_CAP;
