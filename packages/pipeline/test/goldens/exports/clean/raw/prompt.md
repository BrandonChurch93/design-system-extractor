You are building an interface that must match this design system exactly.

## Tokens

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

## Type scale

| Name | Size | Line height | Weight | Family |
| --- | --- | --- | --- | --- |
| display | 48px | 56px | 700 | Inter |
| title | 36px | 44px | 700 | Inter |
| title-sm | 28px | 36px | 700 | Inter |
| subheading | 20px | 28px | 600 | Inter |
| body | 16px | 26px | 400 | Inter |
| text-14 | 14px | 20px | 600 | Inter |
| text-small | 14px | 22px | 400 | Inter |
| code | 14px | 22px | 400 | ui-monospace |
| caption | 12px | 16px | 400 | Inter |

## Motion

Durations:

| Name | Value | Role |
| --- | --- | --- |
| duration-120 | 120 ms | Fast |
| duration-160 | 160 ms | Base |
| duration-240 | 240 ms | Slow |
| duration-480 | 480 ms | Slower |
| duration-1600 | 1600 ms |  |

Easings:

| Name | Value |
| --- | --- |
| ease-out-quad | cubic-bezier(0.25, 0.46, 0.45, 0.94) |
| ease-out-quart | cubic-bezier(0.25, 1, 0.5, 1) |

Keyframes:

```css
@keyframes fade-up { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: none; } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
```

Patterns:

- Entrance · h1.display · on load · opacity 0 → 1, transform translateY(12px) → none · 480 ms · ease-out-quart
- Scroll reveal · Feature card · when it enters the viewport at 15% from the bottom · opacity 0 → 1, transform translateY(16px) → none · 240 ms · ease-out-quart · 3 items · 60 ms apart
- Scroll reveal · div.testimonial · when it enters the viewport at 25% from the bottom · opacity 0.02 → 1, transform translateY(15.6px) → translateY(0px) · about 400 ms · easing not recorded, nearest token suggested: ease-out-quad · observed
- Scrolled header · Site header · after 400 px of scrolling · box-shadow none → 0px 12px 32px 0px #0B1F3A1F · 160 ms · ease-out-quad
- Loop · Notice · loops every 1,600 ms · opacity 1 → 0.4 · 1,600 ms · ease-out-quart

## Site variables

```css
/* Site variables, resolved */
:root {
  --text-small-size: 14px;
}
```

## Core components

### Button

Button. Variants: Primary, Ghost, Secondary, Ghost rounded, Secondary small, Primary small, Ghost small.
States: Default, Hover, Focus, Active, Disabled.
- Hover: background-color #E2E8F0 (160 ms); box-shadow 0px 1px 2px 0px #0B1F3A1F (160 ms); transform translateY(-1px) (160 ms)
- Focus: outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
- Active: background-color #E2E8F0 (160 ms); box-shadow 0px 1px 2px 0px #0B1F3A1F (160 ms); transform translateY(-1px) (160 ms)
Tokens: color-text-primary for color, radius-sm for border-radius, space-20 for padding-right, space-20 for padding-left, type-text-14 for font, duration-160 for transition-duration, ease-out-quad for transition-timing-function.
Default: text color-text-primary · border 1px rgba(0, 0, 0, 0) · radius radius-sm · padding 0px space-20 0px space-20 · font type-text-14
Motion: hover · background-color · 160 ms · ease-out-quad; hover · box-shadow · 160 ms · ease-out-quad; hover · transform · 160 ms · ease-out-quad; active · background-color · 160 ms · ease-out-quad; active · box-shadow · 160 ms · ease-out-quad; active · transform · 160 ms · ease-out-quad
Checks: all pass

