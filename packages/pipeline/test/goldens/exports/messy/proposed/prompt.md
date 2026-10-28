You are building an interface that must match this design system exactly.

## Tokens

```css
:root {
  --color-gray-50: #FFFFFF;
  --color-gray-300: #D1D1D1;
  --color-gray-300b: #C4C4C4;
  --color-gray-400: #B1B1B1;
  --color-gray-500: #868686;
  --color-gray-600: #676767;
  --color-gray-700: #505050;
  --color-gray-800: #353535;
  --color-gray-900: #1F1F1F;
  --color-blue-900: #0B1F3A;
  --color-blue-600: #2458E6;
  --color-blue-600b: #1C4EDB;
  --color-teal-500: #0F8A8A;
  --color-success: #15803D;
  --color-danger: #DC2626;
  --color-warning: #F59E0B;

  --overlay-blue-900-12: rgb(11 31 58 / 12%);
  --overlay-black-4: rgb(0 0 0 / 4%);
  --overlay-gray-700-30: rgb(80 80 80 / 30%);
  --overlay-gray-800-20: rgb(53 53 53 / 20%);

  --font-sans: Inter, system-ui, sans-serif;

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
  --type-body-xs-size: 14px;
  --type-body-xs-line: 22px;
  --type-body-xs-weight: 400;
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
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-pill: 9999px;

  --shadow-sm: 0px 1px 2px 0px #0B1F3A1F;
  --shadow-md: 0px 12px 32px 0px #0B1F3A1F;

  --duration-100: 100ms;
  --duration-120: 120ms;
  --duration-150: 150ms;
  --duration-160: 160ms;
  --duration-200: 200ms;
  --duration-250: 250ms;
  --duration-300: 300ms;
  --duration-400: 400ms;
  --duration-1600: 1600ms;
  --duration-faster: var(--duration-120);
  --duration-fast: var(--duration-150);
  --duration-base: var(--duration-160);
  --duration-slow: var(--duration-200);
  --duration-slower: var(--duration-250);

  --ease-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-out: ease-out;
  --ease: ease;
  --ease-linear: linear;
  --ease-custom-1: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in-out: ease-in-out;

  --breakpoint-sm: 640px;
  --breakpoint-md: 1024px;
}
```

## Type scale

| Name | Size | Line height | Weight | Family |
| --- | --- | --- | --- | --- |
| display | 48px | 56px | 700 | Inter |
| title | 36px | 44px | 700 | Inter |
| title-sm | 28px | 36px | 700 | Inter |
| subheading | 20px | 28px | 600 | Inter |
| body | 16px | 26px | 400 | Inter |
| text-14 | 14px | 20px | 600 | Inter |
| body-xs | 14px | 22px | 400 | Inter |
| caption | 12px | 16px | 400 | Inter |

## Motion

Durations:

| Name | Value | Role |
| --- | --- | --- |
| duration-100 | 100 ms |  |
| duration-120 | 120 ms | Faster |
| duration-150 | 150 ms | Fast |
| duration-160 | 160 ms | Base |
| duration-200 | 200 ms | Slow |
| duration-250 | 250 ms | Slower |
| duration-300 | 300 ms |  |
| duration-400 | 400 ms |  |
| duration-1600 | 1600 ms |  |

Easings:

| Name | Value |
| --- | --- |
| ease-out-quad | cubic-bezier(0.25, 0.46, 0.45, 0.94) |
| ease-out | ease-out |
| ease | ease |
| linear | linear |
| ease-custom-1 | cubic-bezier(0.4, 0, 0.2, 1) |
| ease-in-out | ease-in-out |

Keyframes:

```css
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
```

Patterns:

- Scrolled header · Site header · after 400 px of scrolling · box-shadow none → 0px 12px 32px 0px #0B1F3A1F · 160 ms · ease-out-quad
- Loop · Status badge · loops every 1,600 ms · opacity 1 → 0.3 · 1,600 ms · ease-in-out

## Site variables

The site declares no variables beyond the tokens.

## Core components

### Button

