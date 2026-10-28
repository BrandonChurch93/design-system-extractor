'use client';
import { Play } from 'lucide-react';
import type { State } from '@dse/schema';
import { stateLabels } from '@dse/schema/labels';
import { runPage } from '../copy/strings';
import { Button } from './Button';
import { ChipGroup } from './ChipGroup';
import styles from './StateBar.module.css';

/**
 * The states a preview can be pinned to (docs/design/components.md, StateBar; D-094): one Chip per
 * captured state, Default first, and `Play` when the component has recorded transitions. Choosing
 * the selected state again replays it.
 */
export function StateBar({ states, value, onChange, onPlay, playing, forceState }: { states: State[]; value: State; onChange: (s: State) => void; onPlay?: () => void; playing?: boolean; /** Catalog only. */ forceState?: { value: State; state: 'hover' | 'focus' } }) {
  return (
    <div className={styles.bar}>
      <ChipGroup label={runPage.preview.states} value={value} onChange={onChange} options={states.map((s) => ({ value: s, label: stateLabels[s] }))} className={styles.chips} forceState={forceState} />
      {onPlay ? (
        <Button variant="ghost" size="sm" icon={Play} onClick={onPlay} disabled={playing}>
          {runPage.preview.play}
        </Button>
      ) : null}
    </div>
  );
}