```css
a { color: var(--color-blue-600); text-decoration: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8); height: 44px; padding: 0px var(--space-20); border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color var(--duration-160) var(--ease-out-quad), color var(--duration-160) var(--ease-out-quad), transform var(--duration-160) var(--ease-out-quad), box-shadow var(--duration-160) var(--ease-out-quad); }
.btn-ghost { background: transparent; color: var(--color-text-primary); }
.btn-ghost { color: var(--color-text-primary); }
.btn { font-size: var(--text-small-size); }
```

### Skip link

Link. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
Tokens: color-text-primary for background-color, color-gray-50 for color, radius-sm for border-radius, space-16 for padding-right, space-16 for padding-left, type-text-14 for font.
Default: background color-text-primary · text color-gray-50 · radius radius-sm · padding 0px space-16 0px space-16 · font type-text-14
Motion: none
Checks: all pass

```css
a { color: var(--color-blue-600); text-decoration: none; }
.skip-link { position: absolute; top: 12px; left: 24px; z-index: 30; display: inline-flex; align-items: center; height: 44px; padding: 0px var(--space-16); border-radius: var(--radius-sm); background: var(--color-text-primary); color: var(--color-gray-50); font-size: 14px; line-height: 20px; font-weight: 600; clip-path: inset(50%); }
```

### Dropdown trigger

Button. Variants: Default.
States: Default, Hover, Focus, Active, Open.
- Hover: background-color #E2E8F0
- Focus: outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
- Active: background-color #E2E8F0
- Open: background-color #E2E8F0
Tokens: color-text-primary for color, radius-sm for border-radius, space-12 for padding-right, space-12 for padding-left, type-text-14 for font.
Default: text color-text-primary · radius radius-sm · padding 0px space-12 0px space-12 · font type-text-14
Motion: none
Checks: 2 of 3

```css
button { padding: 0px; padding: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.dropdown-trigger { display: inline-flex; align-items: center; gap: var(--space-4); height: 44px; padding: 0px var(--space-12); border: 0px; border-radius: var(--radius-sm); background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-text-primary); cursor: pointer; }
.dropdown-trigger { color: var(--color-text-primary); }
.dropdown-trigger { font-size: var(--text-small-size); }
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
.menu-button { display: none; align-items: center; justify-content: center; width: 44px; height: 44px; border: 0px; border-radius: var(--radius-sm); background: transparent; color: var(--color-text-primary); cursor: pointer; }
.menu-button { display: inline-flex; }
svg { display: block; }
```

### Tab button

Button. Variants: Default.
States: Default, Hover, Focus, Active, Selected.
- Focus: box-shadow inset 0px -2px 0px 0px #0B1F3A
Tokens: color-blue-600 for color, space-16 for padding-right, space-16 for padding-left, type-text-14 for font.
Default: text color-blue-600 · padding 0px space-16 0px space-16 · font type-text-14
Motion: none
Checks: all pass

```css
button { padding: 0px; padding: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.tab { height: 44px; padding: 0px var(--space-16); border-width: 0px 0px 2px; border-style: none none solid; border-color: currentcolor currentcolor transparent; border-image: none; background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-text-primary); cursor: pointer; }
.tab[aria-selected="true"] { color: var(--color-blue-600); border-bottom-color: var(--color-blue-600); }
.tab { font-size: var(--text-small-size); }
```

### Text input

Text input. Variants: Default.
States: Default, Hover, Focus, Active, Error.
- Focus: border-color #2458E6; outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
- Active: border-color #2458E6; outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
Tokens: color-gray-50 for background-color, color-gray-border for border-color, radius-sm for border-radius, space-8 for padding-top, space-12 for padding-right, space-8 for padding-bottom, space-12 for padding-left.
Default: background color-gray-50 · border 1px color-gray-border · radius radius-sm · padding space-8 space-12 space-8 space-12
Motion: none
Checks: all pass

```css
input { padding: 0px; padding: 0px; padding: 0px; }
input { font: inherit; color: inherit; }
.input { width: 100%; height: 44px; padding: var(--space-8) var(--space-12); border: 1px solid var(--color-gray-border); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-text-primary); font-size: 16px; line-height: 26px; }
```

