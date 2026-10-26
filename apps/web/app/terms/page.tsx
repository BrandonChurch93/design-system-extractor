import type { Metadata } from 'next';
import { Prose } from '../../components/Prose';
import { meta, prose } from '../../copy/strings';

export const metadata: Metadata = { title: meta.terms.title, description: meta.terms.description };

export default function Page() {
  return <Prose title={meta.terms.title} paragraphs={prose.terms} />;
}
