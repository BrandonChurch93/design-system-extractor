import { v2 } from '../../copy/strings';
import { Button } from '../Button';
import styles from './v2.module.css';

/** Above the key form on the budget and run-limit states when the flag is on. Flagged. */
export function UpgradePrompt() {
  return (
    <div className={styles.upgrade} data-testid="v2-surface">
      <p className={styles.upgradeBody}>{v2.upgrade.body}</p>
      <Button variant="ghost" href="/#plans">
        {v2.upgrade.action}
      </Button>
    </div>
  );
}
