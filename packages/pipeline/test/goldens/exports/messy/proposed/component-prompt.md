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

## Component

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

## Rules

- Use only these tokens. Do not invent colors, sizes, spacing, radii or shadows.
- Keep every text and background pair at the contrast ratio it has here.
- Match each component contract, including its states.
- Keep every component that passes all checks passing: contrast pairs, focus visibility, tap target size.
- Use only these durations and easings. Apply the entrance and scroll patterns to the equivalent elements of what you build; patterns marked observed were measured at runtime and their easing is the nearest token when none was recorded.
- No em dashes in any copy you write.

Source: https://design-system-extractor.vercel.app/r/evalmessy0
