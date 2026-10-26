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

## Component

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

## Rules

- Use only these tokens. Do not invent colors, sizes, spacing, radii or shadows.
- Keep every text and background pair at the contrast ratio it has here.
- Match each component contract, including its states.
- No em dashes in any copy you write.

Source: https://design-system-extractor.vercel.app/r/evalmessy0
