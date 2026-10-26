import type { Metadata } from 'next';
import { pageMeta } from '../../lib/meta';
import { Prose } from '../../components/Prose';
import { meta, prose } from '../../copy/strings';

export const metadata: Metadata = pageMeta({ title: meta.terms.title, description: meta.terms.description });

export default function Page() {
  return <Prose title={meta.terms.title} paragraphs={prose.terms} />;
}
