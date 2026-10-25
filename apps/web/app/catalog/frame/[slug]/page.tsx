import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogFrame } from '../../../../components/catalog/CatalogView';
import { demoIndex } from '../../../../components/catalog/demo-index';

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
      <CatalogFrame slug={slug} view={view === 'states' ? 'states' : 'phone'} />
    </main>
  );
}
