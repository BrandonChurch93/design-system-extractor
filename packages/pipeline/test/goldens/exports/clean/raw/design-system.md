# localhost:4100 design system

This design system was extracted from localhost:4100 across nine pages. It holds nine colors, nine type styles, 11 spacing steps and 29 components.

## Palette

| Name | Value | Group | Uses |
| --- | --- | --- | --- |
| text-primary | #0B1F3A | brand | 914 |
| blue-600 | #2458E6 | brand | 106 |
| teal-500 | #0F8A8A | brand | 44 |
| gray-50 | #FFFFFF | neutral | 148 |
| gray-border | #E2E8F0 | neutral | 209 |
| text-secondary | #5F6368 | neutral | 20 |
| success | #15803D | semantic | 16 |
| warning | #B45309 | semantic | 16 |
| danger | #DC2626 | semantic | 12 |

## Overlays

| Name | Base | Alpha | Value |
| --- | --- | --- | --- |
| text-primary-12 | zh3ek8iz | 12% | rgb(11 31 58 / 12%) |
| text-primary-60 | zh3ek8iz | 60% | rgb(11 31 58 / 60%) |
| white-8 | white | 8% | rgb(255 255 255 / 8%) |

## Type

| Name | Role | Family | Size | Line height | Weight |
| --- | --- | --- | --- | --- | --- |
| display | display | Inter | 48px | 56px | 700 |
| title | title | Inter | 36px | 44px | 700 |
| title-sm | title | Inter | 28px | 36px | 700 |
| subheading | subheading | Inter | 20px | 28px | 600 |
| body | body | Inter | 16px | 26px | 400 |
| text-14 | text | Inter | 14px | 20px | 600 |
| text-small | body-sm | Inter | 14px | 22px | 400 |
| code | code | ui-monospace | 14px | 22px | 400 |
| caption | caption | Inter | 12px | 16px | 400 |

## Spacing

4 px base. Steps: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96.

## Radius

- radius-sm: 8px
- radius-md: 12px
- radius-rounded: 9999px

## Shadow

- shadow-stack-low: 0px 1px 2px 0px #0B1F3A1F
- shadow-md: 0px 12px 32px 0px #0B1F3A1F

## Motion

### Durations

| Name | Value | Role |
| --- | --- | --- |
| duration-120 | 120 ms | Fast |
| duration-160 | 160 ms | Base |
| duration-240 | 240 ms | Slow |
| duration-480 | 480 ms | Slower |
| duration-1600 | 1600 ms |  |

### Easings

| Name | Value |
| --- | --- |
| ease-out-quad | cubic-bezier(0.25, 0.46, 0.45, 0.94) |
| ease-out-quart | cubic-bezier(0.25, 1, 0.5, 1) |

### Keyframes

```css
@keyframes fade-up { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: none; } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
```

### Patterns

- Entrance · h1.display · on load · opacity 0 → 1, transform translateY(12px) → none · 480 ms · ease-out-quart
- Scroll reveal · Feature card · when it enters the viewport at 15% from the bottom · opacity 0 → 1, transform translateY(16px) → none · 240 ms · ease-out-quart · 3 items · 60 ms apart
- Scroll reveal · div.testimonial · when it enters the viewport at 25% from the bottom · opacity 0.02 → 1, transform translateY(15.6px) → translateY(0px) · about 400 ms · easing not recorded, nearest token suggested: ease-out-quad · observed
- Scrolled header · Site header · after 400 px of scrolling · box-shadow none → 0px 12px 32px 0px #0B1F3A1F · 160 ms · ease-out-quad
- Loop · Notice · loops every 1,600 ms · opacity 1 → 0.4 · 1,600 ms · ease-out-quart

## Breakpoints

- breakpoint-sm: 640px
- breakpoint-md: 1024px
- breakpoint-lg: 1280px

## Tokens as CSS

