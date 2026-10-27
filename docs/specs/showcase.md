# Showcase

The home page feed is the owner's runs (D-006). It is seeded by a script and stored as showcase content that the home page reads. Visitors' runs never appear here.

## Roster

Twelve sites, chosen for a mix of clean systems, dense ones where the drift report shines, and the owner's own work, with every category chip represented. Categories are the home page chips.

| Order | Site | Category | Why |
| --- | --- | --- | --- |
| 1 | brandonchurchportfolio.com | Personal | the owner's portfolio |
| 2 | generative-ui-github.vercel.app | Developer tools | the owner's previous project |
| 3 | stripe.com | Finance | a famously tight system, payments |
| 4 | linear.app | Developer tools | restraint |
| 5 | vercel.com | Developer tools | Geist in the wild |
| 6 | notion.com | SaaS | a large product marketing site |
| 7 | apple.com | Commerce | large, polished, many states |
| 8 | wikipedia.org | Media | dense, old, plenty of drift |
| 9 | usa.gov | Government | USWDS, the government lane |
| 10 | homedepot.com | Commerce | big-box retail, enormous system |
| 11 | modernsoftworks.com | Personal | the owner's studio |
| 12 | amazon.com | Commerce | the biggest drift report possible |

Alternates, used in order when a roster site blocks the crawler or returns a sparse run, each with its category so the chip set stays complete: github.com (Developer tools), figma.com (SaaS), shopify.com (SaaS), airbnb.com (Commerce), nytimes.com (Media), craigslist.org (Media), gov.uk (Government), idaho.gov (Government), etsy.com (Commerce), bestbuy.com (Commerce), tailwindcss.com (Developer tools), mozilla.org (Media), coinbase.com (Finance), wise.com (Finance). An alternate is chosen from the same category as the site it replaces when one is available.

The showcase count stays a multiple of six so the 3- and 2-column grids never orphan. A category whose cards all fail is simply absent from the chips (the CategoryFilter renders only categories with cards).

## The content

```
{ "generatedAt": "...", "appUrl": "...", "entries": [ { "runId", "url", "host", "name", "category", "order", "stats", "palette": [ { "value", "share" } ] } ] }
```

`url` is the run's share link at generation time; `name` is the display name ("Brandon Church Portfolio", "Generative UI · GitHub", "Stripe"); `palette` is the top 8 colors by usage with their share for the PaletteStrip.

Where it lives: the committed file `apps/web/content/showcase.json` is the seed and the fallback. In production the current content is the storage object `showcase/showcase.json`, written by `POST /api/admin/showcase/content`; the home page is a dynamic route that reads the storage object with a one-hour revalidation (`revalidate: 3600` on that fetch) and falls back to the committed file when it is absent. Vercel functions cannot write to the repository, which is why the content lives in storage. Locally, the committed file is what the home page reads.

Runs listed here have `is_showcase = true` and null retention.

## The script

`pnpm showcase [--remote] [--only host] [--alternates] [--refresh-links] [--dry-run]` (D-063):

1. Reads the roster and alternates from `scripts/showcase/roster.ts` (the tables above).
2. For each site, creates a run: locally through the queue (same path as a visitor, with priority 10 and the showcase budget bypass); with `--remote`, through `POST /api/admin/showcase/run` on production with the admin token, which does the same there. Showcase runs do not count against the public budget; their cost is the run's own cost record, printed in the script's table.
3. Waits for completion, polling the document.
4. Blocked, failed or sparse sites are replaced from the alternates list (same category first), logged; the listed entries are the largest multiple of six, earliest in roster order.
5. Writes `apps/web/content/showcase.json`; with `--remote`, also uploads it through `POST /api/admin/showcase/content`. Listing follows the content: the content route (and, locally, the same database function) sets `is_showcase` and null retention on the listed runs and unsets them on runs no longer listed, refusing content that names a run that is not complete.
6. Prints a table of hosts, stats and cost.

`--refresh-links` rewrites every entry's `url` and `appUrl` from `NEXT_PUBLIC_APP_URL` without running anything (used after a domain change). `--only host` runs one site (a roster host, or an alternate already listed) and replaces its entry. `--alternates` prints the alternate table. `--dry-run` runs the sites and prints the table without writing content or listing anything; the table is also written to `.dse/showcase-report.md`.

## Local seed during the build

`pnpm db:seed:fixtures` (built in P10) runs the six fixture sites (the five eval fixtures plus `messy-after`, see `docs/evals.md`) through the local queue and writes a local `showcase.json` with six entries, so the home page is never empty in development, QA screenshots or goldens, and the 3- and 2-column grids have no orphan. The real roster is run once locally in P13 as a dry run (`pnpm showcase --dry-run`), within the dev spend cap minus the reserve (skip sites that block, stop when the meter says so), to check the pipeline on real sites. The production showcase is generated by the owner in the runbook.

## Removal

`POST /api/admin/runs/{id}/unpublish` sets `is_showcase = false` and restores a 90-day retention; the script's next run drops it from the content. The About page's removal sentence points at `DSE_CONTACT_EMAIL` (D-013).
