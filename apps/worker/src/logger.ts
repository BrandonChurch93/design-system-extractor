import { pino, type DestinationStream, type Logger } from 'pino';

// Structured JSON lines (docs/specs/architecture.md, Conventions). A visitor's key never reaches a
// log: it is never passed to one, and these paths are censored in case a future call does.
export const REDACT_PATHS = ['byoKey', '*.byoKey', 'apiKey', '*.apiKey', 'byoKeyCiphertext', '*.byoKeyCiphertext', 'headers["x-byo-key"]', '*.headers["x-byo-key"]', 'job.data'];

export function createLogger(destination?: DestinationStream): Logger {
  return pino({ level: process.env.LOG_LEVEL ?? 'info', base: { service: 'worker' }, redact: { paths: REDACT_PATHS, censor: '[redacted]' } }, destination);
}
