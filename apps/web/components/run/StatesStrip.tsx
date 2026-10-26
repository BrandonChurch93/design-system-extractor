'use client';
import type { StateCapture, State } from '@dse/schema';
import { stateLabels } from '@dse/schema/labels';
import { fileUrl } from '../../lib/doc';
import { Popover } from '../Popover';
import styles from './StatesStrip.module.css';

const order = Object.keys(stateLabels) as State[];

/** The states a component has: a filled dot when captured, an outlined one when not. */
export function StatesStrip({ states, base, name }: { states: StateCapture[]; base?: string; name: string }) {
  const list = [...states].sort((a, b) => order.indexOf(a.state) - order.indexOf(b.state));
  return (
    <ul className={styles.strip}>
      {list.map((s) => (
        <li key={s.state}>
          <Popover
            label={`${name} · ${stateLabels[s.state]}`}
            width={320}
            trigger={(t) => (
              <button type="button" className={styles.state} data-captured={s.captured} {...t}>
                <span className={styles.dot} aria-hidden="true" />
                <span>{stateLabels[s.state]}</span>
              </button>
            )}
          >
            <p className={styles.title}>{stateLabels[s.state]}</p>
            {s.captured && s.cropKey && base ? (
              // eslint-disable-next-line @next/next/no-img-element -- storage-origin crop at its CSS size
              <img className={styles.crop} src={fileUrl(base, s.cropKey)} srcSet={`${fileUrl(base, s.cropKey)} 2x`} alt={`${name} · ${stateLabels[s.state]}`} />
            ) : null}
            {s.delta.length ? (
              <ul className={styles.delta}>
                {s.delta.slice(0, 6).map((d) => (
                  <li key={d.property}>{`${d.property} ${d.from} → ${d.to}`}</li>
                ))}
              </ul>
            ) : null}
            {!s.captured && s.reason ? <p className={styles.reason}>{s.reason}</p> : null}
          </Popover>
        </li>
      ))}
    </ul>
  );
}