Button. Variants: Primary small, Primary, Ghost, Secondary, Primary rounded, Secondary small, Ghost small.
States: Default, Hover, Focus, Active, Disabled.
- Hover: background-color #EBEBEB (160 ms)
- Focus: outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
- Active: background-color #EBEBEB (160 ms)
Tokens: color-blue-900 for color, radius-sm for border-radius, space-20 for padding-right, space-20 for padding-left, type-text-14 for font, duration-160 for transition-duration, ease-out-quad for transition-timing-function.
Default: text color-blue-900 · border 1px rgba(0, 0, 0, 0) · radius radius-sm · padding 0px space-20 0px space-20 · font type-text-14
Motion: hover · background-color · 160 ms · ease-out-quad; active · background-color · 160 ms · ease-out-quad
Checks: all pass

```css
a { color: var(--color-blue-600b); text-decoration: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8); height: 44px; padding: 0px var(--space-20); border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color var(--duration-160) var(--ease-out-quad), color var(--duration-160) var(--ease-out-quad), transform var(--duration-160) var(--ease-out-quad), box-shadow var(--duration-160) var(--ease-out-quad); }
.btn-ghost { background: transparent; color: var(--color-blue-900); }
```

### Dropdown trigger

Button. Variants: Default.
States: Default, Hover, Focus, Active, Open.
- Hover: background-color #EBEBEB
- Focus: outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
- Active: background-color #EBEBEB
- Open: background-color #EBEBEB
Tokens: color-blue-900 for color, radius-sm for border-radius, space-12 for padding-right, space-12 for padding-left, type-text-14 for font.
Default: text color-blue-900 · radius radius-sm · padding 0px space-12 0px space-12 · font type-text-14
Motion: none
Checks: all pass

```css
button { padding: 0px; padding: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.dropdown-trigger { display: inline-flex; align-items: center; gap: var(--space-4); height: 44px; padding: 0px var(--space-12); border: 0px; border-radius: var(--radius-sm); background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-blue-900); cursor: pointer; }
svg { display: block; }
```

### Menu button

Button. Variants: Default.
States: Default, Hover, Focus, Active, Open.
- Focus: outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
Tokens: radius-sm for border-radius.
Default: radius radius-sm
Motion: none
Checks: all pass

```css
button { padding: 0px; padding: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.menu-button { display: none; align-items: center; justify-content: center; width: 44px; height: 44px; border: 0px; border-radius: var(--radius-sm); background: transparent; color: var(--color-blue-900); cursor: pointer; }
.menu-button { display: inline-flex; }
svg { display: block; }
```

### Tab

Button. Variants: Default.
States: Default, Hover, Focus, Active, Selected.
- Focus: outline-width 2px; outline-style solid; outline-offset 2px
Tokens: color-blue-600 for color, space-16 for padding-right, space-16 for padding-left, type-text-14 for font, duration-250 for transition-duration, ease-custom-1 for transition-timing-function.
Default: text color-blue-600 · padding 0px space-16 0px space-16 · font type-text-14
Motion: none
Checks: all pass

```css
button { padding: 0px; padding: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.tab { height: 44px; padding: 0px var(--space-16); border-width: 0px 0px 2px; border-style: none none solid; border-color: currentcolor currentcolor transparent; border-image: none; background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-blue-900); cursor: pointer; }
.tab[aria-selected="true"] { color: var(--color-blue-600); border-bottom-color: var(--color-blue-600); }
.tab { transition: color var(--duration-250) var(--ease-custom-1); }
```

### Share button

Button. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
Tokens: none.
Default: radius 6px
Motion: none
Checks: 2 of 3

```css
button { padding: 0px; padding: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.share-button { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: 0px; border-radius: 6px; background: transparent; color: var(--color-gray-900); cursor: pointer; }
svg { display: block; }
```

### Release notes link

Link. Variants: Default.
States: Default, Hover, Focus, Active.
Tokens: color-gray-900 for color, overlay-gray-700-30 for border-color, radius-pill for border-radius, space-16 for padding-right, space-16 for padding-left, type-text-14 for font, duration-300 for transition-duration, ease for transition-timing-function.
Default: text color-gray-900 · border 1px overlay-gray-700-30 · radius radius-pill · padding 0px space-16 0px space-16 · font type-text-14
Motion: none
Checks: 3 of 4

