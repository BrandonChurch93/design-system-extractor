import type { Metadata } from 'next';
import { pageMeta } from '../../lib/meta';
import { Prose } from '../../components/Prose';
import { meta, prose } from '../../copy/strings';

export const metadata: Metadata = pageMeta({ title: meta.privacy.title, description: meta.privacy.description });

export default function Page() {
  return <Prose title={meta.privacy.title} paragraphs={prose.privacy} />;
}