### Billing toggle

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
.toggle::before { content: ""; position: absolute; left: 4px; top: 10px; width: 44px; height: 24px; border-radius: 999px; background: var(--color-gray-border); }
.toggle::after { content: ""; position: absolute; left: 8px; top: 14px; width: 16px; height: 16px; border-radius: 999px; background: var(--color-gray-50); transition: transform var(--duration-160) var(--ease-out-quad); }
```

### Select

Select. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: border-color #2458E6; outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
- Active: border-color #2458E6; outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
Tokens: color-gray-50 for background-color, color-text-primary for color, color-gray-border for border-color, radius-sm for border-radius, space-8 for padding-top, space-40 for padding-right, space-8 for padding-bottom, space-12 for padding-left, type-body for font.
Default: background color-gray-50 · text color-text-primary · border 1px color-gray-border · radius radius-sm · padding space-8 space-40 space-8 space-12 · font type-body
Motion: none
Checks: all pass

```css
select { padding: 0px; padding: 0px; padding: 0px; }
select { font: inherit; color: inherit; }
.select { width: 100%; height: 44px; padding: var(--space-8) var(--space-12); border: 1px solid var(--color-gray-border); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-text-primary); font-size: 16px; line-height: 26px; }
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

### Text area

Textarea. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: border-color #2458E6; outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
- Active: border-color #2458E6; outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
Tokens: color-gray-50 for background-color, color-gray-border for border-color, radius-sm for border-radius, space-8 for padding-top, space-12 for padding-right, space-8 for padding-bottom, space-12 for padding-left.
Default: background color-gray-50 · border 1px color-gray-border · radius radius-sm · padding space-8 space-12 space-8 space-12
Motion: none
Checks: all pass

```css
textarea { padding: 0px; padding: 0px; padding: 0px; }
textarea { font: inherit; color: inherit; }
.textarea { width: 100%; height: 44px; padding: var(--space-8) var(--space-12); border: 1px solid var(--color-gray-border); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-text-primary); font-size: 16px; line-height: 26px; }
.textarea { height: 128px; resize: vertical; }
```

### Site header

Header. Variants: Default.
States: Default, Scrolled.
- Scrolled: box-shadow 0px 12px 32px 0px #0B1F3A1F (160 ms)
Tokens: color-gray-50 for background-color, color-text-primary for color, type-body for font, duration-160 for transition-duration, ease-out-quad for transition-timing-function.
Default: background color-gray-50 · text color-text-primary · font type-body
Motion: scrolled · box-shadow · 160 ms · ease-out-quad; 1 motion pattern in the Motion section
Checks: all pass

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

Footer. Variants: Default.
States: Default.
Tokens: color-text-primary for color, color-gray-border for border-color, space-48 for padding-top, space-48 for padding-bottom, type-body for font.
Default: text color-text-primary · border 1px color-gray-border · padding space-48 0px space-48 0px · font type-body
Motion: none
Checks: all pass

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

Nav bar. Variants: Default.
States: Default.
Tokens: color-text-primary for color, type-body for font.
Default: text color-text-primary · font type-body
Motion: none
Checks: all pass

```css
.footer-links { display: flex; gap: var(--space-24); flex-wrap: wrap; }
a { color: var(--color-blue-600); text-decoration: none; }
.footer-link { font-size: 14px; line-height: 22px; color: var(--color-text-primary); }
.footer-link { color: var(--color-text-primary); }
.footer-link { font-size: var(--text-small-size); }
.footer-link { transition: color var(--duration-120) var(--ease-out-quad); }
```

### Main navigation

Nav bar. Variants: Default.
States: Default.
Tokens: color-text-primary for color, type-body for font.
Default: text color-text-primary · font type-body
Motion: none
Checks: all pass

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

