# localhost:4100 design system

This design system was extracted from localhost:4100 across nine pages. It holds nine colors, nine type styles, 11 spacing steps and 27 components.

## Palette

| Name | Value | Group | Uses |
| --- | --- | --- | --- |
| gray-50 | #FFFFFF | neutral | 138 |
| gray-200 | #E2E8F0 | neutral | 247 |
| blue-ink | #0B1F3A | brand | 984 |
| blue-600 | #2458E6 | brand | 151 |
| teal-500 | #0F8A8A | brand | 44 |
| blue-overlay | #0B1F3A1F | brand | 25 |
| success | #15803D | semantic | 16 |
| warning | #B45309 | semantic | 16 |
| danger | #DC2626 | semantic | 12 |

## Type

| Name | Role | Family | Size | Line height | Weight |
| --- | --- | --- | --- | --- | --- |
| display | display | Inter | 48px | 56px | 700 |
| h1 | h1 | Inter | 36px | 44px | 700 |
| h2 | h2 | Inter | 28px | 36px | 700 |
| h3 | h3 | Inter | 20px | 28px | 600 |
| body | body | Inter | 16px | 26px | 400 |
| label | label | Inter | 14px | 20px | 600 |
| body-sm | body-sm | Inter | 14px | 22px | 400 |
| code | code | ui-monospace | 14px | 22px | 400 |
| caption | caption | Inter | 12px | 16px | 400 |

## Spacing

4 px base. Steps: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96.

## Radius

- radius-sm: 8px
- radius-md: 12px
- radius-pill: 9999px

## Shadow

- shadow-sm: 0px 1px 2px 0px #0B1F3A1F
- shadow-md: 0px 12px 32px 0px #0B1F3A1F

## Breakpoints

- breakpoint-sm: 640px
- breakpoint-md: 1024px

## Components

### Button