```css
a { color: var(--color-blue-600b); text-decoration: none; }
.link-pill { display: inline-flex; align-items: center; height: 44px; padding: 0px var(--space-16); border: 1px solid var(--color-gray-300); border-radius: 999px; color: var(--color-gray-900); font-size: 14px; line-height: 20px; font-weight: 600; }
.link-pill { transition: border-color var(--duration-300); }
.link-pill { border-color: var(--overlay-gray-700-30); }
```

### Newsletter input

Text input. Variants: Default.
States: Default, Hover, Focus, Active, Error.
- Focus: border-color #2458E6; outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
- Active: border-color #2458E6; outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
Tokens: color-gray-50 for background-color, color-gray-300 for border-color, radius-sm for border-radius, space-8 for padding-top, space-12 for padding-right, space-8 for padding-bottom, space-12 for padding-left.
Default: background color-gray-50 · border 1px color-gray-300 · radius radius-sm · padding space-8 space-12 space-8 space-12
Motion: none
Checks: 3 of 4

```css
input { padding: 0px; padding: 0px; padding: 0px; }
input { font: inherit; color: inherit; }
.input { width: 100%; height: 44px; padding: var(--space-8) var(--space-12); border: 1px solid var(--color-gray-300); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-blue-900); font-size: 16px; line-height: 26px; }
.newsletter-input { width: 240px; }
.newsletter-input::placeholder { color: rgb(115, 115, 115); }
```

### Toggle

Toggle. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
Tokens: none.
Default: background none
Motion: none
Checks: all pass

```css
button { padding: 0px; padding: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.toggle { position: relative; flex: 0 0 auto; width: 52px; height: 44px; border: 0px; background: transparent; cursor: pointer; }
.toggle::before { content: ""; position: absolute; left: 4px; top: 10px; width: 44px; height: 24px; border-radius: 999px; background: rgb(235, 235, 235); }
.toggle::after { content: ""; position: absolute; left: 8px; top: 14px; width: 16px; height: 16px; border-radius: 999px; background: var(--color-gray-50); transition: transform var(--duration-160) var(--ease-out-quad); }
```

### Team size select

Select. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: border-color #2458E6; outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
- Active: border-color #2458E6; outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
Tokens: color-gray-50 for background-color, color-blue-900 for color, color-gray-300 for border-color, radius-sm for border-radius, space-8 for padding-top, space-40 for padding-right, space-8 for padding-bottom, space-12 for padding-left, type-body for font.
Default: background color-gray-50 · text color-blue-900 · border 1px color-gray-300 · radius radius-sm · padding space-8 space-40 space-8 space-12 · font type-body
Motion: none
Checks: all pass

```css
select { padding: 0px; padding: 0px; padding: 0px; }
select { font: inherit; color: inherit; }
.select { width: 100%; height: 44px; padding: var(--space-8) var(--space-12); border: 1px solid var(--color-gray-300); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-blue-900); font-size: 16px; line-height: 26px; }
.select { appearance: none; padding-right: var(--space-40); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230B1F3A' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
```

### Checkbox

Checkbox. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
Tokens: radius-sm for border-radius.
Default: radius radius-sm
Motion: none
Checks: all pass

```css
input { padding: 0px; padding: 0px; padding: 0px; }
input { font: inherit; color: inherit; }
.checkbox { appearance: none; flex: 0 0 auto; width: 44px; height: 44px; margin: 0px -12px; border: 0px; border-radius: var(--radius-sm); background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect x='0.5' y='0.5' width='19' height='19' rx='3.5' fill='%23FFFFFF' stroke='%230B1F3A'/%3E%3C/svg%3E") center center no-repeat transparent; cursor: pointer; }
```

### Textarea

Textarea. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: border-color #2458E6; outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
- Active: border-color #2458E6; outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
Tokens: color-gray-50 for background-color, color-gray-300 for border-color, radius-sm for border-radius, space-8 for padding-top, space-12 for padding-right, space-8 for padding-bottom, space-12 for padding-left.
Default: background color-gray-50 · border 1px color-gray-300 · radius radius-sm · padding space-8 space-12 space-8 space-12
Motion: none
Checks: all pass

