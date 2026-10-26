import type { Metadata } from 'next';
import { Prose } from '../../components/Prose';
import { meta, prose } from '../../copy/strings';

export const metadata: Metadata = { title: meta.about.title, description: meta.about.description };

export default function Page() {
  return <Prose title={meta.about.title} paragraphs={prose.about} />;
}