```css
:root {
  --color-text-primary: #0B1F3A;
  --color-blue-600: #2458E6;
  --color-teal-500: #0F8A8A;
  --color-gray-50: #FFFFFF;
  --color-gray-border: #E2E8F0;
  --color-text-secondary: #5F6368;
  --color-success: #15803D;
  --color-warning: #B45309;
  --color-danger: #DC2626;

  --overlay-text-primary-12: rgb(11 31 58 / 12%);
  --overlay-text-primary-60: rgb(11 31 58 / 60%);
  --overlay-white-8: rgb(255 255 255 / 8%);

  --font-sans: Inter, system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;

  --type-display-size: 48px;
  --type-display-line: 56px;
  --type-display-weight: 700;
  --type-title-size: 36px;
  --type-title-line: 44px;
  --type-title-weight: 700;
  --type-title-sm-size: 28px;
  --type-title-sm-line: 36px;
  --type-title-sm-weight: 700;
  --type-subheading-size: 20px;
  --type-subheading-line: 28px;
  --type-subheading-weight: 600;
  --type-body-size: 16px;
  --type-body-line: 26px;
  --type-body-weight: 400;
  --type-text-14-size: 14px;
  --type-text-14-line: 20px;
  --type-text-14-weight: 600;
  --type-text-small-size: 14px;
  --type-text-small-line: 22px;
  --type-text-small-weight: 400;
  --type-code-size: 14px;
  --type-code-line: 22px;
  --type-code-weight: 400;
  --type-caption-size: 12px;
  --type-caption-line: 16px;
  --type-caption-weight: 400;

  --space-4: 4px;
  --space-8: 8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-20: 20px;
  --space-24: 24px;
  --space-32: 32px;
  --space-40: 40px;
  --space-48: 48px;
  --space-64: 64px;
  --space-96: 96px;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-rounded: 9999px;

  --shadow-stack-low: 0px 1px 2px 0px #0B1F3A1F;
  --shadow-md: 0px 12px 32px 0px #0B1F3A1F;

  --duration-120: 120ms;
  --duration-160: 160ms;
  --duration-240: 240ms;
  --duration-480: 480ms;
  --duration-1600: 1600ms;
  --duration-fast: var(--duration-120);
  --duration-base: var(--duration-160);
  --duration-slow: var(--duration-240);
  --duration-slower: var(--duration-480);

  --ease-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);

  --breakpoint-sm: 640px;
  --breakpoint-md: 1024px;
  --breakpoint-lg: 1280px;
}
```

## Site variables

```css
/* Site variables, resolved */
:root {
  --text-small-size: 14px;
}
```

## Core components

### Button

Button · 7 variants: Primary, Ghost, Secondary, Ghost rounded, Secondary small, Primary small, Ghost small
States captured: Default, Hover, Focus, Active, Disabled
Tokens used: color-text-primary (color), radius-sm (border-radius), space-20 (padding-right), space-20 (padding-left), type-text-14 (font), duration-160 (transition-duration), ease-out-quad (transition-timing-function)
Unmapped: border-color rgba(0, 0, 0, 0)
Motion: hover · background-color · 160 ms · ease-out-quad; hover · box-shadow · 160 ms · ease-out-quad; hover · transform · 160 ms · ease-out-quad; active · background-color · 160 ms · ease-out-quad; active · box-shadow · 160 ms · ease-out-quad; active · transform · 160 ms · ease-out-quad
Checks: all pass
- Contrast AA · pass · 16.5:1 on gray-50
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 88 × 44 at 390 px
- Reduced motion · pass · Stops under reduced motion

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<a class="btn btn-ghost" href="#">Sign in</a>
```

```css
a { color: var(--color-blue-600); text-decoration: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8); height: 44px; padding: 0px var(--space-20); border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color var(--duration-160) var(--ease-out-quad), color var(--duration-160) var(--ease-out-quad), transform var(--duration-160) var(--ease-out-quad), box-shadow var(--duration-160) var(--ease-out-quad); }
.btn-ghost { background: transparent; color: var(--color-text-primary); }
.btn-ghost { color: var(--color-text-primary); }
.btn { font-size: var(--text-small-size); }
```

### Skip link

Link · 1 variant: Default
States captured: Default, Hover, Focus, Active
Tokens used: color-text-primary (background-color), color-gray-50 (color), radius-sm (border-radius), space-16 (padding-right), space-16 (padding-left), type-text-14 (font)
Motion: none
Checks: all pass
- Contrast AA · pass · 16.5:1 on text-primary
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 134 × 44 at 390 px

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<a class="skip-link" href="#">Skip to content</a>
```

```css
a { color: var(--color-blue-600); text-decoration: none; }
.skip-link { position: absolute; top: 12px; left: 24px; z-index: 30; display: inline-flex; align-items: center; height: 44px; padding: 0px var(--space-16); border-radius: var(--radius-sm); background: var(--color-text-primary); color: var(--color-gray-50); font-size: 14px; line-height: 20px; font-weight: 600; clip-path: inset(50%); }
```

### Dropdown trigger

Button · 1 variant: Default
States captured: Default, Hover, Focus, Active, Open
Tokens used: color-text-primary (color), radius-sm (border-radius), space-12 (padding-right), space-12 (padding-left), type-text-14 (font)
Motion: none
Checks: 2 of 3
- Contrast AA · pass · 16.5:1 on gray-50
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · fail · 0 px tall, 44 short

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<button type="button" class="dropdown-trigger" aria-haspopup="menu" aria-expanded="false" aria-controls="dse-resources-menu">Resources <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button>
```

```css
button { padding: 0px; padding: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.dropdown-trigger { display: inline-flex; align-items: center; gap: var(--space-4); height: 44px; padding: 0px var(--space-12); border: 0px; border-radius: var(--radius-sm); background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-text-primary); cursor: pointer; }
.dropdown-trigger { color: var(--color-text-primary); }
.dropdown-trigger { font-size: var(--text-small-size); }
svg { display: block; }
```

### Menu button

Button · 1 variant: Default
States captured: Default, Hover, Focus, Active, Open
Tokens used: radius-sm (border-radius)
Motion: none
Checks: all pass
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 44 × 44 at 390 px
- Label present · pass · aria-label

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<button type="button" class="menu-button" aria-label="Open menu" aria-expanded="false" aria-controls="dse-mobile-menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"></path></svg></button>
```

