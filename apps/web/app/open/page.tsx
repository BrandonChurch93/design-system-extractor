import type { Metadata } from 'next';
import { SiteNav } from '../../components/SiteNav';
import { OpenView } from '../../components/open/OpenView';
import { meta } from '../../copy/strings';

export const metadata: Metadata = { title: meta.open.title, description: meta.open.description, robots: { index: false, follow: false } };

export default function OpenPage() {
  return (
    <>
      <SiteNav />
      <OpenView />
    </>
  );
}
