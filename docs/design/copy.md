# Copy

Voice, rules, and the verbatim copy for every surface. Copy here is final. Implement it character for character. Where a line contains a value in braces, the value comes from data or configuration.

Implementation: P11 creates `apps/web/copy/strings.ts`, the single source of every static string the app renders, including the catalog line and the flagged v2 surfaces, transcribed from this document; user-facing JSX reads from it and never holds literal copy. The copy audit test asserts that every string in `strings.ts` appears verbatim in this document.

The check result strings (pass and fail details) are specified once, in `docs/specs/checks.md`, and are not repeated here.

## Voice

Plain, confident, factual. Numbers first. Short sentences. No hype, no apology, no scolding. The product reports what it measured and proposes what would be cleaner; it never tells a site it is bad.

## Rules

1. No em dashes, anywhere. Facts in a line are separated by an interpunct (·). Sentences end with periods.
2. Sentence case for every heading, label, button and tag. The product name "Design System Extractor" is the one proper noun.
3. Forbidden words in product copy, checked by `pnpm qa:copy` with word boundaries, case-insensitive: `accessible`, `compliant`, `a11y`. "Accessibility" is allowed as the name of the field. The checks section is "Automated checks"; results are counts and measurements; a name an input exposes to assistive technology is "a name a screen reader can announce". qa-copy-allow
4. Counts read "118 of 132". Ratios are formatted once as "5.4:1" and the placeholder `{ratio}` already includes the ":1". Sizes read "44 × 44". Durations read "2 min 41 s". Costs read "$0.41".
5. Pages are written as paths: "/pricing". Hosts as hosts: "tidewater.app". Never "the website".
6. Model names are written "Haiku" and "Sonnet". Never "AI" in product copy; "a model" where a model is meant.
7. Buttons are verbs or verb phrases: "Extract", "Run again", "Copy prompt", "Read the drift report".
8. No exclamation marks.
9. Numbers under ten in running sentences are words ("six weeks", "three variants"); numbers in headlines, labels, tables, counts and anything with a unit are numerals ("14 grays", "2 min 41 s", "44 × 44").
10. Configured limits (runs per day, page caps) are rendered from the entitlements configuration, not typed. The strings below show the v1 defaults (2 runs, 12 pages, 40 with a key) and apply rule 9 when rendering.
11. Run ids are always shown in full, in mono.

## Global

- Wordmark: `Design System Extractor`
- Meta title pattern: `{page} · Design System Extractor`; home: `Design System Extractor · Paste a URL. Get its design system back.`
- Meta description: `Tokens, components with every state, automated accessibility checks and a drift report from any public site. Exports to CSS, JSON, Tailwind, W3C tokens, a prompt and an MCP server.`
- Nav: `Showcase` · `Recent runs` · `How it works` · `GitHub`
- Footer left: `Open source · MIT · Built by Brandon Church` · `About · Privacy · Terms` · `Built with` (links `/catalog`)
- Contact email `{email}`: the value of `DSE_CONTACT_EMAIL`.
- Links (constants in `apps/web/copy/links.ts`): repository `https://github.com/BrandonChurch93/design-system-extractor` (TopNav GitHub, "Read the source"); portfolio `https://www.brandonchurchportfolio.com` (Footer "Brandon Church").
- Toasts: `Copied` · `Link copied` · `Sign-in is not enabled yet.`
- Icon button and landmark labels (read by screen readers, never shown): `Menu` (the phone nav button) · `Close` (lightbox and sheet close) · `Copy` (code block copy) · `Primary` (the TopNav landmark) · `Sections` (the SectionNav landmark) · `Breadcrumb` (the run and component breadcrumbs)
- Generic validation line: `Something about that request was not right. Try again.`
- Rate limit line: `Too many requests. Try again in a minute.`
- App 404: title `There is nothing at that address.` · body `The link may be old, or the run may have been removed.` · button `Browse the showcase`
- Breadcrumbs: run `Showcase / {host}` · `Recent runs / {host}` · `{host}` · `Local run`; component `{host} / Components / {name}`; compare `{host} / Compare` (one host) or `Compare` (two hosts)
- Back link on the component page: `Back to all components`

## Page metadata

`{page}` values for the title pattern and the descriptions:

- Run: `{host}` · `{colors} colors, {typeStyles} type styles and {components} components extracted from {host}, with automated checks and a drift report.`
- Component: `{name} · {host}` · `{name} from {host}: variants, states, tokens, code and checks.`
- Compare: `Compare · {hostA}` or `Compare · {hostA} and {hostB}` · `What changed between two runs: tokens, components and checks side by side.`
- Recent runs: `Recent runs` · `The runs made from this browser.`
- How it works: `How it works` · `The pipeline, the checks, the costs, the fixture evals, the CLI and the MCP server.`
- Open a local run: `Open a local run` · `Open a run.json made by the dse CLI, entirely in your browser.`
- About: `About` · `A portfolio project by Brandon Church.` · Privacy: `Privacy` · `What this site stores and what it does not.` · Terms: `Terms` · `Use it on sites you are allowed to inspect.`
- State pages: `Runs paused` (budget, busy) · `Run limit` · `Could not crawl` (bot, robots, unreachable, invalid) · `Login wall`; description for all: `Design System Extractor could not run this extraction.`
- Catalog: `Catalog` · `Every component of the app, in every state.`
- App 404 (and a state route that does not exist): `Not found` · the App 404 body as the description (D-065)
- A run that has not finished: the run title with the global meta description, since its counts are not known yet (D-065)
- Every page also carries its title and description as its link preview (Open Graph and Twitter, `summary_large_image`) with the site name `Design System Extractor` (D-065)

## Enum labels (rendered from `packages/schema/src/labels.ts`)

- Component groups: `Buttons` · `Inputs` · `Navigation` · `Cards` · `Feedback` · `Data` · `Overlays` · `Other`
- Component types: `Button` · `Link` · `Text input` · `Select` · `Textarea` · `Checkbox` · `Radio` · `Toggle` · `Form` · `Nav bar` · `Header` · `Footer` · `Breadcrumb` · `Tabs` · `Pagination` · `Menu` · `Card` · `List row` · `Hero` · `Section header` · `Badge` · `Tag` · `Alert` · `Toast` · `Empty state` · `Table` · `Code block` · `Modal` · `Tooltip` · `Dropdown` · `Avatar` · `Other`
- States: `Default` · `Hover` · `Focus` · `Active` · `Disabled` · `Error` · `Checked` · `Selected` · `Open` · `Scrolled`
- Variant names, a color word then a size word, either left out when every variant shares it (`Primary small`, `Ghost`): color words `Primary` · `Secondary` · `Tertiary` · `Outlined` · `Ghost` · `Success` · `Warning` · `Danger` · `Info`, a fourth fill takes its hue word (`Teal`); size words `small` · `large`; third words for variants that would share a name (D-084): `bordered` · `rounded` · `square` · `tight` · `wide` · `bold` · `muted` · `tall` · `short` · `faint` (`Ghost rounded`); a single variant `Default`. Names never carry a number. Generated component names (when the model is not used) are the type label for the first of a type and `{Type label} ({context})` after it (`Button (footer)`, `Button (footer, pricing)`, `Button (footer, second)`), the context in lowercase as the page shows it, the ordinal words `second` · `third` · `fourth` and on.
- Checks: `Contrast AA` · `Focus visible` · `Tap target` · `Label present` · `Reduced motion`
- Check descriptions: `Text against the background it actually sits on, at the size it is rendered` · `A visible focus style when reached by keyboard` · `44 × 44 px minimum for touch controls at the mobile viewport` · `Inputs and icon-only buttons have a name a screen reader can announce` · `Animations stop or shorten under prefers-reduced-motion`
- Type roles (the sample text in TypeScaleRow; D-087): `Display` · `Title` · `Heading` · `Subheading` · `Body` · `Body small` · `Label` · `Eyebrow` · `Caption` · `Code` · `Text`
- Page reasons: `home` · `nav` · `footer` · `sitemap` · `linked` (the `body` reason) · `forms` · `forms, errors` · `tables, toggles` · `code blocks` · `list template` · `post template` · `badges, timeline` · `empty state` · `about` · `careers` · `app` · `you added it` · `{group} template, 1 of {n}`
- Framework hints: `Tailwind` · `Bootstrap` · `MUI` · `Chakra` · `CSS-in-JS`; rendered as `{Name} detected`
- Blocked reasons (Recent runs result line): `Blocked the crawler. Nothing extracted.` · `Login wall. One page extracted.` · `Could not be reached. Nothing extracted.` · `Crawling not allowed. Nothing extracted.` · `Budget was spent. Nothing extracted.` · `Crawler was busy. Nothing extracted.` · `Run limit reached. Nothing extracted.` · `Not a crawlable address.` (shared by `invalid-url` and `private-address`)
- Run statuses (pills): `Queued` · `Complete` · `Running` · `Blocked` · `Failed` · `Cancelled`
- Stage display labels for the live log: `queue` · `crawl` (the `discover` stage) · `select` · `capture` · `tokens` · `components` · `previews` · `checks` · `drift` · `exports` · `done`
- Substages (named after the rail rings they fill): `Palette` · `Type` · `Spacing` · `Motion`
- Event levels: `Info` · `Warning` · `Error`
- Viewports: `Desktop` · `Mobile`
- Page statuses: `Pending` · `Captured` · `Failed`
- Token kinds: `Color` · `Type` · `Spacing` · `Radius` · `Shadow` · `Breakpoint` · `Duration` · `Easing`
- Motion kinds: `Entrance` · `Scroll reveal` · `Scroll progress` · `Scrolled header` · `Hover` · `Loop` · `Open`
- Motion sources: `CSS transition` · `CSS animation` · `Web animations` · `Inline style` (sentence case, rule 2, D-090)
- Component tiers: `Core` · `Page-specific`
- Color groups: `Brand` · `Neutral` · `Semantic`
- Semantic roles: `Success` · `Warning` · `Danger` · `Info`
- Preview modes: `Live` · `Captured`
- Captured reasons: `render differed by {pct} %` · `styles too large` · `fonts unavailable` · `not checked in time` (D-066)
- Check statuses: `Pass` · `Fail` · `Not applicable`
- Drift kinds: `Grays` · `Variants` · `Spacing values` · `Type styles`
- Evidence kinds: `Color` · `Variant` · `Spacing` · `Type` · `Sprawl`
- Plans: `Free` · `Pro` · `Team`
- Export formats: `CSS variables` · `JSON` · `Tailwind config` · `W3C design tokens` · `design-system.md` · `Prompt` · `Component prompt` · `Motion CSS` · `Motion JSON` · `All files`