```css
button { padding: 0px; padding: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.menu-button { display: none; align-items: center; justify-content: center; width: 44px; height: 44px; border: 0px; border-radius: var(--radius-sm); background: transparent; color: var(--color-text-primary); cursor: pointer; }
.menu-button { display: inline-flex; }
svg { display: block; }
```

### Tab button

Button · 1 variant: Default
States captured: Default, Hover, Focus, Active, Selected
Tokens used: color-blue-600 (color), space-16 (padding-right), space-16 (padding-left), type-text-14 (font)
Motion: none
Checks: all pass
- Contrast AA · pass · 5.8:1 on gray-50
- Focus visible · pass · 2 px ring, 16.5:1 against gray-50
- Tap target · pass · 69 × 44 at 390 px

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<button type="button" class="tab" role="tab" id="dse-tab-digest" aria-selected="true" aria-controls="dse-panel-digest">Digests</button>
```

```css
button { padding: 0px; padding: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.tab { height: 44px; padding: 0px var(--space-16); border-width: 0px 0px 2px; border-style: none none solid; border-color: currentcolor currentcolor transparent; border-image: none; background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-text-primary); cursor: pointer; }
.tab[aria-selected="true"] { color: var(--color-blue-600); border-bottom-color: var(--color-blue-600); }
.tab { font-size: var(--text-small-size); }
```

### Text input

Text input · 1 variant: Default
States captured: Default, Hover, Focus, Active, Error
Tokens used: color-gray-50 (background-color), color-gray-border (border-color), radius-sm (border-radius), space-8 (padding-top), space-12 (padding-right), space-8 (padding-bottom), space-12 (padding-left)
Motion: none
Checks: all pass
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 342 × 44 at 390 px
- Label present · pass · Label element

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<input class="input" id="dse-login-email" type="email" autocomplete="email" style="">
```

```css
input { padding: 0px; padding: 0px; padding: 0px; }
input { font: inherit; color: inherit; }
.input { width: 100%; height: 44px; padding: var(--space-8) var(--space-12); border: 1px solid var(--color-gray-border); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-text-primary); font-size: 16px; line-height: 26px; }
```

### Billing toggle

