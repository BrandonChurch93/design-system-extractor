# Motion capture

The motion layer of a site is the part that makes a rebuilt interface feel like the original instead of merely looking like it: how long a hover takes, which curve it follows, what properties move, what fades in on load, what reveals on scroll, what loops. V1.0 read all of that from the stylesheets and discarded it. This spec adds it to the pipeline, the run document, the run page and every export, with the same posture as the rest of the product: everything is measured, nothing is invented, and anything observed at runtime rather than read from CSS is labeled as observed.

Stages touched: `capture` (the runtime motion pass), `tokens` (new substage `tokens:motion`), `components` (motion attached to components), `drift` (sprawl evidence), `exports` (every format). Data shapes are in `data-model.md`; the run page, panel and copy are in `docs/design/pages.md`, `components.md` and `copy.md` (D-081).

## What is captured

Three sources, in order of trust:

1. **Static, from matched CSS.** Every `transition`, `transition-*`, `animation`, `animation-*` declaration on element candidates and their descendants, with custom properties resolved to computed values on that element, and every `@keyframes` rule in any stylesheet the page loaded (including `@media` and `@supports` nested ones, with the condition recorded). This is the design system's own motion vocabulary and is the source of the duration and easing tokens.
2. **Runtime, through the Web Animations API.** `document.getAnimations()` returns every running CSS transition, CSS animation and Web Animations API animation (Motion, Framer Motion and most React animation libraries drive WAAPI). Each one exposes its target, its effect timing (`duration`, `delay`, `easing`, `iterations`, `fill`) and its keyframes (`effect.getKeyframes()`). Sampled through the first seconds of load and through the scroll pass, this gives entrance effects, scroll reveals and loops with exact timing.
3. **Runtime, through inline-style sampling.** GSAP, anime.js and hand-written `requestAnimationFrame` code write inline styles every frame and never appear in `getAnimations()`. A sampler watches inline `style` changes on element candidates and records, per element and per property, the first and last values and their timestamps. That yields start state, end state and measured duration. The easing is not knowable this way and is recorded as `null`; the pattern is labeled `observed · inline style`.

## The runtime motion pass

Step 2b of `capture-and-states.md`, between the main load and the scroll pass, and kept active through the scroll pass. Nothing about the main load changes: the sampler is installed with `page.addInitScript` before navigation so it is present from document start, and it is read out before the freeze step (which disables animations, ends every running one, and would end everything it is watching).

The init script:

- Starts at document start. Keeps a `WeakMap` from element to a stable element key (the same key the element-candidate pass assigns: tag, index path, and a hash of class tokens), assigned lazily when an element is first seen.
- Every 100 ms, and on every `scroll` event (throttled to 50 ms), calls `document.getAnimations()`. For each animation not yet recorded: records `source: 'css-transition' | 'css-animation' | 'waapi'` (from the constructor name and `animationName`/`transitionProperty`), the target element key, `effect.getTiming()`, `effect.getKeyframes()` reduced to the first and last keyframe for the tracked properties, the animation name for CSS animations, `startTime` relative to navigation start, and the trigger context: `scrollY` at start and whether the target's bounding rect was inside the viewport at start.
- Installs one `MutationObserver` on `document.documentElement` with `attributes: true, attributeFilter: ['style', 'class'], subtree: true`. For each `style` mutation on an element that is or will be an element candidate (ancestor depth ≤ 12, not `script`/`svg` internals), records the timestamp and the current inline values of the tracked properties. For each `class` mutation, records the timestamp, the classes added and removed, and `scrollY`; class toggles are how IntersectionObserver reveals are usually implemented, and the resulting CSS transition shows up in `getAnimations()` within the next sample with the same element key, which is how the two are joined.
- Records `IntersectionObserver` usage: the script wraps the constructor so that each observer created is counted and its root margin and thresholds are recorded (for the How this was made line and for the trigger classification; nothing else is intercepted).
- Caps: 400 animation records and 2,000 style samples per page; when a cap is hit the pass sets `motion.truncated: true` for that page and the event line says so.

Tracked properties: `opacity`, `transform`, `translate`, `scale`, `rotate`, `filter`, `backdrop-filter`, `clip-path`, `background-color`, `color`, `border-color`, `box-shadow`, `width`, `height`, `max-height`, `top`, `left`, `inset`, `background-position`, `stroke-dashoffset`, `letter-spacing`.

