import { deleteRun, expiredRunIds, type Db } from '@dse/pipeline/db';
import type { Storage } from '@dse/pipeline/storage';
import type { Logger } from 'pino';

export const RETENTION_PATTERN = '0 3 * * *';

/** Deletes runs past their retention, their rows and their files (docs/specs/data-model.md, Retention). */
export async function runRetention(db: Db, storage: Storage, log: Logger, now: Date = new Date()): Promise<number> {
  const ids = await expiredRunIds(db, now);
  for (const id of ids) {
    const files = await storage.deletePrefix(`runs/${id}/`);
    await deleteRun(db, id);
    log.info({ runId: id, files }, 'retention · run deleted');
  }
  return ids.length;
}
