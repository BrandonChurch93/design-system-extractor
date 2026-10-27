import { readFileSync } from 'node:fs';
import type { ShowcaseCategory } from '@dse/schema';

// The roster and alternates of docs/specs/showcase.md, in order. scripts/test/showcase.test.ts
// reads the two tables in that document and holds this file to them.

export type Site = { url: string; host: string; name: string; category: ShowcaseCategory };
export type RosterSite = Site & { order: number; why: string };

const site = (host: string, name: string, category: ShowcaseCategory): Site => ({ url: `https://${host}/`, host, name, category });

// Test seam: the integration test runs the script on fixture sites (scripts/test/showcase.int.test.ts).
const override = process.env.DSE_SHOWCASE_ROSTER ? (JSON.parse(readFileSync(process.env.DSE_SHOWCASE_ROSTER, 'utf8')) as { roster: RosterSite[]; alternates: Site[] }) : null;

export const roster: RosterSite[] = override?.roster ?? [
  { ...site('brandonchurchportfolio.com', 'Brandon Church Portfolio', 'Personal'), order: 1, why: "the owner's portfolio" },
  { ...site('generative-ui-github.vercel.app', 'Generative UI · GitHub', 'Developer tools'), order: 2, why: "the owner's previous project" },
  { ...site('stripe.com', 'Stripe', 'Finance'), order: 3, why: 'a famously tight system, payments' },
  { ...site('linear.app', 'Linear', 'Developer tools'), order: 4, why: 'restraint' },
  { ...site('vercel.com', 'Vercel', 'Developer tools'), order: 5, why: 'Geist in the wild' },
  { ...site('notion.com', 'Notion', 'SaaS'), order: 6, why: 'a large product marketing site' },
  { ...site('apple.com', 'Apple', 'Commerce'), order: 7, why: 'large, polished, many states' },
  { ...site('wikipedia.org', 'Wikipedia', 'Media'), order: 8, why: 'dense, old, plenty of drift' },
  { ...site('usa.gov', 'USA.gov', 'Government'), order: 9, why: 'USWDS, the government lane' },
  { ...site('homedepot.com', 'The Home Depot', 'Commerce'), order: 10, why: 'big-box retail, enormous system' },
  { ...site('modernsoftworks.com', 'Modern Softworks', 'Personal'), order: 11, why: "the owner's studio" },
  { ...site('amazon.com', 'Amazon', 'Commerce'), order: 12, why: 'the biggest drift report possible' },
];

export const alternates: Site[] = override?.alternates ?? [
  site('github.com', 'GitHub', 'Developer tools'),
  site('figma.com', 'Figma', 'SaaS'),
  site('shopify.com', 'Shopify', 'SaaS'),
  site('airbnb.com', 'Airbnb', 'Commerce'),
  site('nytimes.com', 'The New York Times', 'Media'),
  site('craigslist.org', 'Craigslist', 'Media'),
  site('gov.uk', 'GOV.UK', 'Government'),
  site('idaho.gov', 'Idaho.gov', 'Government'),
  site('etsy.com', 'Etsy', 'Commerce'),
  site('bestbuy.com', 'Best Buy', 'Commerce'),
  site('tailwindcss.com', 'Tailwind CSS', 'Developer tools'),
  site('mozilla.org', 'Mozilla', 'Media'),
  site('coinbase.com', 'Coinbase', 'Finance'),
  site('wise.com', 'Wise', 'Finance'),
];
