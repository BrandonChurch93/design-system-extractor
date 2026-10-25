# Motion grammar

Nothing appears without a cause. Every element enters by one of six moves, and every entrance has an exact reverse. The in-progress run page is where this grammar does its real work: results arrive stage by stage, and the page should feel like an instrument filling in, not a spinner replaced by a wall.

Motion (the Framer library) owns presence and layout: mounting, unmounting, reflow when siblings change. GSAP owns what happens inside an element: the draw, the count, the extend. Neither touches the other's element. This split is settled; do not revisit.

## Timings and easing

| Token | Value | Use |
| --- | --- | --- |
| `motion-fast` | 160 ms | Hover, focus, chip select, opacity shifts. |
| `motion-base` | 260 ms | Card lift, row ground, tab underline, panel content. |
| `motion-slow` | 420 ms | Panel slide, sheet rise, section reveal. |
| `motion-stage` | 600 ms | A stage landing on the in-progress page: the whole region's choreography budget. |
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Entrances and state changes. |
| `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Exits. |
| `stagger` | 30 ms per item, cap 12 items | Lists, grids, swatch rows. Items past the cap enter together. |

## The six moves

| Move | What it is | Where |
| --- | --- | --- |
| **Draw** | A hairline draws from left to right (`clip-path: inset(0 100% 0 0)` to `inset(0)`), or an SVG stroke draws (`stroke-dashoffset`). | Rules under rows, the sticky nav rule, table rules, the stage rail connector, check icons (the check mark strokes in). Focus rings never animate; they appear instantly. |
| **Wipe** | Text is revealed left to right behind a clip, no vertical movement. | Headings, the drift headline sentence, the run title when a run completes, stat labels. |
| **Extend** | A bar or block grows from its leading edge (`scaleX` from 0, transform-origin left, or width for swatches). | Spacing bars, the budget meter, palette swatches (each extends from the left, staggered), the preview ground of a component card, the stat strip's cells (each extends from left, staggered). |
| **Count** | A number ticks from 0 to its value, tabular, over `motion-stage` with ease-standard. | Stat strip numbers, check totals, drift numbers (14 → 5 counts both). |
| **Slide** | An element moves in from an edge with a short travel (16 px) plus opacity. | The component panel from the right, the sheet from the bottom, toasts from the bottom right, the live log expanding. |
| **Reveal** | A card's content appears after its frame: the frame extends, then the content wipes in. | Component cards, showcase cards, export cards. |

Nothing fades in from nowhere. Opacity may accompany a move; it is never the move.

## Reverses

| Move | Reverse |
| --- | --- |
| Draw | Undraws right to left. |
| Wipe | Unwipes right to left. |
| Extend | Shrinks back to its leading edge. |
| Count | Does not reverse; the element wipes out. |
| Slide | Slides back out the edge it came from, `ease-exit`. |
| Reveal | Content unwipes, then the frame shrinks. |

When content is replaced (a filter changes the component grid, a compare toggle switches mode), exits run first, top to bottom, `motion-base` with `ease-exit`, then entrances top to bottom. Items that survive the change morph in place with Motion `layout` and never exit.

## The in-progress run page

The stage rail at the top is the conductor (the stage-to-ring-to-region mapping is in `docs/design/pages.md`). When a stage lands:

1. Its ring fills (`scale` 0.6 to 1, `motion-fast`) and the connector to it finishes drawing.
2. Its region on the page replaces its skeleton. The skeleton blocks shrink (extend reverse, `motion-fast`), then the real content performs its entrance within `motion-stage`: palette swatches extend in a stagger; type rows wipe; spacing bars extend; component cards reveal in a stagger; the checks table rows draw their rules then wipe their text; drift numbers count.
3. The live log appends its line with a wipe. The log autoscrolls only if the reader was already at the bottom.

The skeleton for each region has the exact final height of a typical result, so nothing below it moves when the region fills. Regions whose real height differs animate height with Motion `layout`, `motion-base`.

Polling (D-014) delivers partial documents. The page diffs the previous document against the new one and animates only what is new. Nothing re-animates on a poll that brought no change.

## Page transitions

The run page is one route; the panel is a parallel route. Opening a component: the grid stays, the panel slides in, the card that was clicked gets a 2 px `focus`-colored ring that fades over `motion-slow` so the eye can connect card to panel. Closing: the panel slides out, focus returns to the card. On phones the panel is a sheet rising from the bottom to 92% height with the `scrim` behind it; the scrim never blurs.

Navigating between runs: the new page's header wipes in; sections below reveal as they enter the viewport (an IntersectionObserver with a 10% threshold, each section once).

## Hover and press

- Card lift: `translateY(-1px)` plus `shadow-card-hover`, `motion-fast`.
- Button press: `scale(0.985)` over 80 ms, back over `motion-fast`.
- Chip select: ground and text swap over `motion-fast`; the chip does not move.
- Row hover: the tint ground extends from the left over `motion-fast`; the hairline below hides.

## Reduced motion

`prefers-reduced-motion: reduce` collapses every move to a 200 ms opacity change, stops the count (numbers appear at their value), stops the stagger, and keeps layout animations instant. The in-progress page still fills stage by stage; it just does not perform. Implementation (D-039): an element that moves on first paint carries `data-move`, and a reduced-motion stylesheet rule removes its transform and clip and fades it in over 200 ms, because its variants are rendered on the server before the preference is known; elements that mount later (a toast, a sheet, a menu, a poll's new content) read the preference in JavaScript and use opacity-only variants.

## Performance rules

- Animate only `transform`, `opacity`, `clip-path`, and `stroke-dashoffset`. `height` is animated only through Motion `layout` on regions, never on list items.
- `will-change` is set by Motion and GSAP, never by hand.
- No animation runs on an element that is off screen.
- The page must hold 60 fps on a mid-range laptop with 46 component cards revealing. Measure in P11 with the Chrome performance trace; drop the stagger cap, not the moves, if it does not.