Breadcrumb. Variants: Default.
States: Default.
Tokens: color-text-primary for color, type-body for font.
Default: text color-text-primary · font type-body
Motion: none
Checks: all pass

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

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, color-text-primary for color, color-gray-border for border-color, radius-md for border-radius, space-24 for padding-top, space-24 for padding-right, space-24 for padding-bottom, space-24 for padding-left, type-body for font, shadow-stack-low for box-shadow.
Default: background color-gray-50 · text color-text-primary · border 1px color-gray-border · radius radius-md · padding space-24 space-24 space-24 space-24 · font type-body · shadow shadow-stack-low
Motion: 1 motion pattern in the Motion section
Checks: all pass

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

Badge. Variants: Warning, Success, Danger.
States: Default.
Tokens: color-success for background-color, color-gray-50 for color, radius-rounded for border-radius, space-8 for padding-right, space-8 for padding-left, type-caption for font.
Default: background color-success · text color-gray-50 · radius radius-rounded · padding 0px space-8 0px space-8 · font type-caption
Motion: none
Checks: all pass

```css
.badge { display: inline-flex; align-items: center; height: 24px; padding: 0px var(--space-8); border-radius: 999px; color: var(--color-gray-50); font-size: 12px; line-height: 16px; }
.badge-success { background: var(--color-success); }
.badge { border-radius: var(--radius-rounded); }
```

### Notice

Alert. Variants: Warning, Success.
States: Default.
Tokens: color-gray-50 for background-color, color-text-primary for color, color-success for border-color, radius-sm for border-radius, space-16 for padding-top, space-16 for padding-right, space-16 for padding-bottom, space-16 for padding-left, type-body for font.
Default: background color-gray-50 · text color-text-primary · border 1px color-success · radius radius-sm · padding space-16 space-16 space-16 space-16 · font type-body
Motion: pulse · 1600 ms · ease-out-quart · loops; 1 motion pattern in the Motion section
Checks: all pass

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

Tag. Variants: Default.
States: Default.
Tokens: color-teal-500 for background-color, color-gray-50 for color, radius-rounded for border-radius, space-8 for padding-right, space-8 for padding-left, type-caption for font.
Default: background color-teal-500 · text color-gray-50 · radius radius-rounded · padding 0px space-8 0px space-8 · font type-caption
Motion: none
Checks: 0 of 1

```css
.tag-new { display: inline-flex; align-items: center; align-self: flex-start; height: 24px; padding: 0px var(--space-8); border-radius: 999px; background: var(--color-teal-500); color: var(--color-gray-50); font-size: 12px; line-height: 16px; }
.tag-new { border-radius: var(--radius-rounded); }
```

### Plan comparison table

Table. Variants: Default.
States: Default.
Tokens: color-text-primary for color, type-text-small for font.
Default: text color-text-primary · font type-text-small
Motion: none
Checks: all pass

```css
td, th { padding: 0px; padding: 0px; padding: 0px; }
.table { width: 100%; border-collapse: collapse; font-size: 14px; line-height: 22px; }
.th { padding: var(--space-12) var(--space-16); border-bottom: 1px solid var(--color-gray-border); text-align: left; font-size: 14px; line-height: 20px; font-weight: 600; }
.table, .th { font-size: var(--text-small-size); }
.td { padding: var(--space-12) var(--space-16); border-bottom: 1px solid var(--color-gray-border); }
```

### Code block

Code block. Variants: Default.
States: Default.
Tokens: color-text-primary for background-color, color-gray-50 for color, radius-sm for border-radius, space-16 for padding-top, space-24 for padding-right, space-16 for padding-bottom, space-24 for padding-left, type-code for font.
Default: background color-text-primary · text color-gray-50 · border 1px rgba(8, 9, 10, 0.6) · radius radius-sm · padding space-16 space-24 space-16 space-24 · font type-code
Motion: none
Checks: all pass

```css
pre { margin: 0px; margin: 0px; margin: 0px; }
.code-block { padding: var(--space-16) var(--space-24); border-radius: var(--radius-sm); background: var(--color-text-primary); color: var(--color-gray-50); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; line-height: 22px; overflow-x: auto; }
.code-block { font-size: var(--text-small-size); }
.code-block { border: 1px solid rgba(8, 9, 10, 0.6); }
```