Toggle · 1 variant: Default
States captured: Default, Hover, Focus, Active
Tokens used: none
Motion: none
Checks: all pass
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 52 × 44 at 390 px
- Label present · pass · aria-label

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<button type="button" class="toggle" role="switch" aria-checked="false" aria-label="Bill yearly"></button>
```

```css
button { padding: 0px; padding: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.toggle { position: relative; flex: 0 0 auto; width: 52px; height: 44px; border: 0px; background: transparent; cursor: pointer; }
.toggle::before { content: ""; position: absolute; left: 4px; top: 10px; width: 44px; height: 24px; border-radius: 999px; background: var(--color-gray-border); }
.toggle::after { content: ""; position: absolute; left: 8px; top: 14px; width: 16px; height: 16px; border-radius: 999px; background: var(--color-gray-50); transition: transform var(--duration-160) var(--ease-out-quad); }
```

### Select

Select · 1 variant: Default
States captured: Default, Hover, Focus, Active
Tokens used: color-gray-50 (background-color), color-text-primary (color), color-gray-border (border-color), radius-sm (border-radius), space-8 (padding-top), space-40 (padding-right), space-8 (padding-bottom), space-12 (padding-left), type-body (font)
Motion: none
Checks: all pass
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 342 × 44 at 390 px
- Label present · pass · Label element

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<select class="select" id="dse-team" name="team"><option>1 to 5</option><option>6 to 20</option><option>21 or more</option></select>
```

```css
select { padding: 0px; padding: 0px; padding: 0px; }
select { font: inherit; color: inherit; }
.select { width: 100%; height: 44px; padding: var(--space-8) var(--space-12); border: 1px solid var(--color-gray-border); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-text-primary); font-size: 16px; line-height: 26px; }
.select { appearance: none; padding-right: var(--space-40); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230B1F3A' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
```

### Checkbox

Checkbox · 1 variant: Default
States captured: Default, Hover, Focus, Active
Tokens used: radius-sm (border-radius)
Motion: none
Checks: all pass
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 44 × 44 at 390 px
- Label present · pass · Label element

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<input class="checkbox" id="dse-updates" type="checkbox" style="">
```

```css
input { padding: 0px; padding: 0px; padding: 0px; }
input { font: inherit; color: inherit; }
.checkbox { appearance: none; flex: 0 0 auto; width: 44px; height: 44px; margin: 0px -12px; border: 0px; border-radius: var(--radius-sm); background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect x='0.5' y='0.5' width='19' height='19' rx='3.5' fill='%23FFFFFF' stroke='%230B1F3A'/%3E%3C/svg%3E") center center no-repeat transparent; cursor: pointer; }
```

### Text area

Textarea · 1 variant: Default
States captured: Default, Hover, Focus, Active
Tokens used: color-gray-50 (background-color), color-gray-border (border-color), radius-sm (border-radius), space-8 (padding-top), space-12 (padding-right), space-8 (padding-bottom), space-12 (padding-left)
Motion: none
Checks: all pass
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 342 × 128 at 390 px
- Label present · pass · Label element

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<textarea class="textarea" id="dse-contact-message" name="message" style=""></textarea>
```

```css
textarea { padding: 0px; padding: 0px; padding: 0px; }
textarea { font: inherit; color: inherit; }
.textarea { width: 100%; height: 44px; padding: var(--space-8) var(--space-12); border: 1px solid var(--color-gray-border); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-text-primary); font-size: 16px; line-height: 26px; }
.textarea { height: 128px; resize: vertical; }
```

### Site header

Header · 1 variant: Default
States captured: Default, Scrolled
Tokens used: color-gray-50 (background-color), color-text-primary (color), type-body (font), duration-160 (transition-duration), ease-out-quad (transition-timing-function)
Motion: scrolled · box-shadow · 160 ms · ease-out-quad; 1 motion pattern in the Motion section
Checks: all pass
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
button { padding: 0px; padding: 0px; padding: 0px; }
.site-header { position: relative; top: 0px; z-index: 10; background: var(--color-gray-50); border-bottom: 1px solid var(--color-gray-border); transition: box-shadow var(--duration-160) var(--ease-out-quad); }
.container { max-width: 1120px; margin: 0px auto; padding: 0px var(--space-24); }
.container { padding-left: var(--space-24); }
.header-inner { display: flex; align-items: center; justify-content: space-between; gap: var(--space-32); height: 72px; }
a { color: var(--color-blue-600); text-decoration: none; }
.logo { font-size: 20px; line-height: 28px; font-weight: 600; color: var(--color-text-primary); }
.nav-link { font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-text-primary); }
button { font: inherit; color: inherit; }
.dropdown-trigger { display: inline-flex; align-items: center; gap: var(--space-4); height: 44px; padding: 0px var(--space-12); border: 0px; border-radius: var(--radius-sm); background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-text-primary); cursor: pointer; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8); height: 44px; padding: 0px var(--space-20); border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color var(--duration-160) var(--ease-out-quad), color var(--duration-160) var(--ease-out-quad), transform var(--duration-160) var(--ease-out-quad), box-shadow var(--duration-160) var(--ease-out-quad); }
.btn-ghost { background: transparent; color: var(--color-text-primary); }
.logo, .nav-link, .dropdown-trigger, .btn-ghost { color: var(--color-text-primary); }
.nav-links { display: flex; align-items: center; gap: var(--space-24); }
.btn-primary { background: var(--color-blue-600); color: var(--color-gray-50); }
.nav-link, .dropdown-trigger, .btn { font-size: var(--text-small-size); }
.nav-link { transition: color var(--duration-120) var(--ease-out-quad); }
.dropdown { position: relative; }
svg { display: block; }
.dropdown-menu { position: absolute; top: 48px; left: 0px; z-index: 20; min-width: 224px; padding: var(--space-8); background: var(--color-gray-50); border: 1px solid var(--color-gray-border); border-radius: var(--radius-md); box-shadow: var(--overlay-text-primary-12) 0px 12px 32px; }
.header-actions { display: flex; align-items: center; gap: var(--space-12); }
.menu-button { display: none; align-items: center; justify-content: center; width: 44px; height: 44px; border: 0px; border-radius: var(--radius-sm); background: transparent; color: var(--color-text-primary); cursor: pointer; }
.mobile-menu { border-top: 1px solid var(--color-gray-border); padding: var(--space-8) 0px var(--space-16); }
```

### Site footer

Footer · 1 variant: Default
States captured: Default
Tokens used: color-text-primary (color), color-gray-border (border-color), space-48 (padding-top), space-48 (padding-bottom), type-body (font)
Motion: none
Checks: all pass
- Contrast AA · pass · 6.0:1 on gray-50

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
p { margin: 0px; margin: 0px; margin: 0px; }
.site-footer { border-top: 1px solid var(--color-gray-border); padding: var(--space-48) 0px; }
.container { max-width: 1120px; margin: 0px auto; padding: 0px var(--space-24); }
.container { padding-left: var(--space-24); }
.footer-inner { display: flex; justify-content: space-between; gap: var(--space-32); flex-wrap: wrap; }
.stack { display: flex; flex-direction: column; gap: var(--space-16); }
.logo { font-size: 20px; line-height: 28px; font-weight: 600; color: var(--color-text-primary); }
a { color: var(--color-blue-600); text-decoration: none; }
.footer-link { font-size: 14px; line-height: 22px; color: var(--color-text-primary); }
.logo, .footer-link { color: var(--color-text-primary); }
p { font-size: 16px; line-height: 26px; }
.caption { font-size: 12px; line-height: 16px; }
.caption { color: var(--color-text-secondary); }
.footer-links { display: flex; gap: var(--space-24); flex-wrap: wrap; }
.footer-link { font-size: var(--text-small-size); }
.footer-link { transition: color var(--duration-120) var(--ease-out-quad); }
```