```css
textarea { padding: 0px; padding: 0px; padding: 0px; }
textarea { font: inherit; color: inherit; }
.textarea { width: 100%; height: 44px; padding: var(--space-8) var(--space-12); border: 1px solid var(--color-gray-300); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-blue-900); font-size: 16px; line-height: 26px; }
.textarea { height: 128px; resize: vertical; }
```

### Site header

Header. Variants: Default.
States: Default, Scrolled.
- Scrolled: box-shadow 0px 12px 32px 0px #0B1F3A1F (160 ms)
Tokens: color-gray-50 for background-color, color-gray-900 for color, type-body for font, duration-160 for transition-duration, ease-out-quad for transition-timing-function.
Default: background color-gray-50 · text color-gray-900 · font type-body
Motion: scrolled · box-shadow · 160 ms · ease-out-quad; 1 motion pattern in the Motion section
Checks: all pass

```css
button { padding: 0px; padding: 0px; padding: 0px; }
.site-header { position: relative; top: 0px; z-index: 10; background: var(--color-gray-50); border-bottom: 1px solid var(--color-gray-500); transition: box-shadow var(--duration-160) var(--ease-out-quad); }
.container { max-width: 1120px; margin: 0px auto; padding: 0px var(--space-24); }
.header-inner { display: flex; align-items: center; justify-content: space-between; gap: var(--space-32); height: 72px; }
a { color: var(--color-blue-600b); text-decoration: none; }
.logo { font-size: 20px; line-height: 28px; font-weight: 600; color: var(--color-gray-800); }
.logo { transition: color var(--duration-150) var(--ease-linear); }
.nav-links { display: flex; align-items: center; gap: var(--space-24); }
.nav-link { font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-gray-700); }
.nav-link { transition: color var(--duration-100); }
.dropdown { position: relative; }
button { font: inherit; color: inherit; }
.dropdown-trigger { display: inline-flex; align-items: center; gap: var(--space-4); height: 44px; padding: 0px var(--space-12); border: 0px; border-radius: var(--radius-sm); background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-blue-900); cursor: pointer; }
svg { display: block; }
.dropdown-menu { position: absolute; top: 48px; left: 0px; z-index: 20; min-width: 224px; padding: var(--space-8); background: var(--color-gray-50); border: 1px solid var(--color-gray-300b); border-radius: var(--radius-lg); box-shadow: var(--overlay-blue-900-12) 0px 12px 32px; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8); height: 44px; padding: 0px var(--space-20); border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color var(--duration-160) var(--ease-out-quad), color var(--duration-160) var(--ease-out-quad), transform var(--duration-160) var(--ease-out-quad), box-shadow var(--duration-160) var(--ease-out-quad); }
.btn-ghost { background: transparent; color: var(--color-blue-900); }
.btn-primary { background: var(--color-blue-600); color: var(--color-gray-50); }
.menu-button { display: none; align-items: center; justify-content: center; width: 44px; height: 44px; border: 0px; border-radius: var(--radius-sm); background: transparent; color: var(--color-blue-900); cursor: pointer; }
.mobile-menu { border-top: 1px solid var(--color-gray-500); padding: var(--space-8) 0px var(--space-16); }
```

### Site footer

Footer. Variants: Default.
States: Default.
Tokens: color-gray-900 for color, color-gray-300 for border-color, space-48 for padding-top, space-48 for padding-bottom, type-body for font.
Default: text color-gray-900 · border 1px color-gray-300 · padding space-48 0px space-48 0px · font type-body
Motion: none
Checks: all pass

