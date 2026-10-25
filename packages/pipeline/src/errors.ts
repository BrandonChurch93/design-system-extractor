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

export class TimeoutError extends Error {
  constructor(message = 'Timed out after 6 minutes.') {
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
