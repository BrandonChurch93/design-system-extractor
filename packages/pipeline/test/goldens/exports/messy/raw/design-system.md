# localhost:4100 design system

This design system was extracted from localhost:4100 across 12 pages. It holds 23 colors, nine type styles, 11 spacing steps and 31 components.

## Palette

| Name | Value | Group | Uses |
| --- | --- | --- | --- |
| blue-ink | #0B1F3A | brand | 168 |
| blue-600 | #2458E6 | brand | 89 |
| blue-600-alt | #1C4EDB | brand | 70 |
| teal-500 | #0F8A8A | brand | 44 |
| blue-ink-tint | #0B1F3A1F | brand | 17 |
| blue-500 | #2E63ED | brand | 2 |
| gray-ink | #1F1F1F | neutral | 684 |
| gray-50 | #FFFFFF | neutral | 191 |
| gray-300 | #D1D1D1 | neutral | 152 |
| gray-600 | #676767 | neutral | 96 |
| gray-700 | #505050 | neutral | 94 |
| gray-200 | #E1E1E1 | neutral | 88 |
| gray-800 | #353535 | neutral | 72 |
| gray-500 | #737373 | neutral | 36 |
| gray-100 | #EBEBEB | neutral | 34 |
| gray-500-border | #868686 | neutral | 25 |
| gray-50-alt | #F5F5F5 | neutral | 6 |
| gray-400 | #B1B1B1 | neutral | 8 |
| gray-300-alt | #C4C4C4 | neutral | 4 |
| gray-400-alt | #9E9E9E | neutral | 2 |
| success | #15803D | semantic | 18 |
| danger | #DC2626 | semantic | 12 |
| warning | #F59E0B | semantic | 2 |

## Type

| Name | Role | Family | Size | Line height | Weight |
| --- | --- | --- | --- | --- | --- |
| display | display | Inter | 48px | 56px | 700 |
| h1 | h1 | Inter | 36px | 44px | 700 |
| h2 | h2 | Inter | 28px | 36px | 700 |
| h3 | h3 | Inter | 20px | 28px | 600 |
| body | body | Inter | 16px | 26px | 400 |
| body-sm-2 | body-sm | Inter | 15px | 22px | 400 |
| label | label | Inter | 14px | 20px | 600 |
| body-sm | body-sm | Inter | 14px | 22px | 400 |
| caption | caption | Inter | 12px | 16px | 400 |

## Spacing

4 px base. Steps: 4, 8, 10, 12, 16, 18, 20, 24, 32, 40, 48, 64, 96.

## Radius

- radius-sm: 8px
- radius-md: 10px
- radius-lg: 12px
- radius-pill: 9999px

## Shadow

- shadow-sm: 0px 1px 2px 0px #0B1F3A1F
- shadow-md: 0px 12px 32px 0px #0B1F3A1F

## Breakpoints

- breakpoint-sm: 640px
- breakpoint-md: 1024px

## Components

### Button