## Home

- Headline: `Paste a URL. Get its design system back.`
- Subline: `Tokens, components with every state, accessibility checks, and a drift report showing where the system is leaking.`
- Input placeholder: `https://your-product.com`
- Input label (visually hidden): `Site URL`
- Button: `Extract`
- Caps caption: `Free · {runsPerDay} runs a day per visitor · up to {pageCap} pages per run · Use your own key for more`
- Include disclosure: `Also include pages` · textarea placeholder `https://your-product.com/app/settings` · caption `Pages the crawler might not find. Same site only, up to 5.`
- Key popover: label `Your Anthropic API key` · placeholder `sk-ant-…` · button `Save in this browser` · saved state `Key saved · Remove` · caption `Stays in this browser. Sent only with your own runs. Never stored on the server. Lifts the per-visitor limit and raises the page cap to {byoPageCap}.`
- Showcase heading: `Showcase` · caption `Runs on sites we picked. Every run page has a share link.`, or, when the content holds at least one promoted entry (D-091), `Sites I have run it on. Yours stays private unless you share the link.`
- Category chips: `All` · `SaaS` · `Developer tools` · `Commerce` · `Finance` · `Government` · `Media` · `Personal`
- Showcase card stats: `{colors} colors · {typeStyles} type styles · {components} components` · checks `{passed} of {applicable} checks`
- Footer context: `Runs on a daily budget, paused when it runs out.`
- Client-side validation: `That is not a web address.` · `Only http and https sites can be crawled.` · `That is not the same site as the URL above.` (for include lines)

## Run page

