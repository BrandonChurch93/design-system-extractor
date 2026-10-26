import type { Metadata } from 'next';
import { pageMeta } from '../../lib/meta';
import { byoLimitsFrom } from '@dse/schema';
import { SiteNav } from '../../components/SiteNav';
import { RecentView } from '../../components/recent/RecentView';
import { meta } from '../../copy/strings';

export const metadata: Metadata = pageMeta({ title: meta.recent.title, description: meta.recent.description, index: false });

export default function RecentPage() {
  return (
    <>
      <SiteNav />
      <RecentView byoPageCap={byoLimitsFrom().pageCap} />
    </>
  );
}
