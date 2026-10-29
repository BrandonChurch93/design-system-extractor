# Design system · Studio

The app's own design system. Direction A from the derby (D-002), a sibling of the owner's Generative UI system: the same hand (warm ink on warm white, sentence case, mono for everything counted, nothing appears without a cause), a different skin, and one rule that system does not have: **no chroma in the chrome** (D-003). The extracted palette is the only color on any page.

This document is the spec. `reference/direction-a.html` shows the skin; where they differ, this document wins. The tokens below are implemented once, in `apps/web/styles/tokens.css` as CSS custom properties prefixed `--dse-`, and consumed everywhere. No component defines its own color, size, radius or shadow value. Naming: colors, spacing, radius and shadow use the token name (`--dse-ink`, `--dse-space-5`); each type style is five properties (`--dse-type-{style}-size`, `-line`, `-weight`, `-tracking`, `-family`) plus `-size-phone` where a phone value is named; motion uses `--dse-motion-{name}`, `--dse-ease-{name}`, `--dse-stagger` and `--dse-stagger-cap`. `apps/web/test/tokens.test.ts` diffs this document against the file in both directions.

## Color

Light only (D-004). Every value is final; every text token has been checked against every ground it may sit on. Ratios are WCAG 2.2 contrast.

| Token | Value | Use | Contrast |
| --- | --- | --- | --- |
| `bg` | `#FCFAF8` | Page ground. Warm white, never pure white, so cards read as lifted. | |
| `surface` | `#FFFFFF` | Cards, panels, inputs, chips at rest. | |
| `surface-tint` | `#FCF5F3` | Preview grounds inside component cards, selected chip ground, hovered row ground, skeleton blocks on `surface`. | |
| `ink` | `#23201E` | Primary text, icons, the primary button ground, the drift headline ground. | 16.19:1 on surface · 15.55:1 on bg · 15.03:1 on surface-tint |
| `ink-2` | `#3E3936` | Secondary text: nav links, hex values, table body, tag text. | 11.39:1 on surface · 10.94:1 on bg · 10.58:1 on surface-tint |
| `muted` | `#6A635E` | Labels, meta, captions, placeholder-like hints. The floor for any text. | 5.90:1 on surface · 5.67:1 on bg · 5.48:1 on surface-tint |
| `line` | `#23201E1A` (10%) | Hairlines that draw in: row underlines, chip borders, table rules, the sticky nav rule. | |
| `line-soft` | `#23201E0F` (6%) | Card borders, dividers inside cards. | |
| `line-strong` | `#23201E38` (22%) | Input and chip hover borders. An affordance, not identity. | |
| `focus` | `#35302C` | The keyboard focus ring: 2 px solid, 2 px offset, on every interactive element. | 13.04:1 on surface · 12.52:1 on bg · 12.10:1 on surface-tint |
| `focus-inverse` | `#FCFAF8` | The focus ring on `inverse-bg` grounds (the inverse button, the live log, toasts), where `focus` would read 1.24:1. | 15.55:1 on inverse-bg |
| `inverse-bg` | `#23201E` | Same value as `ink`, named for grounds: the primary button, the drift headline card, the live log. | |
| `inverse-ink` | `#FCFAF8` | Text on `inverse-bg`. | 15.55:1 on inverse-bg |
| `inverse-muted` | `#B9B1AB` | Secondary text on `inverse-bg`. | 7.66:1 on inverse-bg |
| `inverse-line` | `#FCFAF826` (15%) | Rules on `inverse-bg`. | |
| `skeleton` | `#EFEBE7` | Skeleton blocks on `bg`. On `surface` use `surface-tint`. | |
| `scrim` | `#23201E14` (8%) | The ground behind the component panel on phones. Never blurs. | |

Contrast values are WCAG 2.x ratios computed from the hex values above (relative luminance, sRGB). The P2 test recomputes every listed pair and asserts two things: the ratio meets its WCAG threshold (4.5:1 for text, 3:1 for the focus ring), and the printed value is within 0.05 of the computed one.

There is no accent token. There is no success, warning or danger token. Pass and fail are drawn with icon shape (check, cross) and words. Severity in the drift report is carried by numbers and position, never by color.

The one tinted value in the system is the card shadow (below), which carries a trace of warmth at 7% alpha at rest and 12% on hover. It is not a color anyone can name and it never appears on a surface.