### Footer links

Nav bar · 1 variant: Default
States captured: Default
Tokens used: color-text-primary (color), type-body (font)
Motion: none
Checks: all pass
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
.footer-links { display: flex; gap: var(--space-24); flex-wrap: wrap; }
a { color: var(--color-blue-600); text-decoration: none; }
.footer-link { font-size: 14px; line-height: 22px; color: var(--color-text-primary); }
.footer-link { color: var(--color-text-primary); }
.footer-link { font-size: var(--text-small-size); }
.footer-link { transition: color var(--duration-120) var(--ease-out-quad); }
```

### Main navigation

Nav bar · 1 variant: Default
States captured: Default
Tokens used: color-text-primary (color), type-body (font)
Motion: none
Checks: all pass
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
button { padding: 0px; padding: 0px; padding: 0px; }
.nav-links { display: flex; align-items: center; gap: var(--space-24); }
a { color: var(--color-blue-600); text-decoration: none; }
.nav-link { font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-text-primary); }
button { font: inherit; color: inherit; }
.dropdown-trigger { display: inline-flex; align-items: center; gap: var(--space-4); height: 44px; padding: 0px var(--space-12); border: 0px; border-radius: var(--radius-sm); background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-text-primary); cursor: pointer; }
.nav-link, .dropdown-trigger { color: var(--color-text-primary); }
.nav-link, .dropdown-trigger { font-size: var(--text-small-size); }
.nav-link { transition: color var(--duration-120) var(--ease-out-quad); }
.dropdown { position: relative; }
svg { display: block; }
.dropdown-menu { position: absolute; top: 48px; left: 0px; z-index: 20; min-width: 224px; padding: var(--space-8); background: var(--color-gray-50); border: 1px solid var(--color-gray-border); border-radius: var(--radius-md); box-shadow: var(--overlay-text-primary-12) 0px 12px 32px; }
```

### Breadcrumb

Breadcrumb · 1 variant: Default
States captured: Default
Tokens used: color-text-primary (color), type-body (font)
Motion: none
Checks: all pass
- Contrast AA · pass · 5.8:1 on gray-50

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<nav aria-label="Breadcrumb"><ol class="breadcrumb"><li><a class="crumb" href="#">Home</a></li><li aria-hidden="true">/</li><li class="crumb-current" aria-current="page">Docs</li></ol></nav>
```

```css
ol { margin: 0px; margin: 0px; margin: 0px; }
ol { padding: 0px; padding: 0px; padding: 0px; }
ol { list-style: none; }
.breadcrumb { display: flex; align-items: center; gap: var(--space-8); font-size: 14px; line-height: 22px; }
.breadcrumb { font-size: var(--text-small-size); }
a { color: var(--color-blue-600); text-decoration: none; }
.crumb { color: var(--color-blue-600); }
.crumb { transition: color var(--duration-120) var(--ease-out-quad); }
.crumb-current { color: var(--color-text-primary); }
.crumb-current { color: var(--color-text-primary); }
```

### Feature card

Card · 1 variant: Default
States captured: Default
Tokens used: color-gray-50 (background-color), color-text-primary (color), color-gray-border (border-color), radius-md (border-radius), space-24 (padding-top), space-24 (padding-right), space-24 (padding-bottom), space-24 (padding-left), type-body (font), shadow-stack-low (box-shadow)
Motion: 1 motion pattern in the Motion section
Checks: all pass
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
h3, p { margin: 0px; margin: 0px; margin: 0px; }
.card { display: flex; flex-direction: column; gap: var(--space-12); padding: var(--space-24); background: var(--color-gray-50); border: 1px solid var(--color-gray-border); border-radius: var(--radius-md); box-shadow: var(--overlay-text-primary-12) 0px 1px 2px; }
.card { box-shadow: var(--shadow-stack-low); }
.feature-icon { width: 24px; height: 24px; color: var(--color-teal-500); }
.feature-icon { color: var(--color-teal-500); }
svg { display: block; }
.tag-new { display: inline-flex; align-items: center; align-self: flex-start; height: 24px; padding: 0px var(--space-8); border-radius: 999px; background: var(--color-teal-500); color: var(--color-gray-50); font-size: 12px; line-height: 16px; }
.tag-new { border-radius: var(--radius-rounded); }
h3 { font-size: 20px; line-height: 28px; font-weight: 600; }
p { font-size: 16px; line-height: 26px; }
.text-sm { font-size: 14px; line-height: 22px; }
.text-sm { font-size: var(--text-small-size); }
```