```css
p { margin: 0px; margin: 0px; margin: 0px; }
button, input { padding: 0px; padding: 0px; padding: 0px; }
.site-footer { border-top: 1px solid rgb(225, 225, 225); padding: var(--space-48) 0px; }
.container { max-width: 1120px; margin: 0px auto; padding: 0px var(--space-24); }
.footer-inner { display: flex; justify-content: space-between; gap: var(--space-32); flex-wrap: wrap; }
.stack { display: flex; flex-direction: column; gap: var(--space-16); }
.logo { font-size: 20px; line-height: 28px; font-weight: 600; color: var(--color-gray-800); }
.logo { transition: color var(--duration-150) var(--ease-linear); }
p { font-size: 16px; line-height: 26px; }
.caption { font-size: 12px; line-height: 16px; color: rgb(115, 115, 115); }
.footer-links { display: flex; gap: var(--space-24); flex-wrap: wrap; }
a { color: var(--color-blue-600b); text-decoration: none; }
.footer-link { font-size: 14px; line-height: 22px; color: var(--color-gray-600); }
.footer-link { transition: color var(--duration-120) var(--ease-out); }
.newsletter { display: flex; gap: var(--space-8); align-items: center; }
input, button { font: inherit; color: inherit; }
.input { width: 100%; height: 44px; padding: var(--space-8) var(--space-12); border: 1px solid var(--color-gray-300); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-blue-900); font-size: 16px; line-height: 26px; }
.newsletter-input { width: 240px; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8); height: 44px; padding: 0px var(--space-20); border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color var(--duration-160) var(--ease-out-quad), color var(--duration-160) var(--ease-out-quad), transform var(--duration-160) var(--ease-out-quad), box-shadow var(--duration-160) var(--ease-out-quad); }
.btn-sm { height: 36px; padding: 0px var(--space-16); }
.btn-primary { background: var(--color-blue-600); color: var(--color-gray-50); }
.newsletter-input::placeholder { color: rgb(115, 115, 115); }
```

### Footer links

Nav bar. Variants: Default.
States: Default.
Tokens: color-gray-900 for color, type-body for font.
Default: text color-gray-900 · font type-body
Motion: none
Checks: all pass

```css
.footer-links { display: flex; gap: var(--space-24); flex-wrap: wrap; }
a { color: var(--color-blue-600b); text-decoration: none; }
.footer-link { font-size: 14px; line-height: 22px; color: var(--color-gray-600); }
.footer-link { transition: color var(--duration-120) var(--ease-out); }
```

### Main navigation

Nav bar. Variants: Default.
States: Default.
Tokens: color-gray-900 for color, type-body for font.
Default: text color-gray-900 · font type-body
Motion: none
Checks: all pass

```css
button { padding: 0px; padding: 0px; padding: 0px; }
.nav-links { display: flex; align-items: center; gap: var(--space-24); }
a { color: var(--color-blue-600b); text-decoration: none; }
.nav-link { font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-gray-700); }
.nav-link { transition: color var(--duration-100); }
.dropdown { position: relative; }
button { font: inherit; color: inherit; }
.dropdown-trigger { display: inline-flex; align-items: center; gap: var(--space-4); height: 44px; padding: 0px var(--space-12); border: 0px; border-radius: var(--radius-sm); background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-blue-900); cursor: pointer; }
svg { display: block; }
.dropdown-menu { position: absolute; top: 48px; left: 0px; z-index: 20; min-width: 224px; padding: var(--space-8); background: var(--color-gray-50); border: 1px solid var(--color-gray-300b); border-radius: var(--radius-lg); box-shadow: var(--overlay-blue-900-12) 0px 12px 32px; }
```

### Feature card

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, color-gray-900 for color, color-gray-300 for border-color, radius-lg for border-radius, space-16 for padding-top, space-16 for padding-right, space-16 for padding-bottom, space-16 for padding-left, type-body for font, shadow-sm for box-shadow, duration-400 for transition-duration, ease-out for transition-timing-function.
Default: background color-gray-50 · text color-gray-900 · border 1px color-gray-300 · radius radius-lg · padding space-16 space-16 space-16 space-16 · font type-body · shadow shadow-sm
Motion: none
Checks: all pass

