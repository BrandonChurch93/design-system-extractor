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
  --color-blue-ink: #0B1F3A;
  --color-blue-600: #2458E6;
  --color-blue-600-alt: #1C4EDB;
  --color-teal-500: #0F8A8A;
  --color-blue-ink-tint: #0B1F3A1F;
  --color-success: #15803D;
  --color-danger: #DC2626;
  --color-warning: #F59E0B;

  --font-sans: Inter, system-ui, sans-serif;

  --type-display-size: 48px;
  --type-display-line: 56px;
  --type-display-weight: 700;
  --type-h1-size: 36px;
  --type-h1-line: 44px;
  --type-h1-weight: 700;
  --type-h2-size: 28px;
  --type-h2-line: 36px;
  --type-h2-weight: 700;
  --type-h3-size: 20px;
  --type-h3-line: 28px;
  --type-h3-weight: 600;
  --type-body-size: 16px;
  --type-body-line: 26px;
  --type-body-weight: 400;
  --type-label-size: 14px;
  --type-label-line: 20px;
  --type-label-weight: 600;
  --type-body-sm-size: 14px;
  --type-body-sm-line: 22px;
  --type-body-sm-weight: 400;
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

  --breakpoint-sm: 640px;
  --breakpoint-md: 1024px;
}
```

## Type scale

| Name | Size | Line height | Weight | Family |
| --- | --- | --- | --- | --- |
| display | 48px | 56px | 700 | Inter |
| h1 | 36px | 44px | 700 | Inter |
| h2 | 28px | 36px | 700 | Inter |
| h3 | 20px | 28px | 600 | Inter |
| body | 16px | 26px | 400 | Inter |
| label | 14px | 20px | 600 | Inter |
| body-sm | 14px | 22px | 400 | Inter |
| caption | 12px | 16px | 400 | Inter |

## Components

### Button

Button. Variants: Primary, Ghost, Primary small, Secondary, Primary 2, Secondary small, Ghost small.
States: Default, Hover, Focus, Active, Disabled.
- Hover: background-color rgb(235, 235, 235)
- Focus: outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
- Active: background-color rgb(235, 235, 235)
Tokens: blue-ink for color, radius 8px for border-radius, space-20 for padding-right, space-20 for padding-left, label for font.

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
a { color: var(--color-blue-600-alt); text-decoration: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8); height: 44px; padding: 0px var(--space-20); border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 14px; line-height: 20px; font-weight: 600; cursor: pointer; transition: background-color 160ms, color 160ms; }
.btn-ghost { background: transparent; color: var(--color-blue-ink); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Dropdown trigger

Button. Variants: Default.
States: Default, Hover, Focus, Active, Open.
- Hover: background-color rgb(235, 235, 235)
- Focus: outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
- Active: background-color rgb(235, 235, 235)
- Open: background-color rgb(235, 235, 235)
Tokens: blue-ink for color, radius 8px for border-radius, space-12 for padding-right, space-12 for padding-left, label for font.

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.dropdown-trigger { display: inline-flex; align-items: center; gap: var(--space-4); height: 44px; padding: 0px var(--space-12); border: 0px; border-radius: var(--radius-sm); background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-blue-ink); cursor: pointer; }
svg { display: block; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Menu button

Button. Variants: Default.
States: Default, Hover, Focus, Active, Open.
- Focus: outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
Tokens: radius 8px for border-radius.

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

Button. Variants: Default.
States: Default, Hover, Focus, Active, Selected.
- Focus: outline-width 2px; outline-style solid; outline-offset 2px
Tokens: blue-600 for color, space-16 for padding-right, space-16 for padding-left, label for font.

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.tab { height: 44px; padding: 0px var(--space-16); border-width: 0px 0px 2px; border-style: none none solid; border-color: currentcolor currentcolor transparent; border-image: none; background: transparent; font-size: 14px; line-height: 20px; font-weight: 600; color: var(--color-blue-ink); cursor: pointer; }
.tab[aria-selected="true"] { color: var(--color-blue-600); border-bottom-color: var(--color-blue-600); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Share button

Button. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
Tokens: none.

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.share-button { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: 0px; border-radius: 6px; background: transparent; color: var(--color-gray-ink); cursor: pointer; }
svg { display: block; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Pill link

Link. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: outline-offset 1px
Tokens: gray-ink for color, gray-300 for border-color, radius-pill for border-radius, space-16 for padding-right, space-16 for padding-left, label for font.

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
a { color: var(--color-blue-600-alt); text-decoration: none; }
.link-pill { display: inline-flex; align-items: center; height: 44px; padding: 0px var(--space-16); border: 1px solid var(--color-gray-300); border-radius: 999px; color: var(--color-gray-ink); font-size: 14px; line-height: 20px; font-weight: 600; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Icon button

Button. Variants: Default.
States: Default, Hover, Focus, Active.
- Hover: background-color rgb(235, 235, 235)
- Focus: outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
- Active: background-color rgb(235, 235, 235)
Tokens: gray-50 for background-color, gray-400 for border-color, radius 8px for border-radius.

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
button { font: inherit; color: inherit; }
.icon-button { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 1px solid var(--color-gray-400); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-blue-ink); cursor: pointer; }
svg { display: block; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Newsletter input

Text input. Variants: Default.
States: Default, Hover, Focus, Active, Error.
- Focus: border-top-color rgb(36, 88, 230); border-right-color rgb(36, 88, 230); border-bottom-color rgb(36, 88, 230); border-left-color rgb(36, 88, 230); outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
- Active: border-top-color rgb(36, 88, 230); border-right-color rgb(36, 88, 230); border-bottom-color rgb(36, 88, 230); border-left-color rgb(36, 88, 230); outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
Tokens: gray-50 for background-color, gray-300 for border-color, radius 8px for border-radius, space-8 for padding-top, space-12 for padding-right, space-8 for padding-bottom, space-12 for padding-left.

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

Toggle. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
Tokens: none.

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

Select. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: border-top-color rgb(36, 88, 230); border-right-color rgb(36, 88, 230); border-bottom-color rgb(36, 88, 230); border-left-color rgb(36, 88, 230); outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
- Active: border-top-color rgb(36, 88, 230); border-right-color rgb(36, 88, 230); border-bottom-color rgb(36, 88, 230); border-left-color rgb(36, 88, 230); outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
Tokens: gray-50 for background-color, blue-ink for color, gray-300 for border-color, radius 8px for border-radius, space-8 for padding-top, space-40 for padding-right, space-8 for padding-bottom, space-12 for padding-left, body for font.

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
select { font: inherit; color: inherit; }
.select { width: 100%; height: 44px; padding: var(--space-8) var(--space-12); border: 1px solid var(--color-gray-300); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-blue-ink); font-size: 16px; line-height: 26px; }
.select { appearance: none; padding-right: var(--space-40); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230B1F3A' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Checkbox

Checkbox. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
Tokens: radius 8px for border-radius.

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
input { font: inherit; color: inherit; }
.checkbox { appearance: none; flex: 0 0 auto; width: 44px; height: 44px; margin: 0px -12px; border: 0px; border-radius: var(--radius-sm); background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect x='0.5' y='0.5' width='19' height='19' rx='3.5' fill='%23FFFFFF' stroke='%230B1F3A'/%3E%3C/svg%3E") center center no-repeat transparent; cursor: pointer; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Textarea

Textarea. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: border-top-color rgb(36, 88, 230); border-right-color rgb(36, 88, 230); border-bottom-color rgb(36, 88, 230); border-left-color rgb(36, 88, 230); outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
- Active: border-top-color rgb(36, 88, 230); border-right-color rgb(36, 88, 230); border-bottom-color rgb(36, 88, 230); border-left-color rgb(36, 88, 230); outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
Tokens: gray-50 for background-color, gray-300 for border-color, radius 8px for border-radius, space-8 for padding-top, space-12 for padding-right, space-8 for padding-bottom, space-12 for padding-left.

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
textarea { font: inherit; color: inherit; }
.textarea { width: 100%; height: 44px; padding: var(--space-8) var(--space-12); border: 1px solid var(--color-gray-300); border-radius: var(--radius-sm); background: var(--color-gray-50); color: var(--color-blue-ink); font-size: 16px; line-height: 26px; }
.textarea { height: 128px; resize: vertical; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Site header

Header. Variants: Default.
States: Default, Scrolled.
- Scrolled: box-shadow rgba(11, 31, 58, 0.12) 0px 12px 32px 0px
Tokens: gray-50 for background-color, gray-ink for color, body for font.

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

Footer. Variants: Default.
States: Default.
Tokens: gray-ink for color, gray-200 for border-color, space-48 for padding-top, space-48 for padding-bottom, body for font.

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

Nav bar. Variants: Default.
States: Default.
Tokens: gray-ink for color, body for font.

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.footer-links { display: flex; gap: var(--space-24); flex-wrap: wrap; }
a { color: var(--color-blue-600-alt); text-decoration: none; }
.footer-link { font-size: 14px; line-height: 22px; color: var(--color-gray-600); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Main navigation

Nav bar. Variants: Default.
States: Default.
Tokens: gray-ink for color, body for font.

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

Breadcrumb. Variants: Default.
States: Default.
Tokens: gray-ink for color, body for font.

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

Tabs. Variants: Default.
States: Default.
Tokens: gray-ink for color, body for font.

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

Card. Variants: Default.
States: Default.
Tokens: gray-50 for background-color, gray-ink for color, gray-200 for border-color, radius 12px for border-radius, space-18 for padding-top, space-18 for padding-right, space-18 for padding-bottom, space-18 for padding-left, body for font, shadow-sm for box-shadow.

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

List row. Variants: Default.
States: Default.
Tokens: gray-ink for color, space-16 for padding-left, body for font.

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

Card. Variants: Primary, Secondary.
States: Default.
Tokens: gray-50 for background-color, gray-ink for color, gray-200 for border-color, radius 12px for border-radius, space-32 for padding-top, space-32 for padding-right, space-32 for padding-bottom, space-32 for padding-left, body for font, shadow-sm for box-shadow.

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

Card. Variants: Default.
States: Default.
Tokens: gray-50 for color, radius 12px for border-radius, space-32 for padding-top, space-32 for padding-right, space-32 for padding-bottom, space-32 for padding-left, body for font.

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

Badge. Variants: Success, Danger, Warning.
States: Default.
Tokens: success for background-color, gray-50 for color, radius-pill for border-radius, space-10 for padding-right, space-10 for padding-left, caption for font.

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.badge { display: inline-flex; align-items: center; height: 24px; padding: 0px var(--space-10); border-radius: 999px; color: var(--color-gray-50); font-size: 12px; line-height: 16px; }
.badge-success { background: var(--color-success); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### New tag

Tag. Variants: Default.
States: Default.
Tokens: teal-500 for background-color, gray-50 for color, radius-pill for border-radius, space-10 for padding-right, space-10 for padding-left, caption for font.

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.tag-new { display: inline-flex; align-items: center; align-self: flex-start; height: 24px; padding: 0px var(--space-10); border-radius: 999px; background: var(--color-teal-500); color: var(--color-gray-50); font-size: 12px; line-height: 16px; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Success alert

Alert. Variants: Default.
States: Default.
Tokens: gray-50 for background-color, blue-ink for color, success for border-color, radius 8px for border-radius, space-16 for padding-top, space-16 for padding-right, space-16 for padding-bottom, space-16 for padding-left, body for font.

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

Empty state. Variants: Default.
States: Default.
Tokens: gray-ink for color, gray-100 for border-color, radius 12px for border-radius, space-96 for padding-top, space-24 for padding-right, space-96 for padding-bottom, space-24 for padding-left, body for font.

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

Table. Variants: Default.
States: Default.
Tokens: gray-ink for color, body-sm for font.

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.table { width: 100%; border-collapse: collapse; font-size: 14px; line-height: 22px; }
.th { padding: var(--space-12) var(--space-16); background: var(--color-gray-50-alt); border-bottom: 1px solid var(--color-gray-100); text-align: left; font-size: 14px; line-height: 20px; font-weight: 600; }
.td { padding: var(--space-12) var(--space-16); border-bottom: 1px solid var(--color-gray-100); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Code block

Code block. Variants: Default.
States: Default.
Tokens: blue-ink for background-color, gray-50 for color, radius 8px for border-radius, space-16 for padding-top, space-24 for padding-right, space-16 for padding-bottom, space-24 for padding-left.

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.code-block { padding: var(--space-16) var(--space-24); border-radius: var(--radius-sm); background: var(--color-blue-ink); color: var(--color-gray-50); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; line-height: 22px; overflow-x: auto; }
pre code { font: inherit; }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Resources dropdown

Dropdown. Variants: Default.
States: Default.
Tokens: gray-50 for background-color, gray-ink for color, gray-300-alt for border-color, radius 12px for border-radius, space-8 for padding-top, space-8 for padding-right, space-8 for padding-bottom, space-8 for padding-left, body for font, shadow-md for box-shadow.

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.dropdown-menu { position: absolute; top: 48px; left: 0px; z-index: 20; min-width: 224px; padding: var(--space-8); background: var(--color-gray-50); border: 1px solid var(--color-gray-300-alt); border-radius: var(--radius-lg); box-shadow: var(--color-blue-ink-tint) 0px 12px 32px; }
a { color: var(--color-blue-600-alt); text-decoration: none; }
.menu-item { display: flex; align-items: center; height: 44px; padding: 0px var(--space-12); border-radius: var(--radius-sm); font-size: 14px; line-height: 22px; color: var(--color-blue-ink); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Mobile menu

Dropdown. Variants: Default.
States: Default.
Tokens: gray-ink for color, gray-500-border for border-color, space-8 for padding-top, space-16 for padding-bottom, body for font.

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.mobile-menu { border-top: 1px solid var(--color-gray-500-border); padding: var(--space-8) 0px var(--space-16); }
a { color: var(--color-blue-600-alt); text-decoration: none; }
.mobile-link { display: flex; align-items: center; height: 48px; font-size: 16px; line-height: 26px; color: var(--color-blue-ink); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

### Avatar

Avatar. Variants: Default.
States: Default.
Tokens: gray-100 for background-color, radius-pill for border-radius.

```css
* { box-sizing: border-box; margin: 0px; padding: 0px; }
.avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--color-gray-100); }
::before { box-sizing: border-box; margin: 0px; padding: 0px; }
::after { box-sizing: border-box; margin: 0px; padding: 0px; }
```

## Rules

- Use only these tokens. Do not invent colors, sizes, spacing, radii or shadows.
- Keep every text and background pair at the contrast ratio it has here.
- Match each component contract, including its states.
- No em dashes in any copy you write.

Source: https://design-system-extractor.vercel.app/r/evalmessy0