**Extracted color on the page.** Swatches, palette strips, live previews and captured crops carry the subject site's colors. They are the only chroma. Rules for presenting them:

- A swatch is the raw value, never adjusted. A swatch lighter than `surface` (near-white extracted colors) gets a 1 px `line-soft` inner border so it has an edge.
- Hex values beside swatches are `ink-2` mono, uppercase hex with the hash: `#2458E6`.
- Never place app text on top of an extracted color. Labels sit beside or below swatches, on `surface` or `bg`.

## Type

Two families, self-hosted through `next/font/google` so they load with the page and never flash.

- `sans`: Plus Jakarta Sans 400, 500, 600, 700. Everything read.
- `mono`: JetBrains Mono 400, 500. Everything counted, measured, identified or quoted: hex values, selectors, counts in tables, timestamps, code, the live log. Numbers inside prose stay sans with `font-variant-numeric: tabular-nums`.

| Style | Family | Size / line | Weight | Tracking | Use |
| --- | --- | --- | --- | --- | --- |
| `headline` | sans | 56 / 1.05 | 700 | -0.025em | The home page headline only. Fluid to 36 at phone. |
| `title` | sans | 44 / 1.05 | 700 | -0.025em | Run title, page titles. Fluid to 32 at phone. |
| `title-sm` | sans | 30 / 1.1 | 700 | -0.02em | StateCard titles, the compare title. 26 at phone. |
| `h2` | sans | 24 / 1.2 | 700 | -0.015em | Section headings on a run page. |
| `h2-sm` | sans | 20 / 1.25 | 600 | -0.01em | Section headings on compare, how it works, and the prose pages. |
| `h3` | sans | 16 / 1.3 | 600 | 0 | Card headings, panel section headings. |
| `stat` | sans | 34 / 1 | 700 | -0.02em | Numbers in the stat strip. Tabular. 28 at phone. |
| `drift` | sans | 24 / 1.25 | 600 | -0.015em | The drift headline sentence. 20 at phone. |
| `drift-sub` | sans | 18 / 1.3 | 500 | 0 | The words between numbers in DriftNumbers, in `muted`. |
| `body` | sans | 15 / 1.5 | 400 | 0 | Running text, descriptions. |
| `body-sm` | sans | 14 / 1.45 | 400 | 0 | Table body, card descriptions, nav links (500). |
| `label` | sans | 13 / 1.3 | 500 | 0 | Field labels, section labels like "Palette", in `muted`. Sentence case. Never uppercase. |
| `caption` | sans | 12.5 / 1.4 | 400 | 0 | Meta lines under cards, footers, hints. |
| `meta` | mono | 12.5 / 1.4 | 400 | 0.01em | Counts, timestamps, run ids, `12 pages · 2 viewports`. |
| `hex` | mono | 11.5 / 1.3 | 400 | 0.02em | Hex values, token names under swatches. |
| `tag` | mono | 11 / 1.3 | 400 | 0 | Token chips, category tags. |
| `code` | mono | 12.5 / 1.6 | 400 | 0 | Code blocks, the live log, the MCP install line. Ligatures off. |
| `button` | sans | 14 / 1 | 600 | 0 | All buttons. 15 for the `xl` Extract button. |

Rules: sentence case everywhere; no uppercase anywhere, including labels and tags. Prose (body and body-sm paragraphs) sits on a measure of at most 600 px, which keeps lines under about 70 characters; containers may be wider than the measure. Headings never wrap more than two lines at desktop. These are the only sizes in the app; a size not in this table is a defect. Phone values named in the Use column are the only fluid exceptions. Weight is fixed per style with three named exceptions that `docs/design/components.md` uses: the wordmark is `h3` at 700, Pill and CheckBadge text is `caption` at 600, and StageRail labels for done and running stages are `label` at 600.

## Spacing

A 4 px base. Only these values appear in layout.

| Token | Value | Use |
| --- | --- | --- |
| `space-1` | 4 | Label to value. |
| `space-2` | 8 | Between chips, tags, buttons in a row, dots in a states strip. |
| `space-3` | 12 | Inside a card between related rows; between a swatch and its label block. |
| `space-4` | 16 | Card padding at compact density (phone); gap inside a panel section. |
| `space-5` | 20 | Card padding at desktop; grid gap between component cards. |
| `space-6` | 28 | Gap between sections inside the run header block. |
| `space-7` | 40 | Page side gutter at desktop; gap between regions on a page. |
| `space-8` | 64 | Gap between major run page sections (Tokens to Components). |
| `space-9` | 96 | Top padding above the home headline block. |

