You are building an interface that must match this design system exactly.

## Tokens

```css
:root {
  --color-gray-50: #FFFFFF;
  --color-gray-200: #E2E8F0;
  --color-gray-600: #5F6368;
  --color-text-primary: #0B1F3A;
  --color-blue-600: #2458E6;
  --color-teal-500: #0F8A8A;
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
- Scroll reveal · div.testimonial · when it enters the viewport at 25% from the bottom · opacity 0.03 → 1, transform translateY(15.6px) → translateY(0px) · about 399 ms · easing not recorded, nearest token suggested: ease-out-quad · observed
- Scrolled header · Site header · after 400 px of scrolling · box-shadow none → 0px 12px 32px 0px #0B1F3A1F · 160 ms · ease-out-quad
- Loop · Notice · loops every 1,600 ms · opacity 1 → 0.4 · 1,600 ms · ease-out-quart

## Site variables

```css
/* Site variables, resolved */
:root {
  --color-text-secondary: #5F6368;
  --text-small-size: 14px;
}
```

## Component

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

## Rules

- Use only these tokens. Do not invent colors, sizes, spacing, radii or shadows.
- Keep every text and background pair at the contrast ratio it has here.
- Match each component contract, including its states.
- Keep every component that passes all checks passing: contrast pairs, focus visibility, tap target size.
- Use only these durations and easings. Apply the entrance and scroll patterns to the equivalent elements of what you build; patterns marked observed were measured at runtime and their easing is the nearest token when none was recorded.
- No em dashes in any copy you write.

Source: https://design-system-extractor.vercel.app/r/evalclean0
