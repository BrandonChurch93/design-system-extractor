# Quality bar

This is a portfolio piece by a design engineer whose stated specialty is interfaces that look and move like the best products in the world. The bar is set by Apple product pages, Linear, Vercel and Lovable for interface craft, and by the owner's own Generative UI design system (`reference/genui-design-system/README.md`) for rigor of documentation and component completeness. If a screen would look at home in a Bootstrap admin template, it is wrong.

Two halves, weighted equally: the interface, and the extraction. A beautiful app that extracts a rough guess fails. A precise extractor with a plain interface fails.

## Interface

Layout

- Everything sits on a 4 px grid. Paddings, gaps and sizes come from the spacing scale in `docs/design/design-system.md`; no ad hoc values.
- Content edges line up down a column. Cards in a row share a top edge and a bottom edge.
- No orphan grid rows (a row with one card when the grid has three columns) on any showcase or component grid. The grid spec in `docs/design/components.md` says how to avoid them.
- One content width, 1160 px, with 40 px gutters on desktop and 20 px on phones. No horizontal scroll at 390 px.

Type

- The type scale is used exactly. No one-off sizes.
- Sentence case everywhere. Nothing is uppercase.
- Numbers that are counted, measured or identified are mono and tabular. Prose is sans.
- Line lengths of body text stay under 70 characters.

Color

- The chrome is monochrome: warm ink on warm white, nothing else. The extracted palette is the only chroma on the page, so it reads as the subject. If you catch yourself adding a colored badge, stop.
- Every text token passes 4.5:1 on every ground it sits on, 3:1 for text at 24 px or larger. Marks pass 3:1. The tokens file documents each ratio.

Motion

- Nothing appears without a cause. Every element enters by draw, wipe, extend, count, slide or reveal, per `docs/design/motion.md`. Nothing fades in from nowhere.
- Every entrance has a reverse. Exits run before entrances when content is replaced.
- 60 fps on a mid-range laptop. Only transform and opacity animate, except where the grammar names a draw (clip-path or stroke-dashoffset) or a count.
- Zero layout shift: skeletons hold the exact height of what replaces them. CLS is 0 on every page.
- Reduced motion collapses every choreography to a 200 ms opacity change.

States

- Every interactive element has hover, focus-visible (2 px ring, 2 px offset), active and disabled styles. Every card that is a link lifts on hover.
- Every list has a designed empty state. Every async region has a skeleton. Every failure has a designed error state with one next action.
- Nothing is hidden behind hover alone. Anything a tooltip would carry is a Popover that opens on click and focus, and the same information exists elsewhere on the page. Touch devices get everything.

Images and assets

- Screenshots and crops are captured at device pixel ratio 2 and displayed at their CSS size. Nothing is blurry on a retina display.
- Icons are a single stroke family at a single weight (Lucide). No emoji, no mixed icon sets.

Copy

- Follows `docs/design/copy.md`. Numbers first, no scolding, no em dashes, none of the forbidden words.

Performance

- Lighthouse on the home page and a complete run page: performance 90 or higher, accessibility 100, best practices 100, SEO 100.
- The run page with 46 components renders its first content under 1.5 s on a fast connection and does not jank while results stream in.

## Extraction

- A component is captured with every state that can be reached without submitting a form: default, hover, focus, active, and, where instances exist, disabled, error, checked, selected, open, scrolled.
- A component's provenance is complete: the page it was first seen on, every page it appears on with counts, its selector, its bounding box, the viewport it was captured at.
- Variants are grouped correctly: three buttons that differ by color are three variants of one component, not three components. Two components that merely share a tag are not merged.
- Tokens are real: a palette of 31 is 31 perceptually distinct colors with usage counts, not 212 raw values and not 8 guesses.
- Live previews match their crops. A preview that does not match within the threshold is shown as a capture and labeled so.
- Checks are numbers: every pass or fail cites the measured value and what it was measured against.
- The drift report proposes a clean set that never lowers a contrast ratio that passes today.
- The eval thresholds in `docs/evals.md` are met on all five fixture sites. They are the floor, not the target.

## The self-review habit

Before any gate, open the `qa/` screenshots and go through this list for every page the phase touched:

1. Would a design-engineer recruiter stop scrolling here? If the answer is "it looks fine", it is not done.
2. Is there anything that looks generated: a default blue, a 1 px gray border on everything, a gradient wash, a centered hero with three feature columns, a left-border callout?
3. Does the page work at 390 px without anything truncated, overlapped, or requiring horizontal scroll?
4. Are the motion rules visible in a recording of the page loading? Record a short video with Playwright and watch it.
5. Does every number on the page come from data, with no placeholder text left over?
6. Is the extracted palette the only color on the page?