Read-out: before freeze, the worker pulls the records and the element keys. The scroll pass runs with the script still active; its records are read out again after the pass. Then freeze proceeds as before.

Cost: the init script adds under 2 ms per sample on a 2,000-node page and the pass adds no page loads. Timeouts are unchanged.

## Classification into patterns

Records are joined per element key and reduced to **patterns**. A pattern is one motion with a start state, an end state, timing and a trigger. Kinds:

- `entrance`: started within 2,500 ms of navigation start, target inside the viewport at start, `scrollY` 0, not infinite. Typical: hero text fades up on load.
- `scroll-reveal`: started during the scroll pass when the target entered the viewport (inside at start, not inside at the previous sample), not infinite. Trigger value is the fraction of the viewport height at which it fired, rounded to 0.05 (so the consumer can set a root margin).
- `scroll-progress`: a WAAPI animation whose timeline is a `ScrollTimeline` or `ViewTimeline`, or an inline-style pattern whose property changes monotonically with `scrollY` across at least 5 samples (parallax, progress bars). Trigger value is the scroll range in viewport heights.
- `scrolled-header`: the existing header `scrolled` state, now with its transition timing attached.
- `hover`: motion on a state capture of `hover`, `focus` or `active`. State capture runs after the freeze (D-089), so CSS transitions there are read from the element's resolved `transition-*` values taken before the freeze, and script-driven motion from the Web Animations records taken during that state (joined by element key and timestamp). These attach to the component's state delta rather than to the patterns list.
- `loop`: `iterations` infinite, or a CSS animation whose `animation-iteration-count` is `infinite`. Marquees, pulsing dots, spinners, gradient drifts.
- `open`: a Web Animations API animation recorded during the `open` state capture of a dropdown, menu, dialog or accordion. A popup's CSS transitions, read before the freeze, attach to its component as `open` transitions (D-089).

Each pattern: `{ id, kind, elementKey, selector, componentId?, pageId, pageIds: string[], viewport, instances: number, trigger: { type: 'load' | 'in-view' | 'scroll' | 'hover' | 'open', value? }, start: Record<property, string>, end: Record<property, string>, durationMs, delayMs, easing: string | null, easingTokenId?, iterations: number | 'infinite', keyframesName?, source: 'css-transition' | 'css-animation' | 'waapi' | 'inline-style', stagger?: { count, stepMs }, observed: boolean }`. `observed` is true for `waapi` and `inline-style` sources. `pageId` is where the pattern was first seen and `pageIds` every page it was seen on; `instances` counts the elements it collapsed (D-089). Trigger values: `in-view` is the fraction of the viewport height, measured from the bottom, at which it fired (0.15 for an element revealed when its top passed 85% of the viewport); `scroll` is the range in viewport heights for `scroll-progress` and the scroll offset in px for `scrolled-header` (400); `load` and `hover` carry none; a `loop`'s trigger is `load`.

**Grouping (D-090).** CSS transitions on one element that start within 50 ms of each other with one timing are one pattern. Inline-style samples on one element split into separate runs at gaps of 250 ms. An inline-style change is `scroll-progress` only when every value change coincides with a scroll change. Header motion seen during the scroll pass belongs to the `scrolled-header` pattern. An `in-view` value after an IntersectionObserver class toggle comes from the observer's root margin. A `loop`'s end state is its first keyframe that differs from the start. Animations on pseudo-elements are not read (the static read sees elements).

**Stagger detection.** Patterns of the same kind with the same start and end states on three or more sibling elements (same parent key) whose start times increase by a near-constant step (coefficient of variation under 0.25) collapse into one pattern with `stagger: { count, stepMs }` and the first sibling's selector.

**Deduplication.** Patterns with the same kind, start, end, duration, easing and keyframes name on elements with the same fingerprint (see `component-detection.md`) collapse into one with `instances: n` and the union of pages. One element's motion read at both viewports (the same element key on the same page, the same kind and source) is one pattern with the desktop reading; the phone reading adds no instance (D-090). The document keeps at most 80 patterns per run, ordered: entrance, scroll-reveal, scroll-progress, scrolled-header, open, loop, by instance count descending within kind. Hover transitions are unlimited because they live on components.

**Start and end states.** Values are normalized: transforms to a matrix-decomposed string (`translateY(12px)`, `scale(0.98)`), colors to hex or `rgb(r g b / a%)`, lengths to px. A property is kept only when start and end differ after normalization. An entrance or reveal with an empty diff after normalization is dropped.

## Motion tokens

