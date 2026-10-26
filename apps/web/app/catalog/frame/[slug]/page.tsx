import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogFrame } from '../../../../components/catalog/CatalogView';
import { demoIndex } from '../../../../components/catalog/demo-index';
import { fill } from '@dse/schema/labels';
import { catalog } from '../../../../copy/strings';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return demoIndex.map((d) => ({ slug: d.slug }));
}

export default async function CatalogFramePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ view?: string }> }) {
  const { slug } = await params;
  const { view } = await searchParams;
  const entry = demoIndex.find((d) => d.slug === slug);
  if (!entry) notFound();
  return (
    <main>
      <h1 className="visually-hidden">{entry.name}</h1>
      {/* The catalog page puts each demo under an h2; the frame keeps the same outline. */}
      <h2 className="visually-hidden">{fill(catalog.frameTitle, { name: entry.name })}</h2>
      <CatalogFrame slug={slug} view={view === 'states' ? 'states' : 'phone'} />
    </main>
  );
}
