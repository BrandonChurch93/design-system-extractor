import type { Metadata } from 'next';
import { byoLimitsFrom } from '@dse/schema';
import { TopNav } from '../../components/TopNav';
import { RecentView } from '../../components/recent/RecentView';
import { meta } from '../../copy/strings';

export const metadata: Metadata = { title: meta.recent.title, description: meta.recent.description, robots: { index: false, follow: false } };

export default function RecentPage() {
  return (
    <>
      <TopNav />
      <RecentView byoPageCap={byoLimitsFrom().pageCap} now={new Date().toISOString()} />
    </>
  );
}