### Status badge

Badge · 3 variants: Warning, Success, Danger
States captured: Default
Tokens used: color-success (background-color), color-gray-50 (color), radius-rounded (border-radius), space-8 (padding-right), space-8 (padding-left), type-caption (font)
Motion: none
Checks: all pass
- Contrast AA · pass · 5.0:1 on success

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<span class="badge badge-success">API operational</span>
```

```css
.badge { display: inline-flex; align-items: center; height: 24px; padding: 0px var(--space-8); border-radius: 999px; color: var(--color-gray-50); font-size: 12px; line-height: 16px; }
.badge-success { background: var(--color-success); }
.badge { border-radius: var(--radius-rounded); }
```

### Notice

Alert · 2 variants: Warning, Success
States captured: Default
Tokens used: color-gray-50 (background-color), color-text-primary (color), color-success (border-color), radius-sm (border-radius), space-16 (padding-top), space-16 (padding-right), space-16 (padding-bottom), space-16 (padding-left), type-body (font)
Motion: pulse · 1600 ms · ease-out-quart · loops; 1 motion pattern in the Motion section
Checks: all pass
- Contrast AA · pass · 16.5:1 on gray-50
- Reduced motion · pass · Stops under reduced motion

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
p { margin: 0px; margin: 0px; margin: 0px; }
.alert { display: flex; align-items: flex-start; gap: var(--space-12); padding: var(--space-16); border: 1px solid var(--color-success); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-text-primary); }
.alert-icon { flex: 0 0 auto; width: 24px; height: 24px; }
.alert-icon-success { color: var(--color-success); }
svg { display: block; }
.alert-icon-success svg { animation: pulse var(--duration-1600) var(--ease-out-quart) infinite; }
.stack { display: flex; flex-direction: column; gap: var(--space-16); }
p { font-size: 16px; line-height: 26px; }
.hero-actions { display: flex; gap: var(--space-12); flex-wrap: wrap; }
a { color: var(--color-blue-600); text-decoration: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8); height: 44px; padding: 0px var(--space-20); border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color var(--duration-160) var(--ease-out-quad), color var(--duration-160) var(--ease-out-quad), transform var(--duration-160) var(--ease-out-quad), box-shadow var(--duration-160) var(--ease-out-quad); }
.btn-sm { height: 36px; padding: 0px var(--space-16); }
.btn-primary { background: var(--color-blue-600); color: var(--color-gray-50); }
.btn { font-size: var(--text-small-size); }
```

### New tag

Tag · 1 variant: Default
States captured: Default
Tokens used: color-teal-500 (background-color), color-gray-50 (color), radius-rounded (border-radius), space-8 (padding-right), space-8 (padding-left), type-caption (font)
Motion: none
Checks: 0 of 1
- Contrast AA · fail · 4.1:1 on teal-500, needs 4.5:1

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<span class="tag-new">New</span>
```

```css
.tag-new { display: inline-flex; align-items: center; align-self: flex-start; height: 24px; padding: 0px var(--space-8); border-radius: 999px; background: var(--color-teal-500); color: var(--color-gray-50); font-size: 12px; line-height: 16px; }
.tag-new { border-radius: var(--radius-rounded); }
```

### Plan comparison table

Table · 1 variant: Default
States captured: Default
Tokens used: color-text-primary (color), type-text-small (font)
Motion: none
Checks: all pass
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
td, th { padding: 0px; padding: 0px; padding: 0px; }
.table { width: 100%; border-collapse: collapse; font-size: 14px; line-height: 22px; }
.th { padding: var(--space-12) var(--space-16); border-bottom: 1px solid var(--color-gray-border); text-align: left; font-size: 14px; line-height: 20px; font-weight: 600; }
.table, .th { font-size: var(--text-small-size); }
.td { padding: var(--space-12) var(--space-16); border-bottom: 1px solid var(--color-gray-border); }
```

### Code block

Code block · 1 variant: Default
States captured: Default
Tokens used: color-text-primary (background-color), color-gray-50 (color), radius-sm (border-radius), space-16 (padding-top), space-24 (padding-right), space-16 (padding-bottom), space-24 (padding-left), type-code (font)
Unmapped: border-color rgba(8, 9, 10, 0.6)
Motion: none
Checks: all pass
- Contrast AA · pass · 16.5:1 on text-primary

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<pre class="code-block"><code>npm install @tidewater/cli
tidewater login
tidewater publish</code></pre>
```

```css
pre { margin: 0px; margin: 0px; margin: 0px; }
.code-block { padding: var(--space-16) var(--space-24); border-radius: var(--radius-sm); background: var(--color-text-primary); color: var(--color-gray-50); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; line-height: 22px; overflow-x: auto; }
.code-block { font-size: var(--text-small-size); }
.code-block { border: 1px solid rgba(8, 9, 10, 0.6); }
```

### Avatar

Avatar · 1 variant: Default
States captured: Default
Tokens used: color-gray-border (background-color), radius-rounded (border-radius)
Motion: none

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<span aria-hidden="true" style="display: inline-block; width: 40px; height: 40px; border-radius: 50%; background: url('http://localhost:4400/clean/runs/evalclean0/components/ncxwhtsb/img-e58.png') center / 100% 100% no-repeat rgb(215, 221, 229); background-origin: border-box; vertical-align: middle" class="avatar"></span>
```

