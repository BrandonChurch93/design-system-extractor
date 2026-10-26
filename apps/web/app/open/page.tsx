import type { Metadata } from 'next';
import { pageMeta } from '../../lib/meta';
import { SiteNav } from '../../components/SiteNav';
import { OpenView } from '../../components/open/OpenView';
import { meta } from '../../copy/strings';

export const metadata: Metadata = pageMeta({ title: meta.open.title, description: meta.open.description, index: false });

export default function OpenPage() {
  return (
    <>
      <SiteNav />
      <OpenView />
    </>
  );
}