A gap derived from a measurement (the shadow list) rounds up to the next token on this scale (D-103).

Content width is 1160 px, centered. Gutters: 40 px at desktop and tablet, 20 px at phone.

## Radius

| Token | Value | Use |
| --- | --- | --- |
| `radius-xs` | 2 | Hairline details: the tab indicator, capture and source outlines, spacing bars, a link's focus corners (D-077). |
| `radius-sm` | 8 | Small swatches, code blocks, skeleton blocks, the live log. |
| `radius-md` | 14 | Buttons, inputs, large swatches. |
| `radius-lg` | 18 | Cards, panels, the drift headline card, the stat strip. The signature curve. |
| `radius-pill` | 999 | Chips, tags, the section nav items. |

## Shadow

| Token | Value | Use |
| --- | --- | --- |
| `shadow-card` | `0 12px 40px rgba(226, 96, 98, 0.07), 0 1px 3px rgba(35, 32, 30, 0.05)` | Every card at rest. Warm, low, wide. |
| `shadow-card-hover` | `0 16px 44px rgba(226, 96, 98, 0.12), 0 1px 3px rgba(35, 32, 30, 0.05)` | A card that is a link, on hover. |
| `shadow-swatch` | `0 6px 18px rgba(35, 32, 30, 0.08)` | Large palette swatches. |
| `shadow-panel` | `-24px 0 48px rgba(35, 32, 30, 0.08)` | The component side panel. |
| `shadow-sheet` | `0 -16px 48px rgba(35, 32, 30, 0.10)` | The component sheet on phones. |

Cards also carry a 1 px `line-soft` border so they hold an edge on `bg`.

## Breakpoints

| Name | Range | What changes |
| --- | --- | --- |
| `phone` | 0 to 640 | Single column everywhere. Gutter 20. Nav links collapse into a menu button. Component panel becomes a bottom sheet. Stat strip is a 2-column grid. Palette shows 4 swatches per row. Section nav scrolls horizontally. Compare shows its desktop-only notice. |
| `tablet` | 641 to 1023 | Two-column grids. Gutter 40. Panel is 480 wide. |
| `desktop` | 1024 and up | Three-column grids. Panel is 560 wide. Everything in `docs/design/pages.md` at its full layout. |

Implementation: CSS Modules with `@media (max-width: 640px)` and `@media (max-width: 1023px)`. JavaScript reads the phone breakpoint only through `useMedia` (`apps/web/lib/use-media.ts`, which follows `matchMedia` changes), for what CSS cannot switch: the panel versus the sheet, a Popover that becomes a Sheet on phones, and the CaptureViewer's layout (D-076).

QA viewports, used by every screenshot gate: 1440 × 900 (desktop), 820 × 1180 (tablet), 390 × 844 (phone). The tablet viewport exists so the two-column layouts are seen.

## Icons

Lucide, stroke 1.75, 16 px inside buttons and badges, 20 px standalone, `ink` or `inverse-ink` only. Every icon-only button has an `aria-label`. Decorative icons have `aria-hidden="true"`. No emoji anywhere.

## Density

One density. Cards use `space-5` padding at desktop and tablet, `space-4` at phone. There is no density switch.

## Focus and hover

- Focus: 2 px solid `focus` ring at 2 px offset, on every interactive element, via `:focus-visible`. Never removed, never replaced by a color change alone. Inside an `inverse-bg` ground the ring is `focus-inverse` (D-036).
- Hover on a card that is a link: `shadow-card-hover`, border stays, translateY(-1px) over `motion-fast`.
- Hover on a row that leads somewhere (the recent runs list): ground becomes `surface-tint` inset by `space-2` with `radius-sm`; the hairline below hides. Table rows are read, not clicked, and do not change (D-079).
- Hover on a chip: border becomes `line-strong`. Selected chip: `ink` ground, `inverse-ink` text.
- Hover on a primary button: ground stays `ink`, the label shifts to 90% opacity over `motion-fast`. On a ghost button: border becomes `line-strong`.

## The catalog

`/catalog` renders every component in `docs/design/components.md` in every state at desktop and phone widths, from sample data, with its token usage listed beside it. It is `noindex` and linked only from the footer's "Built with" line. It is built in P2, before any page, and every later phase keeps it current. It is also the surface the design QA screenshots capture.