```css
.avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--color-gray-border); }
```

## Page-specific components

### Footer CTA button

Button · 1 variant: Default
States captured: Default, Hover, Focus, Active
Tokens used: color-gray-border (background-color), color-text-primary (color), radius-md (border-radius), space-16 (padding-right), space-16 (padding-left)
Unmapped: font 16px 500
Motion: none
Checks: all pass
- Contrast AA · pass · 13.3:1 on gray-border
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 147 × 44 at 390 px

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<button type="button" class="footer-cta">Talk to sales <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button>
```

```css
button { padding: 0px; padding: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.footer-cta { display: inline-flex; align-items: center; gap: var(--space-4); height: 44px; padding: 0px var(--space-16); border: 0px; border-radius: var(--radius-md); background: var(--color-gray-border); color: var(--color-text-primary); font-size: 16px; line-height: 24px; font-weight: 500; cursor: pointer; }
svg { display: block; }
```

### Icon button

Button · 1 variant: Default
States captured: Default, Hover, Focus, Active
Tokens used: color-gray-50 (background-color), color-gray-border (border-color), radius-sm (border-radius)
Motion: none
Checks: 2 of 3
- Focus visible · pass · 2 px ring, 5.8:1 against gray-50
- Tap target · pass · 44 × 44 at 390 px
- Label present · fail · No name found

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<button type="button" class="icon-button"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg></button>
```

```css
button { padding: 0px; padding: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.icon-button { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 1px solid var(--color-gray-border); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-text-primary); cursor: pointer; }
svg { display: block; }
```

### Feature tabs

Tabs · 1 variant: Default
States captured: Default
Tokens used: color-text-primary (color), type-body (font)
Motion: none

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<div class="tabs" role="tablist" aria-label="Channels">
    <button type="button" class="tab" role="tab" id="dse-tab-digest" aria-selected="true" aria-controls="dse-panel-digest">Digests</button>
    <button type="button" class="tab" role="tab" id="dse-tab-slack" aria-selected="false" aria-controls="dse-panel-slack">Slack</button>
    <button type="button" class="tab" role="tab" id="dse-tab-pages" aria-selected="false" aria-controls="dse-panel-pages">Pages</button>
  </div>
```

```css
button { padding: 0px; padding: 0px; padding: 0px; }
.tabs { display: flex; gap: var(--space-4); border-bottom: 1px solid var(--color-gray-border); }
button { font: inherit; color: inherit; }
.tab { height: 44px; padding: 0px var(--space-16); border-width: 0px 0px 2px; border-style: none none solid; border-color: currentcolor currentcolor transparent; border-image: none; background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-text-primary); cursor: pointer; }
.tab[aria-selected="true"] { color: var(--color-blue-600); border-bottom-color: var(--color-blue-600); }
.tab { font-size: var(--text-small-size); }
```

### Pricing card

Card · 2 variants: Primary, Secondary
States captured: Default
Tokens used: color-gray-50 (background-color), color-text-primary (color), color-gray-border (border-color), radius-md (border-radius), space-32 (padding-top), space-32 (padding-right), space-32 (padding-bottom), space-32 (padding-left), type-body (font), shadow-stack-low (box-shadow)
Motion: none
Checks: all pass
- Contrast AA · pass · 16.5:1 on gray-50

The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.

```html
<article class="card pricing-card">
        <h3>Starter</h3>
        <p class="price">$0</p>
        <ul class="plan-features">
          <li class="text-sm plan-item">One public changelog</li>
          <li class="text-sm plan-item">Weekly digest</li>
          <li class="text-sm plan-item">Three integrations</li>
        </ul>
        <a class="btn btn-secondary" href="#">Start free</a>
      </article>