```css
h3, p { margin: 0px; margin: 0px; margin: 0px; }
.card { display: flex; flex-direction: column; gap: var(--space-12); padding: 18px; background: var(--color-gray-50); border: 1px solid rgb(225, 225, 225); border-radius: var(--radius-lg); box-shadow: var(--overlay-blue-900-12) 0px 1px 2px; }
.card { transition: box-shadow var(--duration-400) var(--ease-out); }
.feature-icon { width: 24px; height: 24px; color: var(--color-teal-500); }
svg { display: block; }
.tag-new { display: inline-flex; align-items: center; align-self: flex-start; height: 24px; padding: 0px 10px; border-radius: 999px; background: var(--color-teal-500); color: var(--color-gray-50); font-size: 12px; line-height: 16px; }
h3 { font-size: 20px; line-height: 28px; font-weight: 600; }
h3 { color: var(--color-gray-800); }
p { font-size: 16px; line-height: 26px; }
.text-sm { font-size: 14px; line-height: 22px; color: var(--color-gray-700); }
.card .text-sm { font-size: 15px; }
```

### Changelog entry

List row. Variants: Default.
States: Default.
Tokens: overlay-black-4 for background-color, color-gray-900 for color, space-16 for padding-left, type-body for font.
Default: background overlay-black-4 · text color-gray-900 · padding 0px 0px 0px space-16 · font type-body
Motion: none
Checks: 0 of 1

```css
h3, p { margin: 0px; margin: 0px; margin: 0px; }
.release { display: flex; flex-direction: column; gap: var(--space-8); padding-left: var(--space-16); border-left: 2px solid rgb(225, 225, 225); }
.release { background: var(--overlay-black-4); border-left-color: rgba(51, 51, 51, 0.2); }
.caption { font-size: 12px; line-height: 16px; color: rgb(115, 115, 115); }
h3 { font-size: 20px; line-height: 28px; font-weight: 600; }
h3 { color: var(--color-gray-800); }
p { font-size: 16px; line-height: 26px; }
.text-sm { font-size: 14px; line-height: 22px; color: var(--color-gray-700); }
```

### Status badge

Badge. Variants: Success, Danger, Warning.
States: Default.
Tokens: color-success for background-color, color-gray-50 for color, radius-pill for border-radius, space-8 for padding-right, space-8 for padding-left, type-caption for font.
Default: background color-success · text color-gray-50 · radius radius-pill · padding 0px space-8 0px space-8 · font type-caption
Motion: 1 motion pattern in the Motion section
Checks: 0 of 2

```css
.badge { display: inline-flex; align-items: center; height: 24px; padding: 0px 10px; border-radius: 999px; color: var(--color-gray-50); font-size: 12px; line-height: 16px; }
.badge-success { background: var(--color-success); }
```

### New tag

Tag. Variants: Default.
States: Default.
Tokens: color-teal-500 for background-color, color-gray-50 for color, radius-pill for border-radius, space-8 for padding-right, space-8 for padding-left, type-caption for font.
Default: background color-teal-500 · text color-gray-50 · radius radius-pill · padding 0px space-8 0px space-8 · font type-caption
Motion: none
Checks: 0 of 1

```css
.tag-new { display: inline-flex; align-items: center; align-self: flex-start; height: 24px; padding: 0px 10px; border-radius: 999px; background: var(--color-teal-500); color: var(--color-gray-50); font-size: 12px; line-height: 16px; }
```

### Avatar

Avatar. Variants: Default.
States: Default.
Tokens: color-gray-300 for background-color, radius-pill for border-radius.
Default: background color-gray-300 · radius radius-pill
Motion: none

```css
.avatar { width: 40px; height: 40px; border-radius: 50%; background: rgb(235, 235, 235); }
```

## Page-specific components

### Icon button

Button. Variants: Default.
States: Default, Hover, Focus, Active.
- Hover: background-color #EBEBEB
- Focus: outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
- Active: background-color #EBEBEB
Tokens: color-gray-50 for background-color, color-gray-400 for border-color, radius-sm for border-radius.
Default: background color-gray-50 · border 1px color-gray-400 · radius radius-sm
Motion: none
Checks: 2 of 3

### Breadcrumb

Breadcrumb. Variants: Default.
States: Default.
Tokens: color-gray-900 for color, type-body for font.
Default: text color-gray-900 · font type-body
Motion: none
Checks: all pass

