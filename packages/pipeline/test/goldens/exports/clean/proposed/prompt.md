You are building an interface that must match this design system exactly.

## Tokens

```css
:root {
  --color-gray-50: #FFFFFF;
  --color-gray-200: #E2E8F0;
  --color-blue-ink: #0B1F3A;
  --color-blue-600: #2458E6;
  --color-teal-500: #0F8A8A;
  --color-blue-overlay: #0B1F3A1F;
  --color-success: #15803D;
  --color-warning: #B45309;
  --color-danger: #DC2626;

  --font-sans: Inter, system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;

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
| code | 14px | 22px | 400 | ui-monospace |
| caption | 12px | 16px | 400 | Inter |

## Components

### Button

Button. Variants: Primary, Ghost, Secondary, Secondary small, Primary small, Ghost small.
States: Default, Hover, Focus, Active, Disabled.
- Hover: background-color rgb(226, 232, 240)
- Focus: outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
- Active: background-color rgb(226, 232, 240)
Tokens: blue-ink for color, radius 8px for border-radius, space-20 for padding-right, space-20 for padding-left, label for font.

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

Button. Variants: Default.
States: Default, Hover, Focus, Active, Open.
- Hover: background-color rgb(226, 232, 240)
- Focus: outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
- Active: background-color rgb(226, 232, 240)
- Open: background-color rgb(226, 232, 240)
Tokens: blue-ink for color, radius 8px for border-radius, space-12 for padding-right, space-12 for padding-left, label for font.

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

Button. Variants: Default.
States: Default, Hover, Focus, Active, Open.
- Focus: outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
Tokens: radius 8px for border-radius.

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

Button. Variants: Default.
States: Default, Hover, Focus, Active, Selected.
- Focus: outline-width 2px; outline-style solid; outline-offset 2px
Tokens: blue-600 for color, space-16 for padding-right, space-16 for padding-left, label for font.

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

Button. Variants: Default.
States: Default, Hover, Focus, Active.
- Hover: background-color rgb(226, 232, 240)
- Focus: outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
- Active: background-color rgb(226, 232, 240)
Tokens: gray-50 for background-color, gray-200 for border-color, radius 8px for border-radius.

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

Text input. Variants: Default.
States: Default, Hover, Focus, Active, Error.
- Focus: border-top-color rgb(36, 88, 230); border-right-color rgb(36, 88, 230); border-bottom-color rgb(36, 88, 230); border-left-color rgb(36, 88, 230); outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
- Active: border-top-color rgb(36, 88, 230); border-right-color rgb(36, 88, 230); border-bottom-color rgb(36, 88, 230); border-left-color rgb(36, 88, 230); outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
Tokens: gray-50 for background-color, gray-200 for border-color, radius 8px for border-radius, space-8 for padding-top, space-12 for padding-right, space-8 for padding-bottom, space-12 for padding-left.

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

Toggle. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
Tokens: none.

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

Select. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: border-top-color rgb(36, 88, 230); border-right-color rgb(36, 88, 230); border-bottom-color rgb(36, 88, 230); border-left-color rgb(36, 88, 230); outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
- Active: border-top-color rgb(36, 88, 230); border-right-color rgb(36, 88, 230); border-bottom-color rgb(36, 88, 230); border-left-color rgb(36, 88, 230); outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
Tokens: gray-50 for background-color, blue-ink for color, gray-200 for border-color, radius 8px for border-radius, space-8 for padding-top, space-40 for padding-right, space-8 for padding-bottom, space-12 for padding-left, body for font.

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

Checkbox. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
Tokens: radius 8px for border-radius.

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

Textarea. Variants: Default.
States: Default, Hover, Focus, Active.
- Focus: border-top-color rgb(36, 88, 230); border-right-color rgb(36, 88, 230); border-bottom-color rgb(36, 88, 230); border-left-color rgb(36, 88, 230); outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
- Active: border-top-color rgb(36, 88, 230); border-right-color rgb(36, 88, 230); border-bottom-color rgb(36, 88, 230); border-left-color rgb(36, 88, 230); outline-color rgb(36, 88, 230); outline-width 2px; outline-style solid; outline-offset 2px
Tokens: gray-50 for background-color, gray-200 for border-color, radius 8px for border-radius, space-8 for padding-top, space-12 for padding-right, space-8 for padding-bottom, space-12 for padding-left.

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

Header. Variants: Default.
States: Default, Scrolled.
- Scrolled: box-shadow rgba(11, 31, 58, 0.12) 0px 11.974px 31.9307px 0px
Tokens: gray-50 for background-color, blue-ink for color, body for font.

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

Footer. Variants: Default.
States: Default.
Tokens: blue-ink for color, gray-200 for border-color, space-48 for padding-top, space-48 for padding-bottom, body for font.

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

Nav bar. Variants: Default.
States: Default.
Tokens: blue-ink for color, body for font.

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

Nav bar. Variants: Default.
States: Default.
Tokens: blue-ink for color, body for font.

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

Breadcrumb. Variants: Default.
States: Default.
Tokens: blue-ink for color, body for font.

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

Tabs. Variants: Default.
States: Default.
Tokens: blue-ink for color, body for font.

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

Card. Variants: Default.
States: Default.
Tokens: gray-50 for background-color, blue-ink for color, gray-200 for border-color, radius 12px for border-radius, space-24 for padding-top, space-24 for padding-right, space-24 for padding-bottom, space-24 for padding-left, body for font, shadow-sm for box-shadow.

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

Card. Variants: Primary, Secondary.
States: Default.
Tokens: gray-50 for background-color, blue-ink for color, gray-200 for border-color, radius 12px for border-radius, space-32 for padding-top, space-32 for padding-right, space-32 for padding-bottom, space-32 for padding-left, body for font, shadow-sm for box-shadow.

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

Badge. Variants: Warning, Success, Danger.
States: Default.
Tokens: success for background-color, gray-50 for color, radius-pill for border-radius, space-8 for padding-right, space-8 for padding-left, caption for font.

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

Alert. Variants: Warning, Success.
States: Default.
Tokens: gray-50 for background-color, blue-ink for color, success for border-color, radius 8px for border-radius, space-16 for padding-top, space-16 for padding-right, space-16 for padding-bottom, space-16 for padding-left, body for font.

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

Tag. Variants: Default.
States: Default.
Tokens: teal-500 for background-color, gray-50 for color, radius-pill for border-radius, space-8 for padding-right, space-8 for padding-left, caption for font.

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

Empty state. Variants: Default.
States: Default.
Tokens: blue-ink for color, gray-200 for border-color, radius 12px for border-radius, space-96 for padding-top, space-24 for padding-right, space-96 for padding-bottom, space-24 for padding-left, body for font.

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

Table. Variants: Default.
States: Default.
Tokens: blue-ink for color, body-sm for font.

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

Code block. Variants: Default.
States: Default.
Tokens: blue-ink for background-color, gray-50 for color, radius 8px for border-radius, space-16 for padding-top, space-24 for padding-right, space-16 for padding-bottom, space-24 for padding-left, code for font.

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

Dropdown. Variants: Default.
States: Default.
Tokens: gray-50 for background-color, blue-ink for color, gray-200 for border-color, radius 12px for border-radius, space-8 for padding-top, space-8 for padding-right, space-8 for padding-bottom, space-8 for padding-left, body for font, shadow-md for box-shadow.

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

Dropdown. Variants: Default.
States: Default.
Tokens: blue-ink for color, gray-200 for border-color, space-8 for padding-top, space-16 for padding-bottom, body for font.

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

Avatar. Variants: Default.
States: Default.
Tokens: gray-200 for background-color, radius-pill for border-radius.

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

## Rules

- Use only these tokens. Do not invent colors, sizes, spacing, radii or shadows.
- Keep every text and background pair at the contrast ratio it has here.
- Match each component contract, including its states.
- No em dashes in any copy you write.

Source: https://design-system-extractor.vercel.app/r/evalclean0