```

```css
h3, p, ul { margin: 0px; margin: 0px; margin: 0px; }
ul { padding: 0px; padding: 0px; padding: 0px; }
.card { display: flex; flex-direction: column; gap: var(--space-12); padding: var(--space-24); background: var(--color-gray-50); border: 1px solid var(--color-gray-border); border-radius: var(--radius-md); box-shadow: var(--overlay-text-primary-12) 0px 1px 2px; }
.pricing-card { padding: var(--space-32); gap: var(--space-16); }
.card { box-shadow: var(--shadow-stack-low); }
h3 { font-size: 20px; line-height: 28px; font-weight: 600; }
p { font-size: 16px; line-height: 26px; }
.price { font-size: 48px; line-height: 56px; font-weight: 700; }
ul { list-style: none; }
.plan-features { display: flex; flex-direction: column; gap: var(--space-8); }
.text-sm { font-size: 14px; line-height: 22px; }
a { color: var(--color-blue-600); text-decoration: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8); height: 44px; padding: 0px var(--space-20); border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color var(--duration-160) var(--ease-out-quad), color var(--duration-160) var(--ease-out-quad), transform var(--duration-160) var(--ease-out-quad), box-shadow var(--duration-160) var(--ease-out-quad); }
.btn-secondary { background: var(--color-gray-50); color: var(--color-blue-600); border-color: var(--color-blue-600); }
.text-sm, .btn { font-size: var(--text-small-size); }
.plan-item { padding-top: var(--space-8); border-top: 1px solid var(--overlay-white-8); }
```

### Not found panel

Empty state · 1 variant: Default
States captured: Default
Tokens used: color-text-primary (color), color-gray-border (border-color), radius-md (border-radius), space-96 (padding-top), space-24 (padding-right), space-96 (padding-bottom), space-24 (padding-left), type-body (font)
Motion: none
Checks: all pass
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
h1, p { margin: 0px; margin: 0px; margin: 0px; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: var(--space-16); padding: var(--space-96) var(--space-24); border: 1px solid var(--color-gray-border); border-radius: var(--radius-md); text-align: center; }
.empty-icon { width: 48px; height: 48px; color: var(--color-teal-500); }
.empty-icon { color: var(--color-teal-500); }
svg { display: block; }
h1 { font-size: 36px; line-height: 44px; font-weight: 700; }
p { font-size: 16px; line-height: 26px; }
a { color: var(--color-blue-600); text-decoration: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8); height: 44px; padding: 0px var(--space-20); border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color var(--duration-160) var(--ease-out-quad), color var(--duration-160) var(--ease-out-quad), transform var(--duration-160) var(--ease-out-quad), box-shadow var(--duration-160) var(--ease-out-quad); }
.btn-ghost { background: transparent; color: var(--color-text-primary); }
.btn-ghost { color: var(--color-text-primary); }
.btn { font-size: var(--text-small-size); }
```

### Resources menu

Dropdown · 1 variant: Default
States captured: Default
Tokens used: color-gray-50 (background-color), color-text-primary (color), color-gray-border (border-color), radius-md (border-radius), space-8 (padding-top), space-8 (padding-right), space-8 (padding-bottom), space-8 (padding-left), type-body (font), shadow-md (box-shadow)
Motion: none
Checks: all pass
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
.dropdown-menu { position: absolute; top: 48px; left: 0px; z-index: 20; min-width: 224px; padding: var(--space-8); background: var(--color-gray-50); border: 1px solid var(--color-gray-border); border-radius: var(--radius-md); box-shadow: var(--overlay-text-primary-12) 0px 12px 32px; }
a { color: var(--color-blue-600); text-decoration: none; }
.menu-item { display: flex; align-items: center; height: 44px; padding: 0px var(--space-12); border-radius: var(--radius-sm); font-size: 14px; line-height: 22px; color: var(--color-text-primary); }
.menu-item { color: var(--color-text-primary); }
.menu-item { font-size: var(--text-small-size); }
```

### Mobile menu

Dropdown · 1 variant: Default
States captured: Default
Tokens used: color-text-primary (color), color-gray-border (border-color), space-8 (padding-top), space-16 (padding-bottom), type-body (font)
Motion: none
Checks: all pass
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
.mobile-menu { border-top: 1px solid var(--color-gray-border); padding: var(--space-8) 0px var(--space-16); }
a { color: var(--color-blue-600); text-decoration: none; }
.mobile-link { display: flex; align-items: center; height: 48px; font-size: 16px; line-height: 26px; color: var(--color-text-primary); }
```

## Drift

Nothing to collapse. 9 colors, 11 spacing steps, all on the grid.

Proposed set: 9 colors, 11 spacing steps, 9 type styles, 5 durations, 2 easings. Every proposed pair keeps or improves its contrast ratio on the surfaces it is used on.

Nothing drifts here. The system is built from nine colors, nine type styles and 11 spacing steps, and every spacing step sits on the grid. No colors sit within reach of a neighbor, no type styles overlap and no component variants collapse. The proposed set keeps the same nine type styles and 11 spacing steps, with three grays. Every pair of text and background keeps its contrast ratio.

## How this was made

Extracted by Design System Extractor from localhost:4100 in run evalclean0 on 2026-10-12. Tokens, motion, components and checks are measured from the rendered pages; motion marked observed was measured at runtime. The introduction and the drift narrative were written by a model from those measurements. Tokens shown are the raw set. 28 of 29 components are live previews; 1 are captured images.