Button · 6 variants: Primary, Ghost, Secondary, Secondary small, Primary small, Ghost small
States captured: Default, Hover, Focus, Active, Disabled
Tokens used: blue-ink (color), radius 8px (border-radius), space-20 (padding-right), space-20 (padding-left), label (font)
Unmapped: border-color rgba(0, 0, 0, 0)
Checks: 4 of 4
- Contrast AA · pass · 16.5:1 on gray-50
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 88 × 44 at 390 px
- Reduced motion · pass · Stops under reduced motion

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<a class="btn btn-ghost" href="#">Sign in</a>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 87.86px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 87.86px !important; height: 44px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
a { color: #2458E6; text-decoration: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 44px; padding: 0 20px; border: 1px solid transparent; border-radius: 8px; font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color 160ms ease, color 160ms ease; }
.btn-ghost { background: transparent; color: #0B1F3A; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Dropdown trigger

Button · 1 variant: Default
States captured: Default, Hover, Focus, Active, Open
Tokens used: blue-ink (color), radius 8px (border-radius), space-12 (padding-right), space-12 (padding-left), label (font)
Checks: 2 of 2
- Contrast AA · pass · 16.5:1 on gray-50
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<button type="button" class="dropdown-trigger" aria-haspopup="menu" aria-expanded="false" aria-controls="dse-resources-menu">Resources <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 115.41px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 115.41px !important; height: 44px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
button { font: inherit; color: inherit; }
.dropdown-trigger { display: inline-flex; align-items: center; gap: 4px; height: 44px; padding: 0 12px; border: 0; border-radius: 8px; background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: #0B1F3A; cursor: pointer; }
svg { display: block; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Menu button

Button · 1 variant: Default
States captured: Default, Hover, Focus, Active, Open
Tokens used: radius 8px (border-radius)
Checks: 3 of 3
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 44 × 44 at 390 px
- Label present · pass · aria-label

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<button type="button" class="menu-button" aria-label="Open menu" aria-expanded="false" aria-controls="dse-mobile-menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"></path></svg></button>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 44px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 44px !important; height: 44px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
button { font: inherit; color: inherit; }
.menu-button { display: none; align-items: center; justify-content: center; width: 44px; height: 44px; border: 0; border-radius: 8px; background: transparent; color: #0B1F3A; cursor: pointer; }
.menu-button { display: inline-flex; }
svg { display: block; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Tab

Button · 1 variant: Default
States captured: Default, Hover, Focus, Active, Selected
Tokens used: blue-600 (color), space-16 (padding-right), space-16 (padding-left), label (font)
Checks: 3 of 3
- Contrast AA · pass · 5.8:1 on gray-50
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 69 × 44 at 390 px

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<button type="button" class="tab" role="tab" id="dse-tab-digest" aria-selected="true" aria-controls="dse-panel-digest">Digests</button>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 83.03px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 83.03px !important; height: 44px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
button { font: inherit; color: inherit; }
.tab { height: 44px; padding: 0 16px; border: 0; border-bottom: 2px solid transparent; background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: #0B1F3A; cursor: pointer; }
.tab[aria-selected='true'] { color: #2458E6; border-bottom-color: #2458E6; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Icon button

Button · 1 variant: Default
States captured: Default, Hover, Focus, Active
Tokens used: gray-50 (background-color), gray-200 (border-color), radius 8px (border-radius)
Checks: 2 of 3
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 44 × 44 at 390 px
- Label present · fail · No name found

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<button type="button" class="icon-button"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg></button>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 14px; color: rgb(11, 31, 58); line-height: 22px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 44px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 44px !important; height: 44px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
button { font: inherit; color: inherit; }
.icon-button { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 1px solid #E2E8F0; border-radius: 8px; background: #FFFFFF; color: #0B1F3A; cursor: pointer; }
svg { display: block; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Text input

Text input · 1 variant: Default
States captured: Default, Hover, Focus, Active, Error
Tokens used: gray-50 (background-color), gray-200 (border-color), radius 8px (border-radius), space-8 (padding-top), space-12 (padding-right), space-8 (padding-bottom), space-12 (padding-left)
Checks: 3 of 3
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 342 × 44 at 390 px
- Label present · pass · Label element

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<input class="input" id="dse-login-email" type="email" autocomplete="email" style="">
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 480px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 480px !important; height: 44px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
input { font: inherit; color: inherit; }
.input { width: 100%; height: 44px; padding: 8px 12px; border: 1px solid #E2E8F0; border-radius: 8px; background: #FFFFFF; color: #0B1F3A; font-size: 16px; line-height: 26px; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Toggle

Toggle · 1 variant: Default
States captured: Default, Hover, Focus, Active
Tokens used: none
Checks: 3 of 3
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 52 × 44 at 390 px
- Label present · pass · aria-label

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<button type="button" class="toggle" role="switch" aria-checked="false" aria-label="Bill yearly"></button>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 14px; color: rgb(11, 31, 58); line-height: 22px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 52px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 52px !important; height: 44px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
button { font: inherit; color: inherit; }
.toggle { position: relative; flex: none; width: 52px; height: 44px; border: 0; background: transparent; cursor: pointer; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.toggle::before { content: ''; position: absolute; left: 4px; top: 10px; width: 44px; height: 24px; border-radius: 999px; background: #E2E8F0; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.toggle::after { content: ''; position: absolute; left: 8px; top: 14px; width: 16px; height: 16px; border-radius: 999px; background: #FFFFFF; transition: transform 160ms ease; }
```

### Select

Select · 1 variant: Default
States captured: Default, Hover, Focus, Active
Tokens used: gray-50 (background-color), blue-ink (color), gray-200 (border-color), radius 8px (border-radius), space-8 (padding-top), space-40 (padding-right), space-8 (padding-bottom), space-12 (padding-left), body (font)
Checks: 3 of 3
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 342 × 44 at 390 px
- Label present · pass · Label element

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<select class="select" id="dse-team" name="team"><option>1 to 5</option><option>6 to 20</option><option>21 or more</option></select>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 480px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 480px !important; height: 44px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
select { font: inherit; color: inherit; }
.select { width: 100%; height: 44px; padding: 8px 12px; border: 1px solid #E2E8F0; border-radius: 8px; background: #FFFFFF; color: #0B1F3A; font-size: 16px; line-height: 26px; }
.select { appearance: none; padding-right: 40px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230B1F3A' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Checkbox

Checkbox · 1 variant: Default
States captured: Default, Hover, Focus, Active
Tokens used: radius 8px (border-radius)
Checks: 3 of 3
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 44 × 44 at 390 px
- Label present · pass · Label element

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<input class="checkbox" id="dse-updates" type="checkbox" style="">
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 14px; color: rgb(11, 31, 58); line-height: 22px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 44px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 44px !important; height: 44px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
input { font: inherit; color: inherit; }
.checkbox { appearance: none; flex: none; width: 44px; height: 44px; margin: 0 -12px; border: 0; border-radius: 8px; background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect x='0.5' y='0.5' width='19' height='19' rx='3.5' fill='%23FFFFFF' stroke='%230B1F3A'/%3E%3C/svg%3E") center no-repeat; cursor: pointer; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Textarea

Textarea · 1 variant: Default
States captured: Default, Hover, Focus, Active
Tokens used: gray-50 (background-color), gray-200 (border-color), radius 8px (border-radius), space-8 (padding-top), space-12 (padding-right), space-8 (padding-bottom), space-12 (padding-left)
Checks: 3 of 3
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 342 × 128 at 390 px
- Label present · pass · Label element

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<textarea class="textarea" id="dse-contact-message" name="message" style=""></textarea>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 480px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 480px !important; height: 128px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
textarea { font: inherit; color: inherit; }
.textarea { width: 100%; height: 44px; padding: 8px 12px; border: 1px solid #E2E8F0; border-radius: 8px; background: #FFFFFF; color: #0B1F3A; font-size: 16px; line-height: 26px; }
.textarea { height: 128px; resize: vertical; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Site header

Header · 1 variant: Default
States captured: Default, Scrolled
Tokens used: gray-50 (background-color), blue-ink (color), body (font)
Checks: 1 of 1
- Contrast AA · pass · 16.5:1 on gray-50

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<header class="site-header" data-header="">
  <div class="container">
    <div class="header-inner">
      <a class="logo" href="#">Tidewater</a>
      <nav class="nav-links" aria-label="Main">
        <a class="nav-link" href="#">Product</a>
        <a class="nav-link" href="#">Pricing</a>
        <a class="nav-link" href="#">Docs</a>
        <a class="nav-link" href="#">Contact</a>
        <div class="dropdown" data-dropdown="">
          <button type="button" class="dropdown-trigger" aria-haspopup="menu" aria-expanded="false" aria-controls="dse-resources-menu">Resources <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button>
          <div class="dropdown-menu" id="dse-resources-menu" role="menu" hidden="">
            <a class="menu-item" role="menuitem" href="#">Guides</a>
            <a class="menu-item" role="menuitem" href="#">API reference</a>
            <a class="menu-item" role="menuitem" href="#">Support</a>
          </div>
        </div>
      </nav>
      <div class="header-actions">
        <a class="btn btn-ghost" href="#">Sign in</a>
        <a class="btn btn-primary" href="#">Start free</a>
      </div>
      <button type="button" class="menu-button" aria-label="Open menu" aria-expanded="false" aria-controls="dse-mobile-menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"></path></svg></button>
    </div>
    <nav class="mobile-menu" id="dse-mobile-menu" aria-label="Mobile" hidden="">
      <a class="mobile-link" href="#">Product</a>
      <a class="mobile-link" href="#">Pricing</a>
      <a class="mobile-link" href="#">Docs</a>
      <a class="mobile-link" href="#">Contact</a>
      <a class="mobile-link" href="#">Sign in</a>
    </nav>
  </div>
</header>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 1440px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 1440px !important; height: 73px !important; flex: none !important; position: relative !important; inset: auto !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.site-header { position: relative; top: 0; z-index: 10; background: #FFFFFF; border-bottom: 1px solid #E2E8F0; transition: box-shadow 160ms ease; }
.container { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
.header-inner { display: flex; align-items: center; justify-content: space-between; gap: 32px; height: 72px; }
a { color: #2458E6; text-decoration: none; }
.logo { font-size: 20px; line-height: 28px; font-weight: 600; color: #0B1F3A; }
.nav-links { display: flex; align-items: center; gap: 24px; }
.nav-link { font-size: 14px; line-height: 20px; font-weight: 600; color: #0B1F3A; }
.dropdown { position: relative; }
button { font: inherit; color: inherit; }
.dropdown-trigger { display: inline-flex; align-items: center; gap: 4px; height: 44px; padding: 0 12px; border: 0; border-radius: 8px; background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: #0B1F3A; cursor: pointer; }
svg { display: block; }
.dropdown-menu { position: absolute; top: 48px; left: 0; z-index: 20; min-width: 224px; padding: 8px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; box-shadow: 0 12px 32px rgba(11, 31, 58, 0.12); }
.header-actions { display: flex; align-items: center; gap: 12px; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 44px; padding: 0 20px; border: 1px solid transparent; border-radius: 8px; font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color 160ms ease, color 160ms ease; }
.btn-ghost { background: transparent; color: #0B1F3A; }
.btn-primary { background: #2458E6; color: #FFFFFF; }
.menu-button { display: none; align-items: center; justify-content: center; width: 44px; height: 44px; border: 0; border-radius: 8px; background: transparent; color: #0B1F3A; cursor: pointer; }
.mobile-menu { border-top: 1px solid #E2E8F0; padding: 8px 0 16px; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Site footer

Footer · 1 variant: Default
States captured: Default
Tokens used: blue-ink (color), gray-200 (border-color), space-48 (padding-top), space-48 (padding-bottom), body (font)
Checks: 1 of 1
- Contrast AA · pass · 16.5:1 on gray-50

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<footer class="site-footer">
  <div class="container">
    <div class="footer-inner">
      <div class="stack">
        <span class="logo">Tidewater</span>
        <p class="caption">Calm release notes for busy teams.</p>
      </div>
      <nav class="footer-links" aria-label="Footer">
        <a class="footer-link" href="#">Product</a>
        <a class="footer-link" href="#">Pricing</a>
        <a class="footer-link" href="#">Docs</a>
        <a class="footer-link" href="#">Contact</a>
      </nav>
      
    </div>
  </div>
</footer>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 1440px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 1440px !important; height: 157px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.site-footer { border-top: 1px solid #E2E8F0; padding: 48px 0; }
.container { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
.footer-inner { display: flex; justify-content: space-between; gap: 32px; flex-wrap: wrap; }
.stack { display: flex; flex-direction: column; gap: 16px; }
.logo { font-size: 20px; line-height: 28px; font-weight: 600; color: #0B1F3A; }
p { font-size: 16px; line-height: 26px; }
.caption { font-size: 12px; line-height: 16px; }
.footer-links { display: flex; gap: 24px; flex-wrap: wrap; }
a { color: #2458E6; text-decoration: none; }
.footer-link { font-size: 14px; line-height: 22px; color: #0B1F3A; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Footer links

Nav bar · 1 variant: Default
States captured: Default
Tokens used: blue-ink (color), body (font)
Checks: 1 of 1
- Contrast AA · pass · 16.5:1 on gray-50

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<nav class="footer-links" aria-label="Footer">
        <a class="footer-link" href="#">Product</a>
        <a class="footer-link" href="#">Pricing</a>
        <a class="footer-link" href="#">Docs</a>
        <a class="footer-link" href="#">Contact</a>
      </nav>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 255.69px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 255.69px !important; height: 60px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.footer-links { display: flex; gap: 24px; flex-wrap: wrap; }
a { color: #2458E6; text-decoration: none; }
.footer-link { font-size: 14px; line-height: 22px; color: #0B1F3A; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Main navigation

Nav bar · 1 variant: Default
States captured: Default
Tokens used: blue-ink (color), body (font)
Checks: 1 of 1
- Contrast AA · pass · 16.5:1 on gray-50

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<nav class="nav-links" aria-label="Main">
        <a class="nav-link" href="#">Product</a>
        <a class="nav-link" href="#">Pricing</a>
        <a class="nav-link" href="#">Docs</a>
        <a class="nav-link" href="#">Contact</a>
        <div class="dropdown" data-dropdown="">
          <button type="button" class="dropdown-trigger" aria-haspopup="menu" aria-expanded="false" aria-controls="dse-resources-menu">Resources <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button>
          <div class="dropdown-menu" id="dse-resources-menu" role="menu" hidden="">
            <a class="menu-item" role="menuitem" href="#">Guides</a>
            <a class="menu-item" role="menuitem" href="#">API reference</a>
            <a class="menu-item" role="menuitem" href="#">Support</a>
          </div>
        </div>
      </nav>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 400.16px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 400.16px !important; height: 44px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.nav-links { display: flex; align-items: center; gap: 24px; }
a { color: #2458E6; text-decoration: none; }
.nav-link { font-size: 14px; line-height: 20px; font-weight: 600; color: #0B1F3A; }
.dropdown { position: relative; }
button { font: inherit; color: inherit; }
.dropdown-trigger { display: inline-flex; align-items: center; gap: 4px; height: 44px; padding: 0 12px; border: 0; border-radius: 8px; background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: #0B1F3A; cursor: pointer; }
svg { display: block; }
.dropdown-menu { position: absolute; top: 48px; left: 0; z-index: 20; min-width: 224px; padding: 8px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; box-shadow: 0 12px 32px rgba(11, 31, 58, 0.12); }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Breadcrumb

Breadcrumb · 1 variant: Default
States captured: Default
Tokens used: blue-ink (color), body (font)
Checks: 1 of 1
- Contrast AA · pass · 5.8:1 on gray-50

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<nav aria-label="Breadcrumb"><ol class="breadcrumb"><li><a class="crumb" href="#">Home</a></li><li aria-hidden="true">/</li><li class="crumb-current" aria-current="page">Docs</li></ol></nav>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 1072px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 1072px !important; height: 22px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
ol { list-style: none; }
.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 14px; line-height: 22px; }
a { color: #2458E6; text-decoration: none; }
.crumb { color: #2458E6; }
.crumb-current { color: #0B1F3A; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Tabs

Tabs · 1 variant: Default
States captured: Default
Tokens used: blue-ink (color), body (font)
Checks: 0 of 0

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<div class="tabs" role="tablist" aria-label="Channels">
    <button type="button" class="tab" role="tab" id="dse-tab-digest" aria-selected="true" aria-controls="dse-panel-digest">Digests</button>
    <button type="button" class="tab" role="tab" id="dse-tab-slack" aria-selected="false" aria-controls="dse-panel-slack">Slack</button>
    <button type="button" class="tab" role="tab" id="dse-tab-pages" aria-selected="false" aria-controls="dse-panel-pages">Pages</button>
  </div>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 1072px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 1072px !important; height: 45px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.tabs { display: flex; gap: 4px; border-bottom: 1px solid #E2E8F0; }
button { font: inherit; color: inherit; }
.tab { height: 44px; padding: 0 16px; border: 0; border-bottom: 2px solid transparent; background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: #0B1F3A; cursor: pointer; }
.tab[aria-selected='true'] { color: #2458E6; border-bottom-color: #2458E6; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Feature card

Card · 1 variant: Default
States captured: Default
Tokens used: gray-50 (background-color), blue-ink (color), gray-200 (border-color), radius 12px (border-radius), space-24 (padding-top), space-24 (padding-right), space-24 (padding-bottom), space-24 (padding-left), body (font), shadow-sm (box-shadow)
Checks: 1 of 1
- Contrast AA · pass · 16.5:1 on gray-50

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<article class="card">
    <span class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9z"></path></svg></span>
    <span class="tag-new">New</span>
    <h3>Weekly digests</h3>
    <p class="text-sm">One email every Friday with what shipped, grouped by team.</p>
  </article>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 341.33px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 341.33px !important; height: 206px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.card { display: flex; flex-direction: column; gap: 12px; padding: 24px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; box-shadow: 0 1px 2px rgba(11, 31, 58, 0.12); }
.feature-icon { width: 24px; height: 24px; color: #0F8A8A; }
svg { display: block; }
.tag-new { display: inline-flex; align-items: center; align-self: flex-start; height: 24px; padding: 0 8px; border-radius: 999px; background: #0F8A8A; color: #FFFFFF; font-size: 12px; line-height: 16px; }
h3 { font-size: 20px; line-height: 28px; font-weight: 600; }
p { font-size: 16px; line-height: 26px; }
.text-sm { font-size: 14px; line-height: 22px; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Pricing card

Card · 2 variants: Primary, Secondary
States captured: Default
Tokens used: gray-50 (background-color), blue-ink (color), gray-200 (border-color), radius 12px (border-radius), space-32 (padding-top), space-32 (padding-right), space-32 (padding-bottom), space-32 (padding-left), body (font), shadow-sm (box-shadow)
Checks: 1 of 1
- Contrast AA · pass · 16.5:1 on gray-50

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<article class="card pricing-card">
        <h3>Starter</h3>
        <p class="price">$0</p>
        <ul class="plan-features">
          <li class="text-sm">One public changelog</li>
          <li class="text-sm">Weekly digest</li>
          <li class="text-sm">Three integrations</li>
        </ul>
        <a class="btn btn-secondary" href="#">Start free</a>
      </article>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 524px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 524px !important; height: 324px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.card { display: flex; flex-direction: column; gap: 12px; padding: 24px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; box-shadow: 0 1px 2px rgba(11, 31, 58, 0.12); }
.pricing-card { padding: 32px; gap: 16px; }
h3 { font-size: 20px; line-height: 28px; font-weight: 600; }
p { font-size: 16px; line-height: 26px; }
.price { font-size: 48px; line-height: 56px; font-weight: 700; }
ul { list-style: none; }
.plan-features { display: flex; flex-direction: column; gap: 8px; }
.text-sm { font-size: 14px; line-height: 22px; }
a { color: #2458E6; text-decoration: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 44px; padding: 0 20px; border: 1px solid transparent; border-radius: 8px; font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color 160ms ease, color 160ms ease; }
.btn-secondary { background: #FFFFFF; color: #2458E6; border-color: #2458E6; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Status badge

Badge · 3 variants: Warning, Success, Danger
States captured: Default
Tokens used: success (background-color), gray-50 (color), radius-pill (border-radius), space-8 (padding-right), space-8 (padding-left), caption (font)
Checks: 1 of 1
- Contrast AA · pass · 5.0:1 on success

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<span class="badge badge-success">API operational</span>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 102.11px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 102.11px !important; height: 24px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.badge { display: inline-flex; align-items: center; height: 24px; padding: 0 8px; border-radius: 999px; color: #FFFFFF; font-size: 12px; line-height: 16px; }
.badge-success { background: #15803D; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Inline alert

Alert · 2 variants: Warning, Success
States captured: Default
Tokens used: gray-50 (background-color), blue-ink (color), success (border-color), radius 8px (border-radius), space-16 (padding-top), space-16 (padding-right), space-16 (padding-bottom), space-16 (padding-left), body (font)
Checks: 1 of 1
- Contrast AA · pass · 16.5:1 on gray-50

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<div class="alert alert-success" role="status">
    <span class="alert-icon alert-icon-success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="m8 12 3 3 5-6"></path></svg></span>
    <div class="stack">
      <p>Digests are included in every plan.</p>
      <div class="hero-actions"><a class="btn btn-primary btn-sm" href="#">Compare plans</a></div>
    </div>
  </div>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 1072px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 1072px !important; height: 112px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.alert { display: flex; align-items: flex-start; gap: 12px; padding: 16px; border: 1px solid #15803D; border-radius: 8px; background: #FFFFFF; color: #0B1F3A; }
.alert-icon { flex: none; width: 24px; height: 24px; }
.alert-icon-success { color: #15803D; }
svg { display: block; }
.stack { display: flex; flex-direction: column; gap: 16px; }
p { font-size: 16px; line-height: 26px; }
.hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
a { color: #2458E6; text-decoration: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 44px; padding: 0 20px; border: 1px solid transparent; border-radius: 8px; font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color 160ms ease, color 160ms ease; }
.btn-sm { height: 36px; padding: 0 16px; }
.btn-primary { background: #2458E6; color: #FFFFFF; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### New tag

Tag · 1 variant: Default
States captured: Default
Tokens used: teal-500 (background-color), gray-50 (color), radius-pill (border-radius), space-8 (padding-right), space-8 (padding-left), caption (font)
Checks: 0 of 1
- Contrast AA · fail · 4.1:1 on teal-500, needs 4.5:1

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<span class="tag-new">New</span>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 41.64px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 41.64px !important; height: 24px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.tag-new { display: inline-flex; align-items: center; align-self: flex-start; height: 24px; padding: 0 8px; border-radius: 999px; background: #0F8A8A; color: #FFFFFF; font-size: 12px; line-height: 16px; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Not found state

Empty state · 1 variant: Default
States captured: Default
Tokens used: blue-ink (color), gray-200 (border-color), radius 12px (border-radius), space-96 (padding-top), space-24 (padding-right), space-96 (padding-bottom), space-24 (padding-left), body (font)
Checks: 1 of 1
- Contrast AA · pass · 16.5:1 on gray-50

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<section class="empty-state">
    <span class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span>
    <h1>This page is not here.</h1>
    <p>It may have moved when the docs were reorganized.</p>
    <a class="btn btn-ghost" href="#">Back to home</a>
  </section>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 1072px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 1072px !important; height: 404px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 96px 24px; border: 1px solid #E2E8F0; border-radius: 12px; text-align: center; }
.empty-icon { width: 48px; height: 48px; color: #0F8A8A; }
svg { display: block; }
h1 { font-size: 36px; line-height: 44px; font-weight: 700; }
p { font-size: 16px; line-height: 26px; }
a { color: #2458E6; text-decoration: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 44px; padding: 0 20px; border: 1px solid transparent; border-radius: 8px; font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color 160ms ease, color 160ms ease; }
.btn-ghost { background: transparent; color: #0B1F3A; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Plan comparison table

Table · 1 variant: Default
States captured: Default
Tokens used: blue-ink (color), body-sm (font)
Checks: 1 of 1
- Contrast AA · pass · 16.5:1 on gray-50

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<table class="table">
        <thead><tr><th class="th">Feature</th><th class="th">Starter</th><th class="th">Team</th></tr></thead>
        <tbody>
          <tr><td class="td">Changelogs</td><td class="td">1</td><td class="td">Unlimited</td></tr>
          <tr><td class="td">Digests</td><td class="td">Weekly</td><td class="td">Daily or weekly</td></tr>
          <tr><td class="td">Custom domain</td><td class="td">No</td><td class="td">Yes</td></tr>
        </tbody>
      </table>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 1072px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 1072px !important; height: 186px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.table { width: 100%; border-collapse: collapse; font-size: 14px; line-height: 22px; }
.th { padding: 12px 16px; border-bottom: 1px solid #E2E8F0; text-align: left; font-size: 14px; line-height: 20px; font-weight: 600; }
.td { padding: 12px 16px; border-bottom: 1px solid #E2E8F0; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Code block

Code block · 1 variant: Default
States captured: Default
Tokens used: blue-ink (background-color), gray-50 (color), radius 8px (border-radius), space-16 (padding-top), space-24 (padding-right), space-16 (padding-bottom), space-24 (padding-left), code (font)
Checks: 1 of 1
- Contrast AA · pass · 16.5:1 on blue-ink

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<pre class="code-block"><code>npm install @tidewater/cli
tidewater login
tidewater publish</code></pre>
```

```css
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 1072px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 1072px !important; height: 98px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.code-block { padding: 16px 24px; border-radius: 8px; background: #0B1F3A; color: #FFFFFF; font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace; font-size: 14px; line-height: 22px; overflow-x: auto; }
pre code { font: inherit; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Resources dropdown

Dropdown · 1 variant: Default
States captured: Default
Tokens used: gray-50 (background-color), blue-ink (color), gray-200 (border-color), radius 12px (border-radius), space-8 (padding-top), space-8 (padding-right), space-8 (padding-bottom), space-8 (padding-left), body (font), shadow-md (box-shadow)
Checks: 1 of 1
- Contrast AA · pass · 16.5:1 on gray-50

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<div class="dropdown-menu" id="dse-resources-menu" role="menu">
            <a class="menu-item" role="menuitem" href="#">Guides</a>
            <a class="menu-item" role="menuitem" href="#">API reference</a>
            <a class="menu-item" role="menuitem" href="#">Support</a>
          </div>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 224px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 224px !important; height: 150px !important; flex: none !important; position: relative !important; inset: auto !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.dropdown-menu { position: absolute; top: 48px; left: 0; z-index: 20; min-width: 224px; padding: 8px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; box-shadow: 0 12px 32px rgba(11, 31, 58, 0.12); }
a { color: #2458E6; text-decoration: none; }
.menu-item { display: flex; align-items: center; height: 44px; padding: 0 12px; border-radius: 8px; font-size: 14px; line-height: 22px; color: #0B1F3A; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Mobile menu

Dropdown · 1 variant: Default
States captured: Default
Tokens used: blue-ink (color), gray-200 (border-color), space-8 (padding-top), space-16 (padding-bottom), body (font)
Checks: 1 of 1
- Contrast AA · pass · 16.5:1 on gray-50

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<nav class="mobile-menu" id="dse-mobile-menu" aria-label="Mobile">
      <a class="mobile-link" href="#">Product</a>
      <a class="mobile-link" href="#">Pricing</a>
      <a class="mobile-link" href="#">Docs</a>
      <a class="mobile-link" href="#">Contact</a>
      <a class="mobile-link" href="#">Sign in</a>
    </nav>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 342px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 342px !important; height: 265px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.mobile-menu { border-top: 1px solid #E2E8F0; padding: 8px 0 16px; }
a { color: #2458E6; text-decoration: none; }
.mobile-link { display: flex; align-items: center; height: 48px; font-size: 16px; line-height: 26px; color: #0B1F3A; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

### Avatar

Avatar · 1 variant: Default
States captured: Default
Tokens used: gray-200 (background-color), radius-pill (border-radius)
Checks: 0 of 0

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<span aria-hidden="true" style="display: inline-block; width: 40px; height: 40px; border-radius: 50%; background: rgb(215, 221, 229); vertical-align: middle" class="avatar"></span>
```

```css
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/289a0d23bcb06db4.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/dca72278fc2677ee.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/f1d00656d90b0a8b.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: block; }
@font-face { font-family: 'Inter'; src: url('http://localhost:4400/clean/runs/evalclean0/fonts/800be82f324a7281.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: block; }
.dse-root { font-family: Inter, system-ui, sans-serif; font-size: 16px; color: rgb(11, 31, 58); line-height: 26px; letter-spacing: normal; display: flex; flex-direction: column; align-items: flex-start; width: 40px; background: rgb(255, 255, 255); }
.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: 40px !important; height: 40px !important; flex: none !important; }
* { box-sizing: border-box; margin: 0; padding: 0; }
* { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
.avatar { width: 40px; height: 40px; border-radius: 50%; background: #E2E8F0; }
*::before { box-sizing: border-box; margin: 0; padding: 0; }
*::before { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
*::after { box-sizing: border-box; margin: 0; padding: 0; }
*::after { animation: none !important !important; transition: none !important !important; caret-color: transparent !important !important; }
```

## Drift

Nothing to collapse. 9 colors, 11 spacing steps, all on the grid.

Proposed set: 9 colors, 11 spacing steps, 9 type styles. Every proposed pair keeps or improves its contrast ratio on the surfaces it is used on.

Nothing drifts here. The system holds nine colors, nine type styles and 11 spacing steps, and all 11 steps sit on the grid. No colors sit near a neighbor, no type styles overlap and no component variants collapse. The proposed set matches what is already there, with two grays, 11 spacing steps and nine type styles. Every pair of text and background keeps its contrast ratio.

## How this was made

Extracted by Design System Extractor from localhost:4100 in run evalclean0 on 2026-10-12. Tokens, components and checks are measured from the rendered pages. The introduction and the drift narrative were written by a model from those measurements. Tokens shown are the proposed set.
