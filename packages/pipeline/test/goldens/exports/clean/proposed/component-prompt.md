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

## Component

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

## Rules

- Use only these tokens. Do not invent colors, sizes, spacing, radii or shadows.
- Keep every text and background pair at the contrast ratio it has here.
- Match each component contract, including its states.
- No em dashes in any copy you write.

Source: https://design-system-extractor.vercel.app/r/evalclean0