Substage `tokens:motion`, run after `tokens:space`.

**Durations.** Every non-zero `transition-duration`, `animation-duration` and WAAPI `duration` across the run, in ms, counted by usage (elements, from the computed longhands read before the freeze). Delays are offsets, not durations: they stay in each pattern's `delayMs` and `stagger` and never become tokens, so a staggered site does not sprawl (D-089). Clustered by exact value after rounding to 5 ms. Each distinct value is a token `duration-{ms}` (`duration-160`). Tokens with usage under 1% of the total and within 20 ms of a neighbor are merged into the neighbor for the proposed set only (raw keeps them; drift reports the sprawl). A `role` is assigned by rank among the kept durations: the most used is `base`; shorter ones `fast`, `faster`; longer `slow`, `slower`; anything beyond is unroled. Roles are exported as aliases (`--duration-base: var(--duration-160)`).

**Easings.** Every `transition-timing-function`, `animation-timing-function` and WAAPI `easing`, resolved to a concrete value (keyword, `cubic-bezier(...)`, `steps(...)`, `linear(...)`). Named:

1. If the value came through a custom property in the site's CSS (`var(--ease-out-quad)`), the property name without `--` is the token name. The site named it; that name wins.
2. Else, matched against the known table with a tolerance of 0.02 per control point: `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`, and the Penner set `ease-in-quad`, `ease-out-quad`, `ease-in-out-quad`, and the same three for `cubic`, `quart`, `quint`, `expo`, `circ`, `back` (table in `packages/pipeline/src/tokens/easing-table.ts`, values from the usual reference curves, each with a short comment naming the source curve). `steps(n)` becomes `steps-{n}`; `linear(...)` with more than two stops becomes `spring-{n}` where n is the rank by usage, since `linear()` with many stops is how springs are serialized.
3. Else `ease-custom-{n}` by usage rank.

Each easing token: `{ id, name, value, siteName?, usage, pages }`. The SVG preview on the run page draws the curve from the value.

**Keyframes.** Every `@keyframes` block, normalized (whitespace, color formats, custom properties resolved where the resolution is the same on every element that uses it; otherwise left as `var()` with the property listed under `unresolved`), stored verbatim as CSS text with the name, the usage count (elements whose `animation-name` references it) and the pages. Unused keyframes are kept but marked `used: false` so the consumer can ignore dead ones.

**Durations and easings are TokenKind values** (`duration`, `easing`) so they appear wherever tokens are listed, exported and compared, with the same provenance shape (usage, pages, raw values absorbed). Keyframes are a separate list (`tokens.keyframes`), not a token kind, because they have no single value.

## Attachment to components

In the `components` stage, after instances and provenance:

- Each component gets `motion.transitions`: for each state captured (`hover`, `focus`, `active`, `open`, `scrolled`), the list of `{ property, durationMs, easingTokenId | easing, delayMs }` taken from the matched `transition-*` declarations resolved on the default-state instance and from the `getAnimations()` records that fired during that state's capture. The state's `delta` entries gain `transition?: { durationMs, easing }` by property so a reader sees, in one row, what changes, to what, and how fast.
- Each component gets `motion.animations`: CSS animations whose target is inside the component (name, duration, easing, iterations, trigger kind).
- Each pattern whose target is inside a component instance gets that `componentId`, and the component gets `motion.patternIds`.
- A component with no transitions, no animations and no patterns has `motion: null` and the panel says "No motion found on this component."

## Drift

Evidence rows of kind `sprawl`: more than 6 distinct durations ("9 durations: 100, 120, 150, 160, 200, 250, 300, 400, 500 ms") or more than 5 distinct easings ("7 easings, 3 within 0.05 of ease-out-quad"). The proposed set merges durations as described above and maps near-identical easings (every control point within 0.05) to the most used one. Neither becomes a number card or the headline.

## Exports

