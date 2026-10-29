'use client';
import { runPage } from '../copy/strings';
import type { GroundTone } from '../lib/ground';
import { ChipGroup } from './ChipGroup';

export type Ground = 'site' | GroundTone;

/** The app's own two grounds, so no color enters the chrome (D-003, D-097). */
export const appGrounds: Record<GroundTone, string> = { light: 'var(--dse-surface)', dark: 'var(--dse-inverse-bg)' };

/** What a preview's region is painted with: the sampled ground for `Site`, else the app's tone (D-109). */
export function paintFor(ground: Ground, site: string | undefined): string | undefined {
  return ground === 'site' ? site : appGrounds[ground];
}

/** `Site` · `Light` · `Dark` (D-094); `sm` on a card, beside the scale caption (D-109). */
export function GroundToggle({ value, onChange, size, className }: { value: Ground; onChange: (g: Ground) => void; size?: 'md' | 'sm'; className?: string }) {
  const R = runPage.preview;
  return <ChipGroup label={R.ground} value={value} onChange={onChange} size={size} className={className} options={(['site', 'light', 'dark'] as const).map((g) => ({ value: g, label: R.grounds[g] }))} />;
}