### Feature tabs

Tabs. Variants: Default.
States: Default.
Tokens: color-gray-900 for color, type-body for font.
Default: text color-gray-900 · font type-body
Motion: none

### Pricing card

Card. Variants: Primary, Secondary.
States: Default.
Tokens: color-gray-50 for background-color, color-gray-900 for color, color-gray-300 for border-color, radius-lg for border-radius, space-32 for padding-top, space-32 for padding-right, space-32 for padding-bottom, space-32 for padding-left, type-body for font, shadow-sm for box-shadow, duration-400 for transition-duration, ease-out for transition-timing-function.
Default: background color-gray-50 · text color-gray-900 · border 1px color-gray-300 · radius radius-lg · padding space-32 space-32 space-32 space-32 · font type-body · shadow shadow-sm
Motion: none
Checks: 0 of 1

### Promo card

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for color, radius-lg for border-radius, space-32 for padding-top, space-32 for padding-right, space-32 for padding-bottom, space-32 for padding-left, type-body for font.
Default: text color-gray-50 · radius radius-lg · padding space-32 space-32 space-32 space-32 · font type-body
Motion: none
Checks: all pass

### Notice

Alert. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, color-blue-900 for color, color-success for border-color, radius-sm for border-radius, space-16 for padding-top, space-16 for padding-right, space-16 for padding-bottom, space-16 for padding-left, type-body for font.
Default: background color-gray-50 · text color-blue-900 · border 1px color-success · radius radius-sm · padding space-16 space-16 space-16 space-16 · font type-body
Motion: none
Checks: all pass

### Not found state

Empty state. Variants: Default.
States: Default.
Tokens: color-gray-900 for color, color-gray-300 for border-color, radius-lg for border-radius, space-96 for padding-top, space-24 for padding-right, space-96 for padding-bottom, space-24 for padding-left, type-body for font.
Default: text color-gray-900 · border 1px color-gray-300 · radius radius-lg · padding space-96 space-24 space-96 space-24 · font type-body
Motion: none
Checks: all pass

### Pricing comparison table

Table. Variants: Default.
States: Default.
Tokens: color-gray-900 for color, type-body-xs for font.
Default: text color-gray-900 · font type-body-xs
Motion: none
Checks: all pass

### Code block

Code block. Variants: Default.
States: Default.
Tokens: color-blue-900 for background-color, color-gray-50 for color, radius-sm for border-radius, space-16 for padding-top, space-24 for padding-right, space-16 for padding-bottom, space-24 for padding-left.
Default: background color-blue-900 · text color-gray-50 · radius radius-sm · padding space-16 space-24 space-16 space-24 · font 14px 400
Motion: none
Checks: all pass

### Resources dropdown

Dropdown. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, color-gray-900 for color, color-gray-300b for border-color, radius-lg for border-radius, space-8 for padding-top, space-8 for padding-right, space-8 for padding-bottom, space-8 for padding-left, type-body for font, shadow-md for box-shadow.
Default: background color-gray-50 · text color-gray-900 · border 1px color-gray-300b · radius radius-lg · padding space-8 space-8 space-8 space-8 · font type-body · shadow shadow-md
Motion: none
Checks: all pass

### Mobile menu

Dropdown. Variants: Default.
States: Default.
Tokens: color-gray-900 for color, color-gray-500 for border-color, space-8 for padding-top, space-16 for padding-bottom, type-body for font.
Default: text color-gray-900 · border 1px color-gray-500 · padding space-8 0px space-16 0px · font type-body
Motion: none
Checks: all pass

## Rules

- Use only these tokens. Do not invent colors, sizes, spacing, radii or shadows.
- Keep every text and background pair at the contrast ratio it has here.
- Match each component contract, including its states.
- Keep every component that passes all checks passing: contrast pairs, focus visibility, tap target size.
- Use only these durations and easings. Apply the entrance and scroll patterns to the equivalent elements of what you build; patterns marked observed were measured at runtime and their easing is the nearest token when none was recorded.
- No em dashes in any copy you write.

Source: https://design-system-extractor.vercel.app/r/evalmessy0