- Breadcrumb: `Showcase / {host}` · `Recent runs / {host}` · `{host}` · `Local run`
- Meta complete: `{pages} pages · {viewports} viewports · crawled {date} · {duration} · {framework} detected` (framework segment omitted when none; one page reads `1 page` here and in every page count, D-059)
- Meta queued: `Waiting for a crawler · {ahead} runs ahead of you` (`1 run ahead of you`; `next in line` when zero)
- Meta while crawling: `Crawling {n} of {total} pages · 2 viewports · {elapsed} elapsed · usually finishes in about 3 minutes`
- Meta after crawling: `{pages} pages · 2 viewports · {elapsed} elapsed · {stage phrase}` with stage phrases `clustering tokens` · `detecting components` · `building previews` · `running checks` · `computing drift` · `writing exports`
- Eyebrow in progress: `Extracting`
- Buttons: `Share` · `Run again` · `Compare` · `Export` · in progress `Cancel`
- Stat labels: `Colors` · `Type styles` · `Spacing steps` · `Components` · `Checks passed` · `Components passing`; the Components passing cell's caption `pass every check that applies` (D-096)
- Palette label: `Palette`; swatch caption `{name} · {uses} uses`
- Token popover: usage `{n} uses` (`1 use`) · `Seen on` with lines `{path} · {n}` · `Raw values` with lines `{value} · {n}` · `Contrast` with lines `{fg} on {bg} · {ratio}` · `Contexts` with lines `padding {padding} · margin {margin} · gap {gap}`
- Drift headline patterns, by kind: grays `{n} grays across {pages} pages. {m} would do.` · variants `{n} variants across {k} components. {m} would do.` · spacing `{n} spacing values, {k} of them off the {base} px grid.` · type `{n} type styles where {m} would do.` · nothing to collapse `Nothing to collapse. {colors} colors, {steps} spacing steps, all on the grid.`
- Drift supporting line: the next two findings as sentences following rule 9, e.g. `Six variants across four components where three would do. Nine spacing values, two of them off the 4 px grid.` Patterns: grays `{n} grays across {pages} pages where {m} would do.` · variants `{n} variants across {k} components where {m} would do.` · spacing `{n} spacing values, {k} of them off the {base} px grid.` · type `{n} type styles where {m} would do.` (D-055)
- Drift button: `Read the drift report`
- Section nav: `Tokens` · `Motion` · `Components` · `Checks` · `Drift` · `Exports`
- Tokens caption: `Clustered from {rawColors} raw color values, {fontDecls} font declarations and {spacingValues} spacing values.`
- Color groups: `Brand` · `Neutral · {n} found` · `Semantic`
- Type card meta: `{families} · {n} styles` (families joined by ·); show-all `Show all {n} styles`; font not loaded caption `{family} did not load; the fallback {fallback} was measured.`
- Spacing meta: `{n} steps · {base} px base`; breakpoints caption `Breakpoints · {list}` (values joined by ·); off-grid popover `Off the {base} px grid` followed by the page list
- Radius and shadow labels: `Radius` · `Shadow`; shadow names `sm` · `md` · `lg`; the pill radius `pill`
- Dark theme caption: `A dark theme was detected and not extracted.`
- Overlays: label `Overlays` · caption `Translucent colors, as a base color and an alpha.`
- Site names (D-082): Pill `Named by the site` · provenance line `Named by {variable}` · type tags line `Found on {tags}` (tags joined by ·)
- Easing grid (D-093): caption `Every curve runs the same distance in the same time, so the differences are the point.` · reduced motion caption `Curves are shown still because your system prefers reduced motion.` · usage line `{uses}`: at most three parts, the component types first then the pattern kinds, most used first, joined with commas and `and` (`Buttons, cards and 2 scroll reveals`, `Buttons and links`, `1 entrance`), the first word capitalized; a component type is written by its plural word below in lowercase, a pattern kind as `{n} {kind}` with the singular word at one
- Component type plurals (usage lines): `Buttons` · `Links` · `Text inputs` · `Selects` · `Textareas` · `Checkboxes` · `Radios` · `Toggles` · `Forms` · `Nav bars` · `Headers` · `Footers` · `Breadcrumbs` · `Tabs` · `Pagination` · `Menus` · `Cards` · `List rows` · `Heroes` · `Section headers` · `Badges` · `Tags` · `Alerts` · `Toasts` · `Empty states` · `Tables` · `Code blocks` · `Modals` · `Tooltips` · `Dropdowns` · `Avatars` · `Other components`
- Pattern kinds in usage lines, singular and plural: `entrance` · `entrances`, `scroll reveal` · `scroll reveals`, `scroll progress pattern` · `scroll progress patterns`, `scrolled header` · `scrolled headers`, `hover pattern` · `hover patterns`, `loop` · `loops`, `open pattern` · `open patterns`
- Motion section (D-081): title `Motion` · caption `{durations} durations · {easings} easings · {keyframes} keyframes · {patterns} patterns` · empty `No transitions or animations found.` with caption `This site does not move, or its motion is driven by scripts the crawler could not observe.` · card heads `Durations` · `Easings` · `Keyframes` · `Patterns`, the Compare row words, each with its count as meta (D-090)
- Duration role labels: `Faster` · `Fast` · `Base` · `Slow` · `Slower`
- Easing card: value caption `{value}` · site-named caption `Named by the site`
- Keyframes: `{n} uses` (`1 use`) · unused Pill `Unused`
- Replay button (pattern rows only; the easing and duration loops have no button, D-093): `Replay` · while playing `Stop` · reduced motion caption `Replay is off because your system prefers reduced motion.`
- Pattern trigger phrases: load `On load` · in-view `When it enters the viewport at {pct}% from the bottom` · scroll `Over {range} viewport heights of scrolling` · scrolled header `After {px} px of scrolling` (D-089) · hover `On hover` · open `When it opens` · loop `Loops every {duration}`
- Stagger phrase: `{count} items · {step} ms apart`
- Observed tag `Observed` · observed caption `Measured at runtime. Easing not recorded; nearest token: {name}.` · inline-style duration phrase `about {ms} ms` · a measured duration `{ms} ms`
- Tier headings `Core components` · `Page-specific components`; filter chip `Core only`
- Components caption: `{n} found · grouped by type · open one for states, code and tokens`
- Component chips: `All · {n}` then `{group} · {n}` for each group with a count
- Component card source line: `First seen on {path} · {pages} pages · {variants} variants` (singular forms `1 page`, `1 variant`)
- Captured label: `Captured`
- Filter chip `Passing all checks` (D-096)
- Preview controls (D-094): StateBar chips use the State labels (`Default` · `Hover` · `Focus` · `Active` · `Open` · `Disabled`, only the states captured) · `Play` · StateBar landmark label `States` · Ground toggle label `Ground` with `Site` · `Light` · `Dark` · scale caption `Shown at {scale}×` (two decimals at most, trailing zeros dropped: `0.8×`, `0.65×`) · font caption `Font substituted: {family} was not available.`
- Preview titles (read by screen readers): `{name} preview` · `{name} · {state} preview`
- Check badge (D-096): `All checks` when every applicable check passes · `{passed} of {applicable} checks` otherwise · nothing when no check applies
- Show all: `Show all {n} components`
- Checks heading: `Automated checks`
- Disclaimer sentence (required wherever checks are summarized): `The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.`
- Checks opening line (D-096): `{passed} of {applicable} components pass every check that applies to them.` (`1 component passes` at one)
- Checks summary: cells `Passed` · `Failed` · `Applicable`; caption `of {components} components × up to 5 checks`
- Checks table headers: `Check` · `What it measures` · `Passed` · `Failing`; failing format `{component} · {detail}`; overflow button `· {n} more`; none `None`
- Drift heading: `Drift report`; caption `Where the system is leaking, with a proposed clean set. Numbers first, proposal second, evidence last.`
- Drift number cards: `{n} grays → {m}` · `{n} variants → {m}` · `{n} spacing values → {m}` · `{n} type styles → {m}`; captions are generated from the templates in `docs/specs/drift.md`
- Proposal labels: `Current · {n} grays` · `Proposed · {m} grays`; spread caption `Spread across {pages} pages, {textUses} text uses and {borderUses} border uses.`; absorb line `absorbs {values}` (values joined by a comma and a space); unchanged `unchanged`; footer `Every proposed pair keeps or improves its contrast ratio on the surfaces it is used on.`
- Evidence headers: `Near-duplicate` · `And` · `Delta` · `Seen on` · `Uses`
- Exports heading: `Exports`; caption `Every export uses the proposed clean set by default. Switch to the raw extraction in each file.`; toggle `Proposed set` · `Raw extraction`; `Download all`
- Export cards: `CSS variables` / `tokens.css · {size}` · `JSON` / `tokens.json · {size}` · `Tailwind config` / `tailwind.tokens.js · {size}` · `W3C design tokens` / `tokens.w3c.json · {size}` · `Motion CSS` / `motion.css · {size}` · `Motion JSON` / `motion.json · {size}` · `design-system.md` / `For a repo's CLAUDE.md or docs · {size}` · `Prompt` / `Whole system or one component, for Claude, ChatGPT or any model`; buttons `Download` · `Copy prompt`
- Component Default line (exports only, not UI; D-083): `Default: background {token} · text {token} · border {width} {token} · radius {value} · padding {values} · font {token} · shadow {token}` with absent parts omitted
- MCP card: `MCP server` · caption `Claude Code and Claude Desktop read this run directly. No pasting.` · install line `claude mcp add design-system-extractor -- npx -y @design-system-extractor/mcp --run {id}` · tools caption `Tools exposed: get_tokens · list_components · get_component · get_checks · get_drift · get_prompt · get_motion`
- Footer context: `Run {id} · cost {cost} · Haiku for naming, Sonnet for the report · How it works` and `Share link: {url}` and `Report a problem with this run` and `Show log`, and the live-rate line `{live} of {total} components are live previews; {captured} are captured images.` (D-095; also the last sentence of the design-system.md export's How this was made paragraph)
- Sparse caption: `A small site. The showcase has larger systems to compare against.`
- Login wall caption: `Only the sign-in page was public. One page, {n} components.`
- Failed: `Something broke on our side.` / `Run {id}. This did not count toward your runs today.` / `Run again` · `Browse the showcase`
- Cancelled: `This run was cancelled.` / `Run {id}. It did not count toward your runs today.` / `Run again` · `Browse the showcase`
- Not found: `No run with that link.` / `Browse the showcase`
- Share popover: `Share link` · `Copy` · `Copy as markdown` (copies `[{host} · Design System Extractor]({url})`)
- Page list footer: `Picked for component coverage, not importance. Legal pages, tag archives and pagination were skipped.`
- Stage rail labels. Pending: the bare name (`Pages` · `Palette` · `Type` · `Spacing` · `Motion` · `Components` · `Checks` · `Drift`). Running: `Pages · {n} found` · `Pages · capturing {n} of {total}` · `Palette · clustering` · `Type · reading {n} of {total}` (`{total}` is the page count) · `Spacing · measuring` · `Motion · reading` · `Components · clustering` · `Components · naming` · `Checks · running` · `Drift · computing`. Done: `Pages · {n}` · `Palette · {n} colors` · `Type · {n} styles` · `Spacing · {n} steps` · `Motion · {n} durations` (`Motion · none found` when the run has no durations, easings, keyframes or patterns) · `Components · {n}` · `Checks · {passed} of {applicable}` · `Drift · {n} findings` (`Drift · nothing to collapse` when none)
- Live log label: `Live log` · `Collapse` · `Expand`
- In-progress footer: `You can leave. This page keeps its link and fills in when you come back.` and `Share link ready: {url}`

## Component panel and page

- Eyebrow: `{group} · {index} of {count}`
- Icon labels: `Previous component` · `Next component` · `Open as page` · `Close panel`
- Variants label: `Variants`; fidelity caption `Live render · matches crop within {pct} %` or `Captured · {reason}` with reasons `render differed by {pct} %` · `styles too large` · `fonts unavailable` · `not checked in time`
- Source label: `Source`; lines `{path} · {viewport} px` · the selector in code · `Seen on {paths} and {n} more` (button) · `Show on page`
- States label: `States · {n} captured`; missing line `Not captured: {names}` (each state name followed by its reason in parentheses, joined by ·) with reasons `no instance found` · `over capture cap` · `not reachable`
- Checks label: `Checks · {passed} of {applicable} on {variant}`; result lines from `docs/specs/checks.md`
- Tokens label: `Tokens used`; unmapped label `Unmapped`
- Responsive note: `Stacks at 390 px` · `Changes layout at 390 px`
- Code tabs: `HTML` · `CSS` · `Tailwind`
- Motion (D-081): label `Motion` · region name `{name} · Motion` (the run page has a Motion region of its own, D-090) · none `No motion found on this component.` · MotionRow `{state} · {property} · {duration} · {easing}`
- Actions: `Copy prompt for this component` · `Copy code`
- Footer: `Seen on {paths} and {n} more. First captured on {path} at {viewport} px.`
- Phone sheet handle label: `Component details`

## Compare

- Titles: same host `What changed in {span}` with spans following rule 9: `today` · `{n} days` · `{n} weeks` · `{n} months` ("six weeks", "three days", "14 months"), singular `one day` · `one week` · `one month`; under 14 days counts days, under 60 days weeks, months after; two hosts `{hostA} and {hostB}`
- Column facts: `{pages} pages · {viewports} viewports`
- Caption: `Same site, two runs. Same pages, same viewports, same thresholds.` · two sites: `Two sites, one method. Same viewports, same thresholds.`
- Toggle: `Two runs of one site` · `Two sites`
- Column labels: `Before` · `After` · for two sites `A` · `B`
- Delta captions: `Colors · {n} fewer` / `{n} more` / `unchanged` · `Grays · {n} fewer, still {k} to go` · `Components · {n} new` · `Checks passed · of {a} then {b}` · `Spacing steps · unchanged`
- Token cards: `Added · {n}` · `Removed · {n}` · `Unchanged · {n}`
- Change table: `Component` · `Change` · `Before` · `After` · `Checks`; pills `New` · `Changed` · `Removed`
- Motion heading `Motion`; rows `Durations` · `Easings` · `Keyframes` · `Patterns` (D-089)
- Buttons: `Open the {date} run`
- Picker: `Pick a run to compare against` · `Paste another run link`
- Footer: `Compare is desktop only. On a phone, open either run.`
- Could not compare (D-092): StateCard title `We could not compare these runs.` · body `{reason}` with reasons `No run with the link {id}.` · `The {host} run of {date} could not be read.` · ghost Buttons `Open {host}`, one for each run that exists

## Recent runs

- Title `Your recent runs` · caption `Remembered in this browser. Every run keeps its share link, so it works anywhere.` · `{runsLeft} of {runsPerDay} runs left today` (or, when a key is saved in this browser, `Unlimited runs with your key`) · `New run`
- Columns: `Site` · `Result` · `When` · `Status`; buttons `Compare` · `Details`
- When: `Today, {time}` · `Yesterday, {time}` · `{Mon D}`
- Result line for complete runs: `{colors} colors · {components} components · {passed} of {applicable} checks`; for blocked runs the blocked-reason label
- Caption: `Clearing your browser data clears this list. Save the share links you care about.`
- Empty: `No runs yet in this browser.` / `Paste a URL on the home page and it will show up here.` / `Extract a site`
- Footer: `Nothing to sign up for. Runs are capped per visitor and by a daily budget.` · `Use your own key to lift the limits`

## State pages

Budget reached: eyebrow `Runs paused` · title `Today's budget is spent.` · body `This site runs on a fixed daily budget so nobody can run up a bill. It resets at midnight Mountain time, in about {hours} hours.` · meter `{used} of {budget} used` · `{n} runs today` · form heading `Run it now with your own key` · button `Extract {host}` · footer `Your URL is kept in the form. Nothing was lost.`

Busy: eyebrow `Runs paused` · title `The crawler is busy.` · body `More than twenty runs are waiting. Try again in a few minutes.` · footer as budget.

Run limit: eyebrow `Run limit` · title `You have used today's {runsPerDay} runs.` · body `Each visitor gets {runsPerDay} runs a day so the budget lasts. It resets at midnight Mountain time, in about {hours} hours.`

Site blocked: eyebrow `Could not crawl` · title `{host} blocked the crawler.` · body `The site answered with a bot challenge on every page we tried. No pages were captured, so nothing was extracted and nothing was charged.` · heading `What you can do` · lines `Try a different page of the same site. Some sites only challenge the home page.` · `If it is your site, allow the user agent DesignSystemExtractorBot/1.0 and run again.` · `Try another site. The showcase has twelve that work.` · button `Try this page` · `Browse the showcase` · `How crawling works` · footer `This attempt did not count toward your runs today.`

Robots: eyebrow `Could not crawl` · title `{host} asks crawlers not to visit.` · body `Its robots.txt disallows the pages we would need. We respect that, so nothing was crawled.`

Login wall: eyebrow `Only the sign-in page is public` · title `{host} is behind a login.` · body `Every page we found redirected to the same sign-in screen. We extracted that one page so you are not left with nothing, but it is one form, not a system.` · card `Sign-in page only` with the stats line · `Open it anyway` · heading `To extract the real thing` · lines `Point it at a public marketing or docs site for the same product. That is usually where the system lives.` · `Or run the open-source crawler locally against your own logged-in browser. Nothing leaves your machine.` · code `npx @design-system-extractor/cli extract https://{host} --cdp http://localhost:9222` · buttons `Try another URL` · `Local crawling guide`

Unreachable: eyebrow `Could not crawl` · title `We could not reach {host}.` · body `The address did not resolve or did not answer within 20 seconds.` · button `Try again`

Invalid: eyebrow `Could not crawl` · title `That is not a public web address.` · body `Only http and https sites on the public internet can be crawled. Private and local addresses are not.` · button `Try again`

Worker-side failure details (shown in the failed state and the live log): `Timed out after {minutes} minutes.` (the run's own timeout: 6 for a visitor's run, 15 for a showcase run, D-071) · `Your key was rejected by Anthropic.` · `The crawler stopped unexpectedly.`

## Open a local run

Title `Open a local run` · caption `From the dse CLI. Nothing is uploaded; the file stays in your browser.` · drop zone `Drop run.json here, or choose a file` · `Choose file` · breadcrumb `Local run` · placeholder `Captured image not available locally. Run dse serve to show it.`

## How it works

Intro: `Most of the pipeline is plain code. A model is used in four steps, and only where judgment is needed: choosing pages, naming colors, naming components, and writing the report. Everything measurable is measured.`

Pipeline steps (name · description · who):

1. `Crawl` · `Headless Chromium opens the URL, reads sitemap.xml, header and footer navigation, and collects candidate pages. Cookie banners are dismissed, client-rendered apps are waited for.` · `Deterministic`
2. `Select pages` · `Candidates are scored for component coverage: pricing, forms, docs, lists, empty states. Pages sharing a template are folded to one. A short text-only model pass picks the final set, within the page cap.` · `Model · Haiku`
3. `Capture` · `Each page at 1440 and 390 px: DOM, computed styles for every element, screenshots. Controls are hovered, focused and tabbed through so states are captured, not guessed.` · `Deterministic`
4. `Cluster tokens` · `Raw values become tokens: colors by ΔE, type by family, size, weight and line height, spacing by frequency against a base grid, radii and shadows by exact match. Usage is counted. A short model pass names the colors.` · `Model · Haiku`
5. `Motion` · `Transitions, easings, durations and keyframes are read from the stylesheets; entrances, scroll reveals and loops are observed while the page loads and scrolls.` · `Deterministic`
6. `Detect components` · `Elements are fingerprinted by tag, class pattern, computed style and box ratio, then clustered. Each cluster gets a crop, its signature and its states.` · `Deterministic`
7. `Name and group` · `A model sees each cluster's crop and signature and answers one question: what is this, and which variants belong together. Batched per page, cached rubric, structured output.` · `Model · Haiku`
8. `Run checks` · `Contrast on real foreground and background pairs, focus visibility, tap target size at the mobile viewport, names for inputs and icon buttons, reduced motion. Numbers, not opinions.` · `Deterministic`
9. `Compute drift` · `Near-duplicate tokens, off-grid values, variants that differ by a pixel. A proposed clean set is derived that keeps every contrast ratio at or above the current one.` · `Deterministic`
10. `Write the report and exports` · `The drift narrative and the design-system.md introduction are written from the computed facts. Token files, the prompt and the MCP server are generated directly from the data.` · `Model · Sonnet`

Cost and limits card: `A typical run costs well under a dollar. The site runs on a fixed daily budget and pauses when it is spent. Each visitor gets {runsPerDay} runs a day and {pageCap} pages per run.` · `Your own key lifts both limits and raises the page cap to {byoPageCap}. It stays in your browser and is sent only with your requests.` · CodeBlock:

```
model routing
  select pages          Haiku
  name colors           Haiku
  name and group        Haiku
  report, intro         Sonnet
  anything else         no model
```

Checks card: `The five checks cover the parts of WCAG 2.2 that can be measured from a rendered page. They do not cover reading order, alternative text quality, keyboard traps, or anything that needs a human.` · `A component that passes every check has passed five measurements. The page says exactly which.`

Pipeline heading `The pipeline`. Card titles `Cost and limits` · `What the checks are, and are not`.

Testing heading `How it is tested`; table headers `Fixture site` · `What it proves` · `Tokens` · `Components` · `Live previews`; fixture rows (`Clean` · `A small, well-kept system extracts with no false drift`), (`Messy` · `Deliberate near-duplicates and off-grid values are all caught`), (`Tailwind` · `Utility classes cluster into tokens, not thousands of raw values`), (`CSS-in-JS` · `Hashed class names do not break component detection`), (`Component library` · `A site built on a known library maps back to its own component names`); cells `precision {p} · recall {r}` (two decimals) and `{live} of {total}`; caption `The fixture sites and their expected results live in the repository. Every change to the pipeline runs against all five before it ships. Numbers above are the current build.`

CLI heading `The CLI`; caption `Runs the same pipeline on your machine. Point it at a logged-in Chrome with --cdp to extract private sites, then open the result on this site without uploading it.`

CLI CodeBlock:

```
npm install -g @design-system-extractor/cli
dse extract https://your-product.com --out ./dse-run
dse export ./dse-run/run.json --format tokens.css
dse serve ./dse-run
```

MCP heading `The MCP server`; caption `Claude Code and Claude Desktop read a run directly. No pasting.`; CodeBlock:

```
claude mcp add design-system-extractor -- npx -y @design-system-extractor/mcp --run {id}
npx -y @design-system-extractor/mcp --url https://design-system-extractor.vercel.app/r/{id}
npx -y @design-system-extractor/mcp --file ./dse-run/run.json
```

Buttons `Read the source` · `Try it on a site`. Footer right: `Runs are never shown publicly unless they are in the showcase.`

## Catalog

Title `Catalog` · caption `Every component of the app, in every state, from sample data.` · the dev line `Design QA · build spend {used} of {cap}` (shown only when running locally) · the index landmark `Catalog index` · the frame caption `{name} at 390 px` · the frame label `{viewport} · 390 px` · the motion demo button `Replay`

## Flagged v2 surfaces (rendered only with BILLING_ENABLED, always in the catalog)

- Home section heading `Plans`; plan names `Free` · `Pro` · `Team`; price placeholder `[PRICE]` with period `per month`; Free price `0`; caption `Prices are placeholders until plans launch.`
- Plan buttons: `Current plan` (Free, disabled) · `Choose Pro` · `Choose Team`
- Feature lists, from `docs/v2-plan.md`: Free `{runsPerDay} runs a day` · `{pageCap} pages per run` · `Desktop and mobile` · `90 days of history`; Pro `30 runs a day` · `40 pages per run` · `Private runs` · `Weekly re-runs with drift alerts` · `One year of history`; Team `150 runs a day` · `80 pages per run` · `Everything in Pro` · `Daily re-runs and alerts on deploy` · `10 seats` · `Unlimited history`
- AccountMenu: button label `Account` · items `Billing` · `Sign out`
- SignInSheet: title `Sign in` · input label `Email` · `Send a sign-in link` · `Continue with GitHub`
- BillingPage: title `Billing` · `Current plan` · `Usage this period` · `{runs} runs · {pages} pages` (singular `1 run`, `1 page`) · `Manage subscription` · `Invoices` · empty `No invoices yet.`
- UpgradePrompt: `Pro runs skip the queue and the daily budget.` · `See plans`
- PlanBadge: the plan name
- TopNav, with the flag on and no session: a ghost Button `Sign in` that opens the SignInSheet (D-060)
- BillingPage meter label (read by screen readers): `Runs today` · metadata `Billing` · `Your plan, usage and invoices.`

## About

`Design System Extractor is a portfolio project by Brandon Church, a design engineer. It exists to show one thing well: a tool that treats a website's design system as data, extracts it with care, and presents it like a product.`

`It is open source under the MIT license. The crawler identifies itself, obeys robots.txt, rate limits itself, and crawls at most a dozen pages of any site. Runs are private by link unless they are in the showcase.`

`If you own a site in the showcase and would rather it were not, email {email} and it will be removed.`

## Privacy

`This site stores the runs it produces: the pages it captured, the styles it computed, the screenshots it took, and a cost figure. It does not store your API key if you provide one; the key is kept in your browser and sent only with your own runs.`

`It sets one cookie, a random visitor id, to count runs per day. It uses no analytics and no third-party scripts.`

`Runs are kept for ninety days, or longer when they are in the showcase. Email {email} to have a run removed sooner.`

## Terms

`This is a free tool provided as is, without warranty. Use it on sites you are allowed to inspect. Do not use it to overload a site or to circumvent access controls. Extracted data describes the site it came from and belongs to whoever owns that site; this tool claims nothing over it.`

`The operator may remove a run, pause the service, or change limits at any time.`

`Operated by Brandon Church, Idaho, United States.`