- `tokens.css`: after shadows and before breakpoints, a `--duration-*` group (values with roles as aliases) and an `--ease-*` group.
- `motion.css` (new `ExportFormat`): the duration and easing groups, every `@keyframes` block with `used: true` first and unused ones after a comment line, then one rule per component that has transitions, written against a slug class the prompt also uses (`.c-primary-button { transition: background-color var(--duration-160) var(--ease-out-quad), transform var(--duration-160) var(--ease-out-quad); }`) and one rule per pattern as a pair of classes (`.m-fade-up-start { opacity: 0; transform: translateY(12px); } .m-fade-up-end { opacity: 1; transform: none; transition: opacity 480ms var(--ease-out-quart), transform 480ms var(--ease-out-quart); }`), with a comment above each pattern naming the trigger ("add .m-fade-up-end when the element enters the viewport at 15% from the bottom · observed").
- `motion.json` (new `ExportFormat`): durations, easings, keyframes, patterns, and per-component transitions, the run document's own shapes.
- `tokens.json`: `duration`, `easing`, `keyframes` added.
- `tokens.w3c.json`: durations as `$type: "duration"` (`{ "value": 160, "unit": "ms" }`), easings as `$type: "cubicBezier"` where the value is a bezier (keywords are converted to their bezier equivalents; `steps()` and `linear()` easings are exported as `$type: "string"` with a `$description` saying the DTCG has no type for them). Keyframes and patterns are not DTCG concepts and are omitted from this format.
- `tailwind.tokens.js`: `transitionDuration`, `transitionTimingFunction`, `keyframes`, `animation` (one entry per used keyframes block with its most common duration and easing).
- `design-system.md`: a Motion section after Shadow and before Breakpoints (D-089): the duration scale as a table, the easings as a table with the bezier values, the keyframes in a fenced block, the patterns as a list in words with values, then per component a Motion line in its section.
- `prompt.md`: a `## Motion` section with the same content in prompt voice, and each component contract gains a `Motion:` line. The Rules gain: "Use only these durations and easings. Apply the entrance and scroll patterns to the equivalent elements of what you build; patterns marked observed were measured at runtime and their easing is the nearest token when none was recorded." The static opening sentence is unchanged.
- `all.zip`: includes `motion.css` and `motion.json`.
- MCP: a `get_motion` tool (`{ componentId? }` → the run's motion or one component's), and `get_component` includes `motion`. A resource `dse://run/{id}/motion.css`.
- CLI: `dse export <run.json> --format motion.css` works like every other format.

## Run page and panel

Specified in `docs/design/pages.md` (a Motion section on the complete run page between the Tokens and Components sections, a Motion ring on the stage rail, a Motion block in the component panel, Compare's motion rows), `docs/design/components.md` (the motion primitives) and `docs/design/copy.md` (every string).

## Reduced motion

The existing reduced-motion check and probe are unchanged. The motion pass runs on the normal load, never under `reducedMotion: 'reduce'`. The run page's own previews of easings and patterns respect the reader's `prefers-reduced-motion` per `docs/design/motion.md`: with reduce on, the curve is drawn and the pattern shows its end state, with no replay.

## Events

`capture · /pricing · motion 23 animations · 140 style samples`, `tokens · motion 5 durations · 3 easings · 4 keyframes`, `components · motion attached to 31 components · 12 patterns`, and the truncation line `capture · /docs · motion records cut at 400`.

## Honesty rules

- A pattern with `source: 'inline-style'` always carries `easing: null` and the UI and exports say "easing not recorded, nearest token suggested: {name}" where the suggestion is the most used easing token of the run. Nothing is presented as measured when it was not.
- Durations are measured in ms from timing objects, never estimated from samples, except for inline-style patterns where the duration is the time between the first and last sample and is labeled "about {n} ms".
- No pattern is attributed to a component unless the target element is inside one of that component's instances.

## Tests

- Static parsing: a stylesheet with shorthand and longhand transitions, nested `@media` keyframes, and custom-property easings yields the expected tokens with the site names.
- Easing table: every known curve matches itself within tolerance and a perturbed curve beyond tolerance becomes `ease-custom-1`.
- Runtime pass on the fixtures: the clean fixture's planted entrance (CSS animation), scroll reveal (IntersectionObserver class toggle plus CSS transition), inline-style reveal (a `requestAnimationFrame` script), loop and hover transition are each found with the right kind, trigger, start, end, duration, and `observed` flag (see `docs/evals.md` motion expectations).
- Stagger: five planted siblings with 60 ms steps collapse into one pattern with `stagger.count 5` and `stepMs` within 10 ms of 60.
- Attachment: the planted hover transition appears on the primary button's `hover` delta entries with `transition.durationMs` and the easing token id.
- Exports: golden tests for `motion.css` and `motion.json`; `tokens.w3c.json` still validates; `prompt.md` contains the Motion section and every component with transitions has a `Motion:` line.
- Freeze interaction: a test asserts the records are read out before the freeze style is injected (the sampler reports zero running animations after freeze, Web Animations API ones included).