### Avatar

Avatar. Variants: Default.
States: Default.
Tokens: color-gray-border for background-color, radius-rounded for border-radius.
Default: background color-gray-border · radius radius-rounded
Motion: none

```css
.avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--color-gray-border); }
```

## Page-specific components

### Footer CTA button

Button. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
Tokens: color-gray-border for background-color, color-text-primary for color, radius-md for border-radius, space-16 for padding-right, space-16 for padding-left.
Default: background color-gray-border · text color-text-primary · radius radius-md · padding 0px space-16 0px space-16 · font 16px 500
Motion: none
Checks: all pass

### Icon button

Button. Variants: Default.
States: Default, Hover, Focus, Active.
- Hover: background-color #E2E8F0; border-color #0B1F3A
- Focus: outline-width 2px; outline-style solid; outline-color #2458E6; outline-offset 2px
- Active: background-color #E2E8F0; border-color #0B1F3A
Tokens: color-gray-50 for background-color, color-gray-border for border-color, radius-sm for border-radius.
Default: background color-gray-50 · border 1px color-gray-border · radius radius-sm
Motion: none
Checks: 2 of 3

### Feature tabs

Tabs. Variants: Default.
States: Default.
Tokens: color-text-primary for color, type-body for font.
Default: text color-text-primary · font type-body
Motion: none

### Pricing card

Card. Variants: Primary, Secondary.
States: Default.
Tokens: color-gray-50 for background-color, color-text-primary for color, color-gray-border for border-color, radius-md for border-radius, space-32 for padding-top, space-32 for padding-right, space-32 for padding-bottom, space-32 for padding-left, type-body for font, shadow-stack-low for box-shadow.
Default: background color-gray-50 · text color-text-primary · border 1px color-gray-border · radius radius-md · padding space-32 space-32 space-32 space-32 · font type-body · shadow shadow-stack-low
Motion: none
Checks: all pass

### Not found panel

Empty state. Variants: Default.
States: Default.
Tokens: color-text-primary for color, color-gray-border for border-color, radius-md for border-radius, space-96 for padding-top, space-24 for padding-right, space-96 for padding-bottom, space-24 for padding-left, type-body for font.
Default: text color-text-primary · border 1px color-gray-border · radius radius-md · padding space-96 space-24 space-96 space-24 · font type-body
Motion: none
Checks: all pass

### Resources menu

Dropdown. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, color-text-primary for color, color-gray-border for border-color, radius-md for border-radius, space-8 for padding-top, space-8 for padding-right, space-8 for padding-bottom, space-8 for padding-left, type-body for font, shadow-md for box-shadow.
Default: background color-gray-50 · text color-text-primary · border 1px color-gray-border · radius radius-md · padding space-8 space-8 space-8 space-8 · font type-body · shadow shadow-md
Motion: none
Checks: all pass

### Mobile menu

Dropdown. Variants: Default.
States: Default.
Tokens: color-text-primary for color, color-gray-border for border-color, space-8 for padding-top, space-16 for padding-bottom, type-body for font.
Default: text color-text-primary · border 1px color-gray-border · padding space-8 0px space-16 0px · font type-body
Motion: none
Checks: all pass

## Rules

- Use only these tokens. Do not invent colors, sizes, spacing, radii or shadows.
- Keep every text and background pair at the contrast ratio it has here.
- Match each component contract, including its states.
- Keep every component that passes all checks passing: contrast pairs, focus visibility, tap target size.
- Use only these durations and easings. Apply the entrance and scroll patterns to the equivalent elements of what you build; patterns marked observed were measured at runtime and their easing is the nearest token when none was recorded.
- No em dashes in any copy you write.

Source: https://design-system-extractor.vercel.app/r/evalclean0