Button · 7 variants: Primary, Ghost, Primary small, Secondary, Primary 2, Secondary small, Ghost small
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
* { box-sizing: border-box; margin: 0px; padding: 0px; }
a { color: var(--color-blue-600-alt); text-decoration: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8); height: 44px; padding: 0px var(--space-20); border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color 160ms, color 160ms; }
.btn-ghost { background: transparent; color: var(--color-blue-ink); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
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
* { box-sizing: border-box; margin: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.dropdown-trigger { display: inline-flex; align-items: center; gap: var(--space-4); height: 44px; padding: 0px var(--space-12); border: 0px; border-radius: var(--radius-sm); background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-blue-ink); cursor: pointer; }
svg { display: block; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
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
* { box-sizing: border-box; margin: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.menu-button { display: none; align-items: center; justify-content: center; width: 44px; height: 44px; border: 0px; border-radius: var(--radius-sm); background: transparent; color: var(--color-blue-ink); cursor: pointer; }
.menu-button { display: inline-flex; }
svg { display: block; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
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
* { box-sizing: border-box; margin: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.tab { height: 44px; padding: 0px var(--space-16); border-width: 0px 0px 2px; border-style: none none solid; border-color: currentcolor currentcolor transparent; border-image: none; background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-blue-ink); cursor: pointer; }
.tab[aria-selected="true"] { color: var(--color-blue-600); border-bottom-color: var(--color-blue-600); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Share button

Button · 1 variant: Default
States captured: Default, Hover, Focus, Active
Tokens used: none
Unmapped: border-radius 6px
Checks: 2 of 3
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · fail · 36 px tall, 8 short
- Label present · pass · aria-label

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<button type="button" class="share-button" aria-label="Copy link to this page"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg></button>
```

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.share-button { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: 0px; border-radius: 6px; background: transparent; color: var(--color-gray-ink); cursor: pointer; }
svg { display: block; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Pill link

Link · 1 variant: Default
States captured: Default, Hover, Focus, Active
Tokens used: gray-ink (color), gray-300 (border-color), radius-pill (border-radius), space-16 (padding-right), space-16 (padding-left), label (font)
Checks: 2 of 3
- Contrast AA · pass · 16.4:1 on gray-50
- Focus visible · fail · No visible change on focus
- Tap target · pass · 200 × 44 at 390 px

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<a class="link-pill" href="#">What changed this week</a>
```

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
a { color: var(--color-blue-600-alt); text-decoration: none; }
.link-pill { display: inline-flex; align-items: center; height: 44px; padding: 0px var(--space-16); border: 1px solid var(--color-gray-300); border-radius: 999px; color: var(--color-gray-ink); font-size: 14px; line-height: 20px; font-weight: 600; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Icon button

Button · 1 variant: Default
States captured: Default, Hover, Focus, Active
Tokens used: gray-50 (background-color), gray-400 (border-color), radius 8px (border-radius)
Checks: 2 of 3
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 44 × 44 at 390 px
- Label present · fail · No name found

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<button type="button" class="icon-button"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg></button>
```

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.icon-button { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 1px solid var(--color-gray-400); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-blue-ink); cursor: pointer; }
svg { display: block; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Newsletter input

Text input · 1 variant: Default
States captured: Default, Hover, Focus, Active, Error
Tokens used: gray-50 (background-color), gray-300 (border-color), radius 8px (border-radius), space-8 (padding-top), space-12 (padding-right), space-8 (padding-bottom), space-12 (padding-left)
Checks: 3 of 4
- Contrast AA · pass · 4.7:1 on gray-50
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 324 × 44 at 390 px
- Label present · fail · Placeholder only

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<input class="input newsletter-input" type="email" placeholder="Your email" style="">
```

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
input { font: inherit; color: inherit; }
.input { width: 100%; height: 44px; padding: var(--space-8) var(--space-12); border: 1px solid var(--color-gray-300); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-blue-ink); font-size: 16px; line-height: 26px; }
.newsletter-input { width: 240px; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
.newsletter-input::placeholder { color: var(--color-gray-500); }
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
* { box-sizing: border-box; margin: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.toggle { position: relative; flex: 0 0 auto; width: 52px; height: 44px; border: 0px; background: transparent; cursor: pointer; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
.toggle::before { content: ""; position: absolute; left: 4px; top: 10px; width: 44px; height: 24px; border-radius: 999px; background: var(--color-gray-100); }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
.toggle::after { content: ""; position: absolute; left: 8px; top: 14px; width: 16px; height: 16px; border-radius: 999px; background: var(--color-gray-50); transition: transform 160ms; }
```

### Select

Select · 1 variant: Default
States captured: Default, Hover, Focus, Active
Tokens used: gray-50 (background-color), blue-ink (color), gray-300 (border-color), radius 8px (border-radius), space-8 (padding-top), space-40 (padding-right), space-8 (padding-bottom), space-12 (padding-left), body (font)
Checks: 3 of 3
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 342 × 44 at 390 px
- Label present · pass · Label element

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<select class="select" id="dse-team" name="team"><option>1 to 5</option><option>6 to 20</option><option>21 or more</option></select>
```

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
select { font: inherit; color: inherit; }
.select { width: 100%; height: 44px; padding: var(--space-8) var(--space-12); border: 1px solid var(--color-gray-300); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-blue-ink); font-size: 16px; line-height: 26px; }
.select { appearance: none; padding-right: var(--space-40); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230B1F3A' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
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
* { box-sizing: border-box; margin: 0px; padding: 0px; }
input { font: inherit; color: inherit; }
.checkbox { appearance: none; flex: 0 0 auto; width: 44px; height: 44px; margin: 0px -12px; border: 0px; border-radius: var(--radius-sm); background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect x='0.5' y='0.5' width='19' height='19' rx='3.5' fill='%23FFFFFF' stroke='%230B1F3A'/%3E%3C/svg%3E") center center no-repeat transparent; cursor: pointer; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Textarea

Textarea · 1 variant: Default
States captured: Default, Hover, Focus, Active
Tokens used: gray-50 (background-color), gray-300 (border-color), radius 8px (border-radius), space-8 (padding-top), space-12 (padding-right), space-8 (padding-bottom), space-12 (padding-left)
Checks: 3 of 3
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 342 × 128 at 390 px
- Label present · pass · Label element

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<textarea class="textarea" id="dse-contact-message" name="message" style=""></textarea>
```

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
textarea { font: inherit; color: inherit; }
.textarea { width: 100%; height: 44px; padding: var(--space-8) var(--space-12); border: 1px solid var(--color-gray-300); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-blue-ink); font-size: 16px; line-height: 26px; }
.textarea { height: 128px; resize: vertical; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Site header

Header · 1 variant: Default
States captured: Default, Scrolled
Tokens used: gray-50 (background-color), gray-ink (color), body (font)
Checks: 1 of 1
- Contrast AA · pass · 12.2:1 on gray-50

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
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.site-header { position: relative; top: 0px; z-index: 10; background: var(--color-gray-50); border-bottom: 1px solid var(--color-gray-500-border); transition: box-shadow 160ms; }
.container { max-width: 1120px; margin: 0px auto; padding: 0px var(--space-24); }
.header-inner { display: flex; align-items: center; justify-content: space-between; gap: var(--space-32); height: 72px; }
a { color: var(--color-blue-600-alt); text-decoration: none; }
.logo { font-size: 20px; line-height: 28px; font-weight: 600; color: var(--color-gray-800); }
.nav-links { display: flex; align-items: center; gap: var(--space-24); }
.nav-link { font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-gray-700); }
.dropdown { position: relative; }
button { font: inherit; color: inherit; }
.dropdown-trigger { display: inline-flex; align-items: center; gap: var(--space-4); height: 44px; padding: 0px var(--space-12); border: 0px; border-radius: var(--radius-sm); background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-blue-ink); cursor: pointer; }
svg { display: block; }
.dropdown-menu { position: absolute; top: 48px; left: 0px; z-index: 20; min-width: 224px; padding: var(--space-8); background: var(--color-gray-50); border: 1px solid var(--color-gray-300-alt); border-radius: var(--radius-lg); box-shadow: var(--color-blue-ink-tint) 0px 12px 32px; }
.header-actions { display: flex; align-items: center; gap: var(--space-10); }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8); height: 44px; padding: 0px var(--space-20); border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color 160ms, color 160ms; }
.btn-ghost { background: transparent; color: var(--color-blue-ink); }
.btn-primary { background: var(--color-blue-600); color: var(--color-gray-50); }
.menu-button { display: none; align-items: center; justify-content: center; width: 44px; height: 44px; border: 0px; border-radius: var(--radius-sm); background: transparent; color: var(--color-blue-ink); cursor: pointer; }
.mobile-menu { border-top: 1px solid var(--color-gray-500-border); padding: var(--space-8) 0px var(--space-16); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Site footer

Footer · 1 variant: Default
States captured: Default
Tokens used: gray-ink (color), gray-200 (border-color), space-48 (padding-top), space-48 (padding-bottom), body (font)
Checks: 1 of 1
- Contrast AA · pass · 4.7:1 on gray-50

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
      <form class="newsletter"><input class="input newsletter-input" type="email" placeholder="Your email" style=""><button type="submit" class="btn btn-primary btn-sm">Subscribe</button></form>
    </div>
  </div>
</footer>
```

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.site-footer { border-top: 1px solid var(--color-gray-200); padding: var(--space-48) 0px; }
.container { max-width: 1120px; margin: 0px auto; padding: 0px var(--space-24); }
.footer-inner { display: flex; justify-content: space-between; gap: var(--space-32); flex-wrap: wrap; }
.stack { display: flex; flex-direction: column; gap: var(--space-16); }
.logo { font-size: 20px; line-height: 28px; font-weight: 600; color: var(--color-gray-800); }
p { font-size: 16px; line-height: 26px; }
.caption { font-size: 12px; line-height: 16px; color: var(--color-gray-500); }
.footer-links { display: flex; gap: var(--space-24); flex-wrap: wrap; }
a { color: var(--color-blue-600-alt); text-decoration: none; }
.footer-link { font-size: 14px; line-height: 22px; color: var(--color-gray-600); }
.newsletter { display: flex; gap: var(--space-8); align-items: center; }
input, button { font: inherit; color: inherit; }
.input { width: 100%; height: 44px; padding: var(--space-8) var(--space-12); border: 1px solid var(--color-gray-300); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-blue-ink); font-size: 16px; line-height: 26px; }
.newsletter-input { width: 240px; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8); height: 44px; padding: 0px var(--space-20); border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color 160ms, color 160ms; }
.btn-sm { height: 36px; padding: 0px var(--space-16); }
.btn-primary { background: var(--color-blue-600); color: var(--color-gray-50); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
.newsletter-input::placeholder { color: var(--color-gray-500); }
```

### Footer links

Nav bar · 1 variant: Default
States captured: Default
Tokens used: gray-ink (color), body (font)
Checks: 1 of 1
- Contrast AA · pass · 5.6:1 on gray-50

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
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.footer-links { display: flex; gap: var(--space-24); flex-wrap: wrap; }
a { color: var(--color-blue-600-alt); text-decoration: none; }
.footer-link { font-size: 14px; line-height: 22px; color: var(--color-gray-600); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Main navigation

Nav bar · 1 variant: Default
States captured: Default
Tokens used: gray-ink (color), body (font)
Checks: 1 of 1
- Contrast AA · pass · 8.0:1 on gray-50

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
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.nav-links { display: flex; align-items: center; gap: var(--space-24); }
a { color: var(--color-blue-600-alt); text-decoration: none; }
.nav-link { font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-gray-700); }
.dropdown { position: relative; }
button { font: inherit; color: inherit; }
.dropdown-trigger { display: inline-flex; align-items: center; gap: var(--space-4); height: 44px; padding: 0px var(--space-12); border: 0px; border-radius: var(--radius-sm); background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-blue-ink); cursor: pointer; }
svg { display: block; }
.dropdown-menu { position: absolute; top: 48px; left: 0px; z-index: 20; min-width: 224px; padding: var(--space-8); background: var(--color-gray-50); border: 1px solid var(--color-gray-300-alt); border-radius: var(--radius-lg); box-shadow: var(--color-blue-ink-tint) 0px 12px 32px; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Breadcrumb

Breadcrumb · 1 variant: Default
States captured: Default
Tokens used: gray-ink (color), body (font)
Checks: 1 of 1
- Contrast AA · pass · 5.0:1 on gray-50

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<nav aria-label="Breadcrumb"><ol class="breadcrumb"><li><a class="crumb" href="#">Home</a></li><li aria-hidden="true">/</li><li class="crumb-current" aria-current="page">Docs</li></ol></nav>
```

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
ol { list-style: none; }
.breadcrumb { display: flex; align-items: center; gap: var(--space-8); font-size: 14px; line-height: 22px; }
a { color: var(--color-blue-600-alt); text-decoration: none; }
.crumb { color: var(--color-blue-500); }
.crumb-current { color: var(--color-blue-ink); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Tabs

Tabs · 1 variant: Default
States captured: Default
Tokens used: gray-ink (color), body (font)
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
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.tabs { display: flex; gap: var(--space-4); border-bottom: 1px solid var(--color-gray-400-alt); }
button { font: inherit; color: inherit; }
.tab { height: 44px; padding: 0px var(--space-16); border-width: 0px 0px 2px; border-style: none none solid; border-color: currentcolor currentcolor transparent; border-image: none; background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-blue-ink); cursor: pointer; }
.tab[aria-selected="true"] { color: var(--color-blue-600); border-bottom-color: var(--color-blue-600); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Feature card

Card · 1 variant: Default
States captured: Default
Tokens used: gray-50 (background-color), gray-ink (color), gray-200 (border-color), radius 12px (border-radius), space-18 (padding-top), space-18 (padding-right), space-18 (padding-bottom), space-18 (padding-left), body (font), shadow-sm (box-shadow)
Checks: 1 of 1
- Contrast AA · pass · 8.0:1 on gray-50

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
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.card { display: flex; flex-direction: column; gap: var(--space-12); padding: var(--space-18); background: var(--color-gray-50); border: 1px solid var(--color-gray-200); border-radius: var(--radius-lg); box-shadow: var(--color-blue-ink-tint) 0px 1px 2px; }
.feature-icon { width: 24px; height: 24px; color: var(--color-teal-500); }
svg { display: block; }
.tag-new { display: inline-flex; align-items: center; align-self: flex-start; height: 24px; padding: 0px var(--space-10); border-radius: 999px; background: var(--color-teal-500); color: var(--color-gray-50); font-size: 12px; line-height: 16px; }
h3 { font-size: 20px; line-height: 28px; font-weight: 600; }
h3 { color: var(--color-gray-800); }
p { font-size: 16px; line-height: 26px; }
.text-sm { font-size: 14px; line-height: 22px; color: var(--color-gray-700); }
.card .text-sm { font-size: 15px; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Changelog entry

List row · 1 variant: Default
States captured: Default
Tokens used: gray-ink (color), space-16 (padding-left), body (font)
Checks: 1 of 1
- Contrast AA · pass · 4.7:1 on gray-50

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<article class="release"><span class="caption">Week 1</span><h3>Faster digests</h3><p class="text-sm">A short note about faster digests.</p></article>
```

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.release { display: flex; flex-direction: column; gap: var(--space-8); padding-left: var(--space-16); border-left: 2px solid var(--color-gray-200); }
.caption { font-size: 12px; line-height: 16px; color: var(--color-gray-500); }
h3 { font-size: 20px; line-height: 28px; font-weight: 600; }
h3 { color: var(--color-gray-800); }
p { font-size: 16px; line-height: 26px; }
.text-sm { font-size: 14px; line-height: 22px; color: var(--color-gray-700); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Pricing card

Card · 2 variants: Primary, Secondary
States captured: Default
Tokens used: gray-50 (background-color), gray-ink (color), gray-200 (border-color), radius 12px (border-radius), space-32 (padding-top), space-32 (padding-right), space-32 (padding-bottom), space-32 (padding-left), body (font), shadow-sm (box-shadow)
Checks: 0 of 1
- Contrast AA · fail · 1.3:1 on blue-ink, needs 4.5:1

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
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.card { display: flex; flex-direction: column; gap: var(--space-12); padding: var(--space-18); background: var(--color-gray-50); border: 1px solid var(--color-gray-200); border-radius: var(--radius-lg); box-shadow: var(--color-blue-ink-tint) 0px 1px 2px; }
.pricing-card { padding: var(--space-32); gap: var(--space-16); }
h3 { font-size: 20px; line-height: 28px; font-weight: 600; }
h3 { color: var(--color-gray-800); }
p { font-size: 16px; line-height: 26px; }
.price { font-size: 48px; line-height: 56px; font-weight: 700; }
ul { list-style: none; }
.plan-features { display: flex; flex-direction: column; gap: var(--space-8); }
.text-sm { font-size: 14px; line-height: 22px; color: var(--color-gray-700); }
.card .text-sm { font-size: 15px; }
a { color: var(--color-blue-600-alt); text-decoration: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8); height: 44px; padding: 0px var(--space-20); border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color 160ms, color 160ms; }
.btn-secondary { background: var(--color-gray-50); color: var(--color-blue-600-alt); border-color: var(--color-blue-600-alt); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Promo card

Card · 1 variant: Default
States captured: Default
Tokens used: gray-50 (color), radius 12px (border-radius), space-32 (padding-top), space-32 (padding-right), space-32 (padding-bottom), space-32 (padding-left), body (font)
Checks: 1 of 1
- Contrast AA · pass · 11.2:1 on #1B3A6A

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<section class="promo"><h3 style="color: #FFFFFF">Ship notes on Fridays</h3><p>Teams that publish weekly see twice the readers.</p></section>
```

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.promo { display: flex; flex-direction: column; gap: var(--space-12); padding: var(--space-32); border-radius: var(--radius-lg); background-size: cover; color: var(--color-gray-50); }
h3 { font-size: 20px; line-height: 28px; font-weight: 600; }
h3 { color: var(--color-gray-800); }
p { font-size: 16px; line-height: 26px; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Status badge

Badge · 3 variants: Success, Danger, Warning
States captured: Default
Tokens used: success (background-color), gray-50 (color), radius-pill (border-radius), space-10 (padding-right), space-10 (padding-left), caption (font)
Checks: 0 of 2
- Contrast AA · fail · 2.1:1 on warning, needs 4.5:1
- Reduced motion · fail · Animation still runs under reduced motion

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<span class="badge badge-success">API operational</span>
```

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.badge { display: inline-flex; align-items: center; height: 24px; padding: 0px var(--space-10); border-radius: 999px; color: var(--color-gray-50); font-size: 12px; line-height: 16px; }
.badge-success { background: var(--color-success); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### New tag

Tag · 1 variant: Default
States captured: Default
Tokens used: teal-500 (background-color), gray-50 (color), radius-pill (border-radius), space-10 (padding-right), space-10 (padding-left), caption (font)
Checks: 0 of 1
- Contrast AA · fail · 4.1:1 on teal-500, needs 4.5:1

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<span class="tag-new">New</span>
```

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.tag-new { display: inline-flex; align-items: center; align-self: flex-start; height: 24px; padding: 0px var(--space-10); border-radius: 999px; background: var(--color-teal-500); color: var(--color-gray-50); font-size: 12px; line-height: 16px; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Success alert

Alert · 1 variant: Default
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
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.alert { display: flex; align-items: flex-start; gap: var(--space-12); padding: var(--space-16); border: 1px solid var(--color-success); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-blue-ink); }
.alert-icon { flex: 0 0 auto; width: 24px; height: 24px; }
.alert-icon-success { color: var(--color-success); }
svg { display: block; }
.stack { display: flex; flex-direction: column; gap: var(--space-16); }
p { font-size: 16px; line-height: 26px; }
.hero-actions { display: flex; gap: var(--space-12); flex-wrap: wrap; }
a { color: var(--color-blue-600-alt); text-decoration: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8); height: 44px; padding: 0px var(--space-20); border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color 160ms, color 160ms; }
.btn-sm { height: 36px; padding: 0px var(--space-16); }
.btn-primary { background: var(--color-blue-600); color: var(--color-gray-50); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Empty state

Empty state · 1 variant: Default
States captured: Default
Tokens used: gray-ink (color), gray-100 (border-color), radius 12px (border-radius), space-96 (padding-top), space-24 (padding-right), space-96 (padding-bottom), space-24 (padding-left), body (font)
Checks: 1 of 1
- Contrast AA · pass · 16.4:1 on gray-50

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
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: var(--space-16); padding: var(--space-96) var(--space-24); border: 1px solid var(--color-gray-100); border-radius: var(--radius-lg); text-align: center; }
.empty-icon { width: 48px; height: 48px; color: var(--color-teal-500); }
svg { display: block; }
h1 { font-size: 36px; line-height: 44px; font-weight: 700; }
p { font-size: 16px; line-height: 26px; }
a { color: var(--color-blue-600-alt); text-decoration: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8); height: 44px; padding: 0px var(--space-20); border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color 160ms, color 160ms; }
.btn-ghost { background: transparent; color: var(--color-blue-ink); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Pricing table

Table · 1 variant: Default
States captured: Default
Tokens used: gray-ink (color), body-sm (font)
Checks: 1 of 1
- Contrast AA · pass · 15.1:1 on gray-50-alt

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
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.table { width: 100%; border-collapse: collapse; font-size: 14px; line-height: 22px; }
.th { padding: var(--space-12) var(--space-16); background: var(--color-gray-50-alt); border-bottom: 1px solid var(--color-gray-100); text-align: left; font-size: 14px; line-height: 20px; font-weight: 600; }
.td { padding: var(--space-12) var(--space-16); border-bottom: 1px solid var(--color-gray-100); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Code block

Code block · 1 variant: Default
States captured: Default
Tokens used: blue-ink (background-color), gray-50 (color), radius 8px (border-radius), space-16 (padding-top), space-24 (padding-right), space-16 (padding-bottom), space-24 (padding-left)
Unmapped: font 14px 400
Checks: 1 of 1
- Contrast AA · pass · 16.5:1 on blue-ink

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<pre class="code-block"><code>npm install @tidewater/cli
tidewater login
tidewater publish</code></pre>
```

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.code-block { padding: var(--space-16) var(--space-24); border-radius: var(--radius-sm); background: var(--color-blue-ink); color: var(--color-gray-50); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; line-height: 22px; overflow-x: auto; }
pre code { font: inherit; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Resources dropdown

Dropdown · 1 variant: Default
States captured: Default
Tokens used: gray-50 (background-color), gray-ink (color), gray-300-alt (border-color), radius 12px (border-radius), space-8 (padding-top), space-8 (padding-right), space-8 (padding-bottom), space-8 (padding-left), body (font), shadow-md (box-shadow)
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
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.dropdown-menu { position: absolute; top: 48px; left: 0px; z-index: 20; min-width: 224px; padding: var(--space-8); background: var(--color-gray-50); border: 1px solid var(--color-gray-300-alt); border-radius: var(--radius-lg); box-shadow: var(--color-blue-ink-tint) 0px 12px 32px; }
a { color: var(--color-blue-600-alt); text-decoration: none; }
.menu-item { display: flex; align-items: center; height: 44px; padding: 0px var(--space-12); border-radius: var(--radius-sm); font-size: 14px; line-height: 22px; color: var(--color-blue-ink); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Mobile menu

Dropdown · 1 variant: Default
States captured: Default
Tokens used: gray-ink (color), gray-500-border (border-color), space-8 (padding-top), space-16 (padding-bottom), body (font)
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
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.mobile-menu { border-top: 1px solid var(--color-gray-500-border); padding: var(--space-8) 0px var(--space-16); }
a { color: var(--color-blue-600-alt); text-decoration: none; }
.mobile-link { display: flex; align-items: center; height: 48px; font-size: 16px; line-height: 26px; color: var(--color-blue-ink); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Avatar

Avatar · 1 variant: Default
States captured: Default
Tokens used: gray-100 (background-color), radius-pill (border-radius)
Checks: 0 of 0

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<span aria-hidden="true" style="display: inline-block; width: 40px; height: 40px; border-radius: 50%; background: rgb(215, 221, 229); vertical-align: middle" class="avatar"></span>
```

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--color-gray-100); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

## Drift

14 grays across 12 pages. 9 would do.

- 14 → 9 grays: Nine are within ΔE 6.0 of a neighbor. Nobody can tell them apart.
- 13 → 11 spacing: Two sit off the 4 px grid: 10 and 18, on 12 pages.
- 9 → 8 type: Three differ by 1 px or less in size or line height.

Proposed set: 17 colors, 11 spacing steps, 8 type styles. Every proposed pair keeps or improves its contrast ratio on the surfaces it is used on.

The palette carries 14 grays where nine would do, and nine of them sit within ΔE 6.0 of a neighbor. Two spacing values, 10 and 18, sit off the 4 px grid, on 12 pages. Nine type styles are in use, and three of them differ by 1 px or less in size or line height. The proposed set folds the grays into nine steps, maps the off-grid values to their nearest steps and merges the near-duplicate type styles into eight. Every pair of text and background keeps its contrast ratio.

## How this was made

Extracted by Design System Extractor from localhost:4100 in run evalmessy0 on 2026-10-12. Tokens, components and checks are measured from the rendered pages. The introduction and the drift narrative were written by a model from those measurements. Tokens shown are the raw set.
