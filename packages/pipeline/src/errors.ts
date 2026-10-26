import type { BlockedDetail, BlockedReason } from '@dse/schema';

/** A run that cannot proceed for a reason the visitor is shown (docs/specs/crawler.md). */
export class BlockedError extends Error {
  constructor(
    readonly reason: BlockedReason,
    readonly detail: BlockedDetail,
    message?: string,
  ) {
    super(message ?? `blocked: ${reason}`);
    this.name = 'BlockedError';
  }
}

/** copy.md, worker-side failure details: the minutes come from the run's own timeout (D-071). */
export const timeoutDetail = (ms: number) => `Timed out after ${Math.round(ms / 60_000)} minutes.`;

export class TimeoutError extends Error {
  constructor(message = timeoutDetail(360_000)) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class CancelledError extends Error {
  constructor() {
    super('cancelled');
    this.name = 'CancelledError';
  }
}

export { ModelAuthError } from './models/client';
