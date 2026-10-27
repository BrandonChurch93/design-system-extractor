You are building an interface that must match this design system exactly.

## Tokens

```css
:root {
  --color-gray-50: #FFFFFF;
  --color-gray-200: #CBD6E0;
  --color-gray-400: #999999;
  --color-gray-800: #2A2A2A;
  --color-gray-900: #171717;
  --color-gray-950: #000000;
  --tooltipItemTextColor: #425466;
  --hds-color-core-neutral-975: #0A2540;
  --hds-color-core-brand-600: #533AFD;
  --hds-color-core-brand-500: #635BFF;
  --color-blue-500: #727F96;
  --hds-color-core-neutral-990: #061B31;
  --hds-color-text-soft: #50617A;
  --color-blue-700c: #0000EE;
  --color-green-400: #15BE53;
  --hds-color-input-text-solid: #273951;
  --color-indigo-700: #2C326A;
  --hds-color-core-brand-200: #B9B9F9;
  --hds-color-core-brand-100: #D6D9FC;
  --hds-color-core-brandDark-700: #362BAA;
  --color-pink-400: #FF629C;
  --hds-color-core-magenta-100: #FFD7EF;
  --color-orange-400: #FF7600;
  --hds-color-core-neutralDark-400: #839BC8;
  --color-violet-400: #A375FF;
  --hds-color-core-brand-400: #7F7DFC;
  --color-teal-400: #19C9C9;
  --hds-color-core-lemon-200: #FBB800;
  --suite-color: #FF6118;
  --hds-color-core-neutralDark-300: #A3B5D6;
  --hds-color-core-magenta-350: #F44BCC;
  --color-cyan-400: #1BC2F6;
  --color-indigo-500c: #9966FF;
  --guidesCardFillColor: #1981E8;
  --hds-color-core-brandDark-400: #7389FF;
  --hds-color-core-success-400: #00B261;
  --color-orange-400c: #FF8319;
  --hds-color-core-magenta-50: #FFE6F5;
  --color-amber-300b: #EFA82E;
  --color-indigo-700c: #2C2484;
  --color-blue-400d: #8BB0FF;
  --color-indigo-400: #A382F8;
  --color-cyan-200: #80E9FF;
  --hds-color-action-bg-subdued: #E2E4FF;
  --hds-color-core-lemon-100: #FFE1A3;
  --color-blue-700h: #2B408A;
  --color-cyan-400b: #42B0D5;
  --color-pink-400c: #EE30FB;
  --hds-color-core-success-600: #006F3A;
  --color-red-500: #C54647;
  --color-blue-700i: #004377;
  --hds-color-core-magenta-600: #A51D85;
  --color-success-200: #A8F170;
  --color-success-500: #108C3D;
  --color-success-700: #0F4D29;

  --overlay-blue-700b-10: rgb(63 75 102 / 10%);
  --overlay-indigo-700-26: rgb(44 50 106 / 26%);
  --overlay-blue-700b-6: rgb(63 75 102 / 6%);
  --overlay-black-10: rgb(0 0 0 / 10%);
  --overlay-black-30: rgb(0 0 0 / 30%);
  --overlay-green-400-40: rgb(21 190 83 / 40%);
  --overlay-blue-700f-50: rgb(58 73 130 / 50%);
  --overlay-hds-color-core-brand-500-76: rgb(99 91 255 / 76%);
  --overlay-hds-color-core-brand-500-6: rgb(99 91 255 / 6%);
  --overlay-indigo-700-16: rgb(44 50 106 / 16%);
  --overlay-black-6: rgb(0 0 0 / 6%);
  --overlay-indigo-600b-70: rgb(104 41 229 / 70%);
  --overlay-white-12: rgb(255 255 255 / 12%);
  --overlay-hds-color-core-neutral-900-50: rgb(26 44 68 / 50%);
  --overlay-green-400-20: rgb(21 190 83 / 20%);
  --overlay-blue-900b-36: rgb(17 26 64 / 36%);
  --overlay-hds-color-core-neutral-100-76: rgb(216 222 228 / 76%);
  --overlay-blue-900c-26: rgb(3 19 35 / 26%);
  --overlay-blue-700h-4: rgb(43 64 138 / 4%);
  --overlay-indigo-700-12: rgb(44 50 106 / 12%);
  --overlay-blue-700i-6: rgb(0 67 119 / 6%);
  --overlay-hds-color-core-success-400-16: rgb(0 178 97 / 16%);
  --overlay-indigo-400-40: rgb(163 130 248 / 40%);
  --overlay-white-96: rgb(255 255 255 / 96%);
  --overlay-blue-700i-10: rgb(0 67 119 / 10%);
  --overlay-black-2: rgb(0 0 0 / 2%);
  --overlay-blue-700h-2: rgb(43 64 138 / 2%);
  --overlay-blue-700h-6: rgb(43 64 138 / 6%);
  --overlay-gray-900-8: rgb(23 23 23 / 8%);
  --overlay-hds-color-core-neutral-975-20: rgb(10 37 64 / 20%);
  --overlay-pink-400c-80: rgb(238 48 251 / 80%);
  --overlay-gray-900-6: rgb(23 23 23 / 6%);
  --overlay-white-38: rgb(255 255 255 / 38%);
  --overlay-white-46: rgb(255 255 255 / 46%);
  --overlay-white-66: rgb(255 255 255 / 66%);
  --overlay-black-4: rgb(0 0 0 / 4%);
  --overlay-blue-500-10: rgb(114 127 150 / 10%);
  --overlay-blue-700c-50: rgb(0 0 238 / 50%);
  --overlay-blue-700i-14: rgb(0 67 119 / 14%);
  --overlay-hds-color-core-brand-600-8: rgb(83 58 253 / 8%);
  --overlay-hds-color-core-brand-600-80: rgb(83 58 253 / 80%);
  --overlay-hds-color-core-magenta-50-20: rgb(255 230 245 / 20%);
  --overlay-hds-color-core-neutral-975-36: rgb(10 37 64 / 36%);
  --overlay-hds-color-text-soft-50: rgb(80 97 122 / 50%);
  --overlay-indigo-400-62: rgb(163 130 248 / 62%);
  --overlay-indigo-400-80: rgb(163 130 248 / 80%);
  --overlay-indigo-700-20: rgb(44 50 106 / 20%);
  --overlay-orange-400c-80: rgb(255 131 25 / 80%);
  --overlay-pink-400c-88: rgb(238 48 251 / 88%);
  --overlay-white-20: rgb(255 255 255 / 20%);
  --overlay-gray-950-30: rgb(0 0 0 / 30%);
  --overlay-hds-color-core-brandDark-400-26: rgb(115 137 255 / 26%);
  --overlay-hds-color-core-magenta-350-80: rgb(244 75 204 / 80%);
  --overlay-blue-700i-8: rgb(0 67 119 / 8%);
  --overlay-blue-800e-8: rgb(43 48 66 / 8%);
  --overlay-gray-800-16: rgb(42 42 42 / 16%);
  --overlay-gray-900-30: rgb(23 23 23 / 30%);
  --overlay-hds-color-core-brand-500-48: rgb(99 91 255 / 48%);
  --overlay-hds-color-core-brand-500-80: rgb(99 91 255 / 80%);
  --overlay-hds-color-core-brand-600-16: rgb(83 58 253 / 16%);
  --overlay-hds-color-core-magenta-50-10: rgb(255 230 245 / 10%);
  --overlay-hds-color-core-neutral-990-18: rgb(6 27 49 / 18%);
  --overlay-hds-color-core-neutral-990-20: rgb(6 27 49 / 20%);
  --overlay-indigo-500e-10: rgb(94 106 210 / 10%);
  --overlay-white-26: rgb(255 255 255 / 26%);
  --overlay-white-6: rgb(255 255 255 / 6%);
  --overlay-white-80: rgb(255 255 255 / 80%);
  --overlay-black-12: rgb(0 0 0 / 12%);
  --overlay-black-8: rgb(0 0 0 / 8%);
  --overlay-blue-400d-26: rgb(139 176 255 / 26%);
  --overlay-blue-700h-16: rgb(43 64 138 / 16%);
  --overlay-blue-900b-46: rgb(17 26 64 / 46%);
  --overlay-gray-700-4: rgb(55 56 57 / 4%);
  --overlay-hds-color-core-brandDark-700-36: rgb(54 43 170 / 36%);
  --overlay-hds-color-core-lemon-200-80: rgb(251 184 0 / 80%);
  --overlay-hds-color-core-neutral-975-22: rgb(10 37 64 / 22%);
  --overlay-hds-color-core-neutralDark-300-30: rgb(163 181 214 / 30%);
  --overlay-hds-color-core-success-400-12: rgb(0 178 97 / 12%);
  --overlay-indigo-700c-6: rgb(44 36 132 / 6%);
  --overlay-white-70: rgb(255 255 255 / 70%);

  --font-sans: sohne-var, 'Helvetica Neue', Arial, sans-serif;

  --type-heading-size: 23px;
  --type-heading-line: 28px;
  --type-heading-weight: 500;
  --type-heading-soft-size: 20px;
  --type-heading-soft-line: 24px;
  --type-heading-soft-weight: 300;
  --type-heading-soft-tracking: -0.2px;
  --type-subheading-size: 18px;
  --type-subheading-line: 28px;
  --type-subheading-weight: 300;
  --type-subheading-tracking: 0.2px;
  --type-subheading-strong-sm-size: 16px;
  --type-subheading-strong-sm-line: 16px;
  --type-subheading-strong-sm-weight: 400;
  --type-text-15-size: 15px;
  --type-text-15-line: 24px;
  --type-text-15-weight: 425;
  --type-text-15-tracking: 0.2px;
  --type-bodyFontSize-size: 15px;
  --type-bodyFontSize-line: 24px;
  --type-bodyFontSize-weight: 300;
  --type-bodyFontSize-tracking: 0.2px;
  --type-body-size: 14px;
  --type-body-line: 18px;
  --type-body-weight: 400;
  --type-body-sm-strong-size: 12px;
  --type-body-sm-strong-line: 14.5px;
  --type-body-sm-strong-weight: 400;
  --type-body-xs-size: 12px;
  --type-body-xs-line: 17px;
  --type-body-xs-weight: 300;
  --type-caption-size: 10px;
  --type-caption-line: 12px;
  --type-caption-weight: 300;

  --listSpacing: 4px;
  --hds-space-core-100: 8px;
  --hds-space-core-150: 12px;
  --columnPaddingNormal: 16px;
  --hds-space-core-250: 20px;
  --hds-space-core-300: 24px;
  --columnPaddingMedium: 32px;
  --hds-space-core-500: 40px;
  --hds-space-core-600: 48px;
  --hds-space-core-800: 64px;
  --space-112: 112px;

  --radius-sm: 1px;
  --hds-space-core-radius-xs: 2px;
  --hds-space-core-radius-sm: 4px;
  --hds-space-core-radius-md: 6px;
  --refreshedNavBorderRadius: 8px;
  --radius-pill: 9999px;

  --shadow-sm: 0px 2px 5px -1px #32325D40, 0px 1px 3px -1px #0000004D;
  --shadow-md: 0px 8px 16px -8px #0000001A, 0px 13px 27px -12px #32325D40;
  --shadow-lg: 0px 18px 36px -18px #0000001A, 0px 30px 45px -30px #32325D40;

  --duration-50: 50ms;
  --duration-120: 120ms;
  --duration-150: 150ms;
  --navigation-duration: 240ms;
  --duration-250: 250ms;
  --accordionCollapseAnimationDuration: 300ms;
  --duration-325: 325ms;
  --duration-375: 375ms;
  --duration-400: 400ms;
  --duration-450: 450ms;
  --duration-500: 500ms;
  --duration-600: 600ms;
  --duration-700: 700ms;
  --duration-750: 750ms;
  --card-duration: 800ms;
  --duration-850: 850ms;
  --duration-1000: 1000ms;
  --duration-1100: 1100ms;
  --duration-1200: 1200ms;
  --duration-1250: 1250ms;
  --duration-1420: 1420ms;
  --duration-2000: 2000ms;
  --duration-2260: 2260ms;
  --duration-2500: 2500ms;
  --duration-3000: 3000ms;
  --duration-4000: 4000ms;
  --duration-5000: 5000ms;
  --duration-7000: 7000ms;
  --duration-11700: 11700ms;
  --duration-11950: 11950ms;
  --duration-86400000: 86400000ms;
  --duration-faster: var(--duration-50);
  --duration-fast: var(--duration-120);
  --duration-base: var(--duration-150);
  --duration-slow: var(--navigation-duration);
  --duration-slower: var(--duration-250);

  --ease-out-cubic: cubic-bezier(0.215, 0.61, 0.355, 1);
  --ease-custom-1: cubic-bezier(0.25, 1, 0.5, 1);
  --ease: ease;
  --ease-linear: linear;
  --ease-custom-2: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in-out: ease-in-out;
  --ease-custom-3: cubic-bezier(0.33, 1, 0.68, 1);
  --navigation-easing: cubic-bezier(0.45, 0.05, 0.55, 0.95);
  --ease-custom-5: cubic-bezier(0.7, 0, 0, 1);
  --ease-out: ease-out;
  --ease-steps-1: steps(1);
  --accordionCollapseAnimationEasing: cubic-bezier(0.65, 0, 0.35, 1);
  --card-ease: cubic-bezier(0.165, 0.84, 0.44, 1);
  --ease-custom-7: cubic-bezier(0.3, 0, 0.2, 1);
  --ease-steps-1b: steps(1, start);
  --ease-custom-10: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-custom-11: cubic-bezier(0.61, 1, 0.88, 1);
  --ease-custom-12: cubic-bezier(0.9, 0, 0.1, 1);
  --ease-custom-8: cubic-bezier(0, 0.09, 0.4, 1);
  --ease-custom-9: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: ease-in;
  --ease-custom-13: cubic-bezier(0.2, 0, 0, 1);
  --ease-custom-15: cubic-bezier(0.78, 0, 0.22, 1);
  --ease-custom-16: cubic-bezier(0.12, 0, 0.39, 0);

  --breakpoint-sm: 600px;
  --breakpoint-md: 640px;
  --breakpoint-lg: 899px;
  --breakpoint-xl: 939px;
  --breakpoint-2xl: 1112px;
  --breakpoint-1300: 1300px;
}
```

## Type scale

| Name | Size | Line height | Weight | Family |
| --- | --- | --- | --- | --- |
| heading | 23px | 28px | 500 | sohne-var |
| heading-soft | 20px | 24px | 300 | sohne-var |
| subheading | 18px | 28px | 300 | sohne-var |
| subheading-strong-sm | 16px | 16px | 400 | sohne-var |
| text-15 | 15px | 24px | 425 | sohne-var |
| bodyFontSize | 15px | 24px | 300 | sohne-var |
| body | 14px | 18px | 400 | sohne-var |
| body-sm-strong | 12px | 14.5px | 400 | sohne-var |
| body-xs | 12px | 17px | 300 | sohne-var |
| caption | 10px | 12px | 300 | sohne-var |

## Motion

Durations:

| Name | Value | Role |
| --- | --- | --- |
| duration-50 | 50 ms | Faster |
| duration-120 | 120 ms | Fast |
| duration-150 | 150 ms | Base |
| navigation-duration | 240 ms | Slow |
| duration-250 | 250 ms | Slower |
| accordionCollapseAnimationDuration | 300 ms |  |
| duration-325 | 325 ms |  |
| duration-375 | 375 ms |  |
| duration-400 | 400 ms |  |
| duration-450 | 450 ms |  |
| duration-500 | 500 ms |  |
| duration-600 | 600 ms |  |
| duration-700 | 700 ms |  |
| duration-750 | 750 ms |  |
| card-duration | 800 ms |  |
| duration-850 | 850 ms |  |
| duration-1000 | 1000 ms |  |
| duration-1100 | 1100 ms |  |
| duration-1200 | 1200 ms |  |
| duration-1250 | 1250 ms |  |
| duration-1420 | 1420 ms |  |
| duration-2000 | 2000 ms |  |
| duration-2260 | 2260 ms |  |
| duration-2500 | 2500 ms |  |
| duration-3000 | 3000 ms |  |
| duration-4000 | 4000 ms |  |
| duration-5000 | 5000 ms |  |
| duration-7000 | 7000 ms |  |
| duration-11700 | 11700 ms |  |
| duration-11950 | 11950 ms |  |
| duration-86400000 | 86400000 ms |  |

Easings:

| Name | Value |
| --- | --- |
| ease-out-cubic | cubic-bezier(0.215, 0.61, 0.355, 1) |
| ease-custom-1 | cubic-bezier(0.25, 1, 0.5, 1) |
| ease | ease |
| linear | linear |
| ease-custom-2 | cubic-bezier(0.4, 0, 0.2, 1) |
| ease-in-out | ease-in-out |
| ease-custom-3 | cubic-bezier(0.33, 1, 0.68, 1) |
| navigation-easing | cubic-bezier(0.45, 0.05, 0.55, 0.95) |
| ease-custom-5 | cubic-bezier(0.7, 0, 0, 1) |
| ease-out | ease-out |
| steps-1 | steps(1) |
| accordionCollapseAnimationEasing | cubic-bezier(0.65, 0, 0.35, 1) |
| card-ease | cubic-bezier(0.165, 0.84, 0.44, 1) |
| ease-custom-7 | cubic-bezier(0.3, 0, 0.2, 1) |
| steps-1b | steps(1, start) |
| ease-custom-10 | cubic-bezier(0.22, 1, 0.36, 1) |
| ease-custom-11 | cubic-bezier(0.61, 1, 0.88, 1) |
| ease-custom-12 | cubic-bezier(0.9, 0, 0.1, 1) |
| ease-custom-8 | cubic-bezier(0, 0.09, 0.4, 1) |
| ease-custom-9 | cubic-bezier(0.16, 1, 0.3, 1) |
| ease-in | ease-in |
| ease-custom-13 | cubic-bezier(0.2, 0, 0, 1) |
| ease-custom-15 | cubic-bezier(0.78, 0, 0.22, 1) |
| ease-custom-16 | cubic-bezier(0.12, 0, 0.39, 0) |

Keyframes:

```css
@keyframes refreshed-nav-hover-arrow-out { 0% { opacity: 1; } 100% { opacity: 0; } }
@keyframes PortalTooltipItemFadeIn { 0% { opacity: 0; } }
@keyframes detect-scroll { 0%, 100% { --can-scroll: ; } }
@keyframes knockoutText { 0% { background-position-y: 0px; } 100% { background-position-y: 100%; } }
@keyframes bucketListingStatBackgroundAnimation { 0% { background-position-y: 0px; } 100% { background-position-y: 400000%; } }
@keyframes UniversalChatCtaCard__entrance { 0% { opacity: 0; transform: translateY(16px); } 100% { opacity: 1; transform: translateY(0px); } }
@keyframes book-of-the-week-fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
@keyframes conversion-rates-graphic-halo-rotate { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(1turn); } }
@keyframes AtlasHeroAnimationCompanyFormRotate { 0% { transform: rotate3d(0, 0, 0, 1turn); } 100% { transform: rotate(1turn); } }
@keyframes contact-sales-page-reveal-inset-border { 0% { border-inline-end-color: transparent; } 100% { border-inline-end-color: #e5edf5; } }
@keyframes UniversalChatInitializer__ctaEntrance { 0% { opacity: 0; transform: translateY(20px) scale(0.95); } 100% { opacity: 1; transform: translateY(0px) scale(1); } }
/* unused */ @keyframes agentic-commerce-graphic-border-spin { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(1turn); } }
/* unused */ @keyframes AtlasHeroAnimationCompanyFormCaretBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
/* unused */ @keyframes bento-dialog-reveal-fade-in-up { 0% { opacity: 0; transform: translate3d(0px, 30px, 0px); } 100% { opacity: 1; transform: translateZ(0px); } }
/* unused */ @keyframes bento-overlay-gradient-opacity-animation { 0% { opacity: 0; } 100% { opacity: 1; } }
/* unused */ @keyframes bucketListingStatArrowAnimation { 0% { opacity: 0.25; } 50% { opacity: 1; } 100% { opacity: 0.25; } }
/* unused */ /* @keyframes butterfly-fly left out: it reads --__frame-count, which the site sets on the element at runtime */
/* unused */ @keyframes contact-sales-page-reveal-navigation-border { 0% { opacity: 0; } 100% { opacity: 1; } }
/* unused */ @keyframes csf-call-now-ping { 75%, 100% { scale: 1.5; opacity: 0; } }
/* unused */ @keyframes csf-card-footer-border-spin { 100% { --csf-loading-angle: 360deg; } }
/* unused */ @keyframes csf-card-footer-label-shimmer { 100% { background-position: -200% 0px; } }
/* unused */ @keyframes csf-spinner-spin { 100% { transform: rotate(1turn); } }
/* unused */ @keyframes hero-subnav-dropdown-item-reveal { 0% { opacity: 0; transform: translateY(calc(-1 * 4px)); } }
/* unused */ /* @keyframes highlightSliderRailMaskCircle left out: it reads --railWidth, --highlightRailProgress, which the site sets on the element at runtime */
/* unused */ @keyframes nav-hover-arrow-in { 0% { opacity: 0; transform: translateX(-3px); } 100% { opacity: 1; transform: translateX(0px); } }
/* unused */ @keyframes nav-hover-arrow-out { 0% { opacity: 1; } 100% { opacity: 0; } }
/* unused */ @keyframes navigation-menu-delay-reset { 0%, 100% { --navigation-menu-transition-delay: 0s; } }
/* unused */ @keyframes opacityAnimation { 0% { background-color: rgba(229, 237, 245, 0); } 100% { background-color: rgba(229, 237, 245, 0.9); } }
/* unused */ @keyframes ProductNavDropdownItem-reveal { 0% { opacity: 0; transform: translateY(-4px); } }
/* unused */ @keyframes refreshed-nav-hover-arrow-in { 0% { opacity: 0; transform: translateX(-3px); } 100% { opacity: 1; transform: translateX(0px); } }
/* unused */ @keyframes UniversalChatCtaCard__exit { 0% { opacity: 1; transform: translateY(0px); } 100% { opacity: 0; transform: translateY(8px); } }
/* unused */ @keyframes UniversalChatInitializer__ctaExit { 0% { opacity: 1; transform: translateY(0px) scale(1); } 100% { opacity: 0; transform: translateY(20px) scale(0.95); } }
```

Patterns:

- Entrance · div.UniversalChatCtaCard__container.UniversalChatCtaCard__container--fixed · on load · opacity 0 → 1, transform translateY(16px) → translateY(0px) · 300 ms · ease-custom-1
- Entrance · div.EnterpriseHubTicker__track > div:nth-of-type(1) · on load · transform translateX(-2.90533%) → translateX(-13.2013%) · about 4758 ms · easing not recorded, nearest token suggested: ease-out-cubic · observed
- Entrance · div.dom-graphic.dom-graphic--variant-default.crypto-hero-phone-animation__graphic · on load · transform translateY(160px) → translateY(0px) · 1,100 ms · ease-out · observed
- Entrance · div.dom-graphic.dom-graphic--variant-default.crypto-hero-phone-animation__graphic · on load · opacity 0 → 1 · 1,100 ms · ease-out · observed
- Entrance · div.crypto-hero-phone-animation__phone-input-screen · on load · opacity 1 → 0 · 11,950 ms · ease-in-out · observed
- Entrance · div.crypto-hero-phone-animation__phone-input-screen · on load · transform translateX(0px) → translateX(-266px) · 11,950 ms · ease-in-out · observed
- Entrance · div.crypto-hero-phone-animation__phone-review-screen · on load · transform translateX(266px) → translateX(-266px) · 11,950 ms · ease-in-out · observed
- Entrance · div.crypto-hero-phone-animation__phone-success-screen · on load · opacity 0 → 1 · 11,950 ms · ease-in-out · observed
- Entrance · div.crypto-hero-phone-animation__phone-success-screen · on load · transform translateX(266px) → translateX(0px) · 11,950 ms · ease-in-out · observed
- Entrance · div.EnterpriseHubTicker__track > div:nth-of-type(2) · on load · transform translateX(-2.008%) → translateX(-17.4889%) · about 6956 ms · easing not recorded, nearest token suggested: ease-out-cubic · observed
- Entrance · div.single-wave__static · on load · opacity 1 → 0 · 250 ms · ease-linear
- Entrance · div.UniversalChatInitializer__cta · on load · opacity 0 → 1, transform translateY(20px) scale(0.95) → translateY(0px) scale(1) · 300 ms · ease-custom-1
- Entrance · div.UniversalChatCtaCard__container · on load · opacity 0 → 1, transform translateY(16px) → translateY(0px) · 300 ms · ease-custom-1
- Entrance · div.single-wave__static · on load · opacity 1 → 0 · 250 ms · ease-linear
- Entrance · div.EnterpriseHubTicker · on load · opacity 0 → 1 · 250 ms · ease-linear
- Entrance · section.Copy.EnterpriseHubHero__copy.variant--Superhero header.Copy__header h1.Copy__title · on load · opacity 0 → 1, transform translateY(100px) → translateY(0px) · 1,250 ms · ease-custom-3 · observed
- Entrance · section.Copy.EnterpriseHubHero__copy.variant--Superhero div.Copy__body · on load · opacity 0 → 1, transform translateY(100px) → translateY(0px) · 1,250 ms · ease-custom-3 · observed
- Entrance · Button (nav, second) · on load · opacity 0 → 1, transform translateY(100px) → translateY(0px) · 1,250 ms · ease-custom-3 · observed
- Entrance · section.Section.EnterpriseHubHeroCardFan__section.theme--White div.Section__masked div.Section__container div.Section__layoutContainer > div > div:nth-of-type(1) > div:nth-of-type(1) > a · on load · opacity 0 → 1, transform translateY(50%) rotateY(25deg) → translateY(0px) · 850 ms · accordionCollapseAnimationEasing · observed
- Entrance · section.Section.EnterpriseHubHeroCardFan__section.theme--White div.Section__masked div.Section__container div.Section__layoutContainer > div > div:nth-of-type(1) > div:nth-of-type(2) > a · on load · opacity 0 → 1, transform translateY(50%) rotateY(25deg) → translateY(0px) · 850 ms · accordionCollapseAnimationEasing · observed
- Entrance · section.Section.EnterpriseHubHeroCardFan__section.theme--White div.Section__masked div.Section__container div.Section__layoutContainer > div > div:nth-of-type(1) > div:nth-of-type(3) > a · on load · opacity 0 → 1, transform translateY(50%) rotateY(25deg) → translateY(0px) · 850 ms · accordionCollapseAnimationEasing · observed
- Entrance · div.AtlasHeroAnimationCompanyForm · on load · opacity 0 → 1 · 375 ms · ease-custom-16 · observed
- Entrance · div.AtlasHeroAnimation__cursor · on load · transform translate(532px, 312px) → translate(148px, 111.5px) · 700 ms · ease-in-out · observed
- Entrance · div.dom-graphic.dom-graphic--variant-default.crypto-hero__browser-graphic · on load · opacity 0.5 → 1 · 1,000 ms · ease-out · observed
- Entrance · div.dom-graphic.dom-graphic--variant-default.crypto-hero__browser-graphic · on load · transform translateY(99.9921px) → none, opacity none → 1 · about 1000 ms · easing not recorded, nearest token suggested: ease-out-cubic · observed
- Entrance · Button (embed payments) · on load · opacity 0 → 1 · 500 ms · ease-custom-3
- Entrance · div.crypto-hero-phone-animation__keypad > div:nth-of-type(1) > div:nth-of-type(1) · on load · opacity 0.00240117 → 0 · 11,950 ms · ease-in-out · observed
- Entrance · div.dom-graphic.dom-graphic--variant-default.crypto-hero-phone-animation__graphic · on load · opacity 0.960336 → 1 · about 0 ms · easing not recorded, nearest token suggested: ease-out-cubic · observed
- Scroll reveal · li.PricingSideNav__navGroupItem.PricingSideNav__navItem--isActive ul.PricingSideNav__nestedNavList > li:nth-of-type(1) > a · when it enters the viewport at 90% from the bottom · color #3F4B66 → #635BFF · 150 ms · ease-out-cubic
- Scroll reveal · Button (embed payments) · when it enters the viewport at 75% from the bottom · opacity 0 → 1 · 2,260 ms · ease-out · observed
- Scroll reveal · li.PricingSideNav__navGroupItem.PricingSideNav__navItem--isActive ul.PricingSideNav__nestedNavList > li:nth-of-type(1) > a · when it enters the viewport at 95% from the bottom · color #635BFF → #3F4B66 · 150 ms · ease-out-cubic
- Scroll reveal · Button (embed payments) · when it enters the viewport at 55% from the bottom · opacity 0 → 1 · 2,260 ms · ease-out · observed
- Scroll reveal · div.UniversalChatCtaCard__card · when it enters the viewport at 10% from the bottom · opacity 1 → 0 · 180 ms · ease-custom-1
- Scroll reveal · div.UniversalChatCtaCard__card · when it enters the viewport at 10% from the bottom · transform none → translateY(32px) · 300 ms · ease-custom-1
- Scroll reveal · ul.EnterpriseHubFixedNav__itemList > li:nth-of-type(2) > a · when it enters the viewport at 100% from the bottom · color #0A2540 → #635BFF · 150 ms · ease-out-cubic
- Scroll reveal · section.Section.EnterpriseHubHeroCardFan__section.theme--White div.Section__masked div.Section__container div.Section__layoutContainer > div > div:nth-of-type(1) > div:nth-of-type(1) > a > div:nth-of-type(1) > div:nth-of-type(2) > div · when it enters the viewport at 95% from the bottom · transform translateY(-192px) → translateY(0px) · 850 ms · accordionCollapseAnimationEasing
- Scroll reveal · section.Section.EnterpriseHubHeroCardFan__section.theme--White div.Section__masked div.Section__container div.Section__layoutContainer > div > div:nth-of-type(1) > div:nth-of-type(2) > a > div:nth-of-type(1) > div:nth-of-type(2) > div · when it enters the viewport at 80% from the bottom · transform translateY(-192px) → translateY(0px) · 850 ms · accordionCollapseAnimationEasing
- Scroll reveal · section.Section.EnterpriseHubHeroCardFan__section.theme--White div.Section__masked div.Section__container div.Section__layoutContainer > div > div:nth-of-type(1) > div:nth-of-type(3) > a > div:nth-of-type(1) > div:nth-of-type(2) > div · when it enters the viewport at 65% from the bottom · transform translateY(-192px) → translateY(0px) · 850 ms · accordionCollapseAnimationEasing
- Scroll reveal · ul.EnterpriseHubFixedNav__itemList > li:nth-of-type(1) > a · when it enters the viewport at 100% from the bottom · color #635BFF → #0A2540 · 150 ms · ease-out-cubic
- Scroll reveal · #platform-payments > div > div:nth-of-type(2) > div > div > div > section:nth-of-type(2) > aside > div > article:nth-of-type(1) > a:nth-of-type(1) > div > div > svg path · when it enters the viewport at 80% from the bottom · stroke-dashoffset 224.648px → 0px · 3,000 ms · ease-custom-3 · observed
- Scroll reveal · #revenue-and-finance-automation > div > div:nth-of-type(2) > div > div > div > section:nth-of-type(2) > aside > div > article:nth-of-type(1) > a:nth-of-type(1) > div > div > svg path · when it enters the viewport at 40% from the bottom · stroke-dashoffset 339.548px → 0px · 3,000 ms · ease-custom-3 · observed
- Scroll reveal · #revenue-and-finance-automation > div > div:nth-of-type(2) > div > div > div > section:nth-of-type(2) > aside > div > article:nth-of-type(1) > a:nth-of-type(1) > div > div > svg path · when it enters the viewport at 50% from the bottom · stroke-dashoffset 339.549px → 0px · 3,000 ms · ease-custom-3 · observed
- Scroll reveal · #revenue-and-finance-automation > div > div:nth-of-type(2) > div > div > div > section:nth-of-type(2) > aside > div > article:nth-of-type(1) > a:nth-of-type(1) > div > div > svg path · when it enters the viewport at 30% from the bottom · stroke-dashoffset 339.55px → 0px · 3,000 ms · ease-custom-3 · observed
- Scroll reveal · Button (embed payments) · when it enters the viewport at 40% from the bottom · transform translateY(0%) → translateY(-100%) · 1,420 ms · ease-in-out · observed
- Scroll reveal · Button (embed payments) · when it enters the viewport at 55% from the bottom · transform translateY(0%) → translateY(-100%) · 1,420 ms · ease-in-out · observed
- Scroll reveal · Button (embed payments) · when it enters the viewport at 40% from the bottom · transform translateY(0%) → translateY(-100%) · 1,420 ms · ease-in-out · observed
- Scroll reveal · Button (embed payments) · when it enters the viewport at 30% from the bottom · clip-path inset(0px 0px 0%) → inset(0px 0px 100%) · 1,420 ms · ease-in-out · observed
- Scroll reveal · Button (embed payments) · when it enters the viewport at 30% from the bottom · opacity 1 → 0 · 1,420 ms · ease-in-out · observed
- Scroll reveal · Button (embed payments) · when it enters the viewport at 100% from the bottom · opacity 0 → 1 · 500 ms · ease-custom-3
- Scroll reveal · ul.PricingStickyNav__itemList > li:nth-of-type(2) > a · when it enters the viewport at 100% from the bottom · color #0A2540 → #635BFF · 150 ms · ease-out-cubic
- Scroll reveal · div.UniversalChatCtaCard__card · when it enters the viewport at 10% from the bottom · opacity 0 → 1 · 220 ms · ease-custom-1
- Scroll reveal · div.UniversalChatCtaCard__card · when it enters the viewport at 10% from the bottom · transform translateY(32px) → none · 300 ms · ease-custom-1
- Scroll reveal · section.Section.EnterpriseHubHeroCardFan__section.theme--White div.Section__masked div.Section__container div.Section__layoutContainer > div > div:nth-of-type(1) > div:nth-of-type(1) > a > div:nth-of-type(3) > div:nth-of-type(2) > div · when it enters the viewport at 95% from the bottom · transform translateY(-192px) → translateY(0px) · 850 ms · accordionCollapseAnimationEasing
- Scroll reveal · section.Section.EnterpriseHubHeroCardFan__section.theme--White div.Section__masked div.Section__container div.Section__layoutContainer > div > div:nth-of-type(1) > div:nth-of-type(1) > a > div:nth-of-type(5) > section > div > div > div · when it enters the viewport at 45% from the bottom · transform translateY(-100%) → translateY(0%) · 850 ms · accordionCollapseAnimationEasing
- Scroll reveal · Card (finance automation) · when it enters the viewport at 25% from the bottom · transform translateY(-192px) → translateY(0px) · 850 ms · accordionCollapseAnimationEasing
- Scroll reveal · section.Section.EnterpriseHubHeroCardFan__section.theme--White div.Section__masked div.Section__container div.Section__layoutContainer > div > div:nth-of-type(1) > div:nth-of-type(2) > a > div:nth-of-type(3) > div:nth-of-type(2) > div · when it enters the viewport at 80% from the bottom · transform translateY(-192px) → translateY(0px) · 850 ms · accordionCollapseAnimationEasing
- Scroll reveal · section.Section.EnterpriseHubHeroCardFan__section.theme--White div.Section__masked div.Section__container div.Section__layoutContainer > div > div:nth-of-type(1) > div:nth-of-type(2) > a > div:nth-of-type(5) > section > div > div > div · when it enters the viewport at 35% from the bottom · transform translateY(-100%) → translateY(0%) · 850 ms · accordionCollapseAnimationEasing
- Scroll reveal · Card (finance automation) · when it enters the viewport at 25% from the bottom · transform translateY(-192px) → translateY(0px) · 850 ms · accordionCollapseAnimationEasing
- Scroll reveal · section.Section.EnterpriseHubHeroCardFan__section.theme--White div.Section__masked div.Section__container div.Section__layoutContainer > div > div:nth-of-type(1) > div:nth-of-type(3) > a > div:nth-of-type(3) > div:nth-of-type(2) > div · when it enters the viewport at 65% from the bottom · transform translateY(-192px) → translateY(0px) · 850 ms · accordionCollapseAnimationEasing
- Scroll reveal · section.Section.EnterpriseHubHeroCardFan__section.theme--White div.Section__masked div.Section__container div.Section__layoutContainer > div > div:nth-of-type(1) > div:nth-of-type(3) > a > div:nth-of-type(5) > section > div > div > div · when it enters the viewport at 30% from the bottom · transform translateY(-100%) → translateY(0%) · 850 ms · accordionCollapseAnimationEasing
- Scroll reveal · Card (finance automation) · when it enters the viewport at 20% from the bottom · transform translateY(-192px) → translateY(0px) · 850 ms · accordionCollapseAnimationEasing
- Scroll reveal · section.Section.EnterpriseHubGlobalPayments__section.theme--White div.Section__masked div.Section__container div.Section__layoutContainer > div > div > section:nth-of-type(2) > aside > div > article:nth-of-type(1) > a:nth-of-type(1) > div > div > svg path · when it enters the viewport at 80% from the bottom · stroke-dashoffset 271.409px → 0px · 3,000 ms · ease-custom-3 · observed
- Scroll reveal · section.Section.EnterpriseHubGlobalPayments__section.theme--White div.Section__masked div.Section__container div.Section__layoutContainer > div > div > section:nth-of-type(2) > aside > div > article:nth-of-type(1) > a:nth-of-type(1) > div > div > svg path · when it enters the viewport at 70% from the bottom · stroke-dashoffset 345.519px → 0px · 3,000 ms · ease-custom-3 · observed
- Scroll reveal · section.Section.EnterpriseHubGlobalPayments__section.theme--White div.Section__masked div.Section__container div.Section__layoutContainer > div > div > section:nth-of-type(2) > aside > div > article:nth-of-type(1) > a:nth-of-type(1) > div > div > svg path · when it enters the viewport at 70% from the bottom · stroke-dashoffset 279.227px → 0px · 3,000 ms · ease-custom-3 · observed
- Scroll reveal · #platform-payments > div > div:nth-of-type(2) > div > div > div > section:nth-of-type(2) > aside > div > article:nth-of-type(1) > a:nth-of-type(1) > div > div > svg path · when it enters the viewport at 80% from the bottom · stroke-dashoffset 1226.39px → 0px · 3,000 ms · ease-custom-3 · observed
- Scroll reveal · #platform-payments > div > div:nth-of-type(2) > div > div > div > section:nth-of-type(2) > aside > div > article:nth-of-type(1) > a:nth-of-type(1) > div > div > svg path · when it enters the viewport at 75% from the bottom · stroke-dashoffset 437.696px → 0px · 3,000 ms · ease-custom-3 · observed
- Scroll reveal · #platform-payments > div > div:nth-of-type(2) > div > div > div > section:nth-of-type(2) > aside > div > article:nth-of-type(1) > a:nth-of-type(1) > div > div > svg path · when it enters the viewport at 80% from the bottom · stroke-dashoffset 449.296px → 0px · 3,000 ms · ease-custom-3 · observed
- Scroll reveal · #platform-payments > div > div:nth-of-type(2) > div > div > div > section:nth-of-type(2) > aside > div > article:nth-of-type(1) > a:nth-of-type(1) > div > div > svg path · when it enters the viewport at 75% from the bottom · stroke-dashoffset 224.647px → 0px · 3,000 ms · ease-custom-3 · observed
- Scroll reveal · div.EnterpriseHubTicker__track > div:nth-of-type(1) · when it enters the viewport at 90% from the bottom · transform translateX(-14.3493%) → translateX(-14.8309%) · about 214 ms · easing not recorded, nearest token suggested: ease-out-cubic · observed
- Scroll reveal · div.EnterpriseHubTicker__track > div:nth-of-type(1) · when it enters the viewport at 90% from the bottom · transform translateX(-15.2011%) → translateX(-16.0902%) · about 205 ms · easing not recorded, nearest token suggested: ease-out-cubic · observed
- Scroll reveal · div.EnterpriseHubTicker__track > div:nth-of-type(1) · when it enters the viewport at 90% from the bottom · transform translateX(-16.9049%) → translateX(-19.8678%) · about 1337 ms · easing not recorded, nearest token suggested: ease-out-cubic · observed
- Scroll reveal · Button (embed payments) · when it enters the viewport at 65% from the bottom · transform translateY(0%) → translateY(-100%) · 1,420 ms · ease-in-out · observed
- Scroll reveal · div.UniversalChatCtaCard__card · when it enters the viewport at 15% from the bottom · opacity 1 → 0 · 180 ms · card-ease
- Scroll reveal · div.UniversalChatCtaCard__card · when it enters the viewport at 15% from the bottom · transform translateY(0px) → translateY(32px) · 300 ms · ease-custom-1
- Scroll reveal · Button (embed payments) · when it enters the viewport at 75% from the bottom · opacity 0 → 1 · 2,260 ms · ease-out · observed
- Scroll reveal · div.section-background.modular-solutions-bg · when it enters the viewport at 60% from the bottom · opacity 0 → 0.525624 · 150 ms · ease-custom-3
- Scroll reveal · li.PricingStickyNav__item.PricingStickyNav__item--active a.Link.PricingStickyNav__itemLink · when it enters the viewport at 100% from the bottom · color #635BFF → #0A2540 · 150 ms · ease-out-cubic
- Scroll reveal · List row (chance that) · when it enters the viewport at 30% from the bottom · opacity 0 → 1, transform translate(72px, 0px) → translate(0px, 0px) · 1,000 ms · ease-custom-3 · observed
- Scroll reveal · List row (chance that) · when it enters the viewport at 75% from the bottom · opacity 0 → 1, transform translate(0px, 72px) → translate(0px, 0px) · 1,000 ms · ease-custom-3 · observed
- Scroll reveal · section.Section.EnterpriseHubHeroCardFan__section.theme--White div.Section__masked div.Section__container div.Section__layoutContainer > div > div:nth-of-type(1) > div:nth-of-type(1) > a > div:nth-of-type(1) > div:nth-of-type(2) > div · when it enters the viewport at 10% from the bottom · transform translateY(0px) → translateY(-192px) · 850 ms · accordionCollapseAnimationEasing

## Site variables

```css
/* Site variables, resolved */
:root {
  --accentColor: #fff;
  --accordionBorderColor: #e7ecf1;
  --arrowSpacing: 5px;
  --backgroundColor: #0a2540;
  --backgroundPosition: top center;
  --backgroundSize: 100% auto;
  --bar-index: 0;
  --bar-target-scale: 0.04697986577181208;
  --bar-total: 31;
  --bg-aside: #f8fafd;
  --bodyFont: var(--fontWeightNormal) var(--bodyFontSize,18px)/var(--bodyLineHeight,1.555555556) var(--fontFamily);
  --bodyFontSize: 15px;
  --bodyLineHeight: 1.6;
  --bodyMaxWidth: var(--copyMaxWidth);
  --bodyPaddingLeft: 0;
  --bodyPaddingRight: 0;
  --border: 1px solid #e7ecf1;
  --buttonColor: none;
  --card-grow-x: 4.828402366863905px;
  --card-grow-y: 4px;
  --card-radius: 6px;
  --cardBackground: #0c2e4e;
  --cardBorderColor: #0f395e;
  --cardBorderRadius: 4px;
  --cardContentBorder: 1px dashed #e7ecf1;
  --cardMinHeight: 72px;
  --cardSectionBorder: 1px solid #e7ecf1;
  --cardSectionPadding: 16px 24px;
  --cardShadow: 0 13px 27px -5px rgba(50,50,93,0.25),0 8px 16px -8px rgba(0,0,0,0.3);
  --cardShadowLarge: 0 30px 60px -12px rgba(50,50,93,0.25),0 18px 36px -18px rgba(0,0,0,0.3);
  --cardShadowLargeMargin: 32px;
  --cardShadowMedium: 0 13px 27px -5px rgba(50,50,93,0.25),0 8px 16px -8px rgba(0,0,0,0.3);
  --cardShadowXLarge: 0 50px 100px -20px rgba(50,50,93,0.25),0 30px 60px -30px rgba(0,0,0,0.3);
  --columnCountMax: 4;
  --columnPaddingXLarge: 112px;
  --columnWidth: calc(1080px/4);
  --combined-progress-bars: calc(var(--progress, 0) * 0.9 + var(--hover-progress) * 0.1);
  --content-padding: 32px;
  --copyMaxWidth: calc(calc(1080px*0.25)*3);
  --ctaFont: 425 15px/1.6 "sohne-var","Helvetica Neue","Arial",sans-serif;
  --customersCaseStudyCardBackgroundImageDisplay: block;
  --customersCaseStudyCardPadding: 16px;
  --desktopNavDisplay: none;
  --disclaimerTextColor: #707f98;
  --divider-vertical-margin: 12px;
  --fixedNavScrollMargin: calc(60px + 48px);
  --focusBoxShadow: 0 0 0 2px #4d90fe,inset 0 0 0 2px hsla(0,0%,100%,0.9);
  --fontFamily: "sohne-var","Helvetica Neue","Arial",sans-serif;
  --fontWeightBold: 500;
  --fontWeightNormal: 300;
  --fontWeightSemibold: 425;
  --frame-size: 70px;
  --globalizationPickerColumnCount: 1;
  --globalizationPickerColumnGutter: 16px;
  --globalizationPickerRowGap: 8px;
  --gradient-color: #533afd;
  --graphic-aspect-ratio: 1/1;
  --graphic-max-width: 100%;
  --graphic-scale: 1;
  --graphic-source-height: 0;
  --graphic-source-width: 0;
  --group-border: 1px solid #e5edf5;
  --guideSolidColor: rgba(66,71,112,0.3);
  --gutterWidth: calc(calc(100vw - 0px)/2 - 1080px/2);
  --hds-button-border-width: 1px;
  --hds-button-padding-block-end: 16.5px;
  --hds-button-padding-block-start: 15.5px;
  --hds-canary-grid-span-quarter: span 3;
  --hds-canary-layout-content-maxWidth-borders: calc(1264px + 2px);
  --hds-canary-ui-stroke: color-mix(in srgb,#e5edf5 50%,transparent);
  --hds-color-accent-charm-gradientEnd: #4032c8;
  --hds-color-accent-charm-gradientMiddle: #533afd;
  --hds-color-accent-charm-gradientStart: #7f7dfc;
  --hds-color-accentColorMode-default-icon-gradientEnd: #4032c8;
  --hds-color-accentColorMode-default-icon-gradientMiddle: #533afd;
  --hds-color-accentColorMode-default-icon-gradientStart: #7f7dfc;
  --hds-color-accentColorMode-default-icon-solidAlt: #533afd;
  --hds-color-accentColorMode-default-surface-subduedAlt: #e2e4ff;
  --hds-color-action-bg-disabled: #a8c3de4d;
  --hds-color-action-bg-quiet: #e8e9ff;
  --hds-color-action-bg-quietHover: #d6d9fc;
  --hds-color-action-bg-solid: #533afd;
  --hds-color-action-bg-solidHover: #4032c8;
  --hds-color-action-bg-subduedHover: #b9b9f9;
  --hds-color-action-border-disabled: #d4dee9;
  --hds-color-action-border-quiet: #d6d9fc;
  --hds-color-action-border-solidHover: #4032c8;
  --hds-color-action-border-subdued: #b9b9f9;
  --hds-color-action-icon-disabled: #95a4ba;
  --hds-color-action-icon-solid: #533afd;
  --hds-color-action-icon-solidHover: #2e2b8c;
  --hds-color-action-text-disabled: #95a4ba;
  --hds-color-action-text-onSolid: #fff;
  --hds-color-action-text-onTransparent: #533afd;
  --hds-color-action-text-solid: #533afd;
  --hds-color-action-text-solidAlternate: #533afd;
  --hds-color-action-text-solidHover: #2e2b8c;
  --hds-color-button-primary-bg: #533afd;
  --hds-color-button-primary-text: #fff;
  --hds-color-button-secondary-bg: #ffffff00;
  --hds-color-button-secondary-borderOnSubdued: #b9b9f9;
  --hds-color-button-secondary-text: #533afd;
  --hds-color-button-ui-bg: #e8e9ff;
  --hds-color-button-ui-icon: #533afd;
  --hds-color-core-brand-25: #f5f5ff;
  --hds-color-core-brand-25A: #acacff1f;
  --hds-color-core-brand-300: #9a9afe;
  --hds-color-core-brand-400A: #5452fbbf;
  --hds-color-core-brand-50: #e8e9ff;
  --hds-color-core-brand-50A: #a3a7ff40;
  --hds-color-core-brand-700: #4032c8;
  --hds-color-core-brand-75: #e2e4ff;
  --hds-color-core-brand-800: #2e2b8c;
  --hds-color-core-brand-900: #1c1e54;
  --hds-color-core-brand-925: #1c1e54;
  --hds-color-core-brand-950: #161741;
  --hds-color-core-brand-975: #0f1137;
  --hds-color-core-brandDark-100: #c3d3ff;
  --hds-color-core-brandDark-200: #a8bfff;
  --hds-color-core-brandDark-300: #92adff;
  --hds-color-core-brandDark-50: #e4eaff;
  --hds-color-core-brandDark-500: #5d64fe;
  --hds-color-core-brandDark-600: #533afd;
  --hds-color-core-brandDark-75: #ccdaff;
  --hds-color-core-brandDark-925: #1c1b5a;
  --hds-color-core-error-100: #feb9ac;
  --hds-color-core-error-300: #f4745c;
  --hds-color-core-error-400: #f3432a;
  --hds-color-core-error-500: #d8351e;
  --hds-color-core-error-50A: #ffafa24d;
  --hds-color-core-error-600: #a01400;
  --hds-color-core-global-transparent: #ffffff00;
  --hds-color-core-lemon-25: #fff2d8;
  --hds-color-core-lemon-300: #e8a30b;
  --hds-color-core-lemon-500: #9b6829;
  --hds-color-core-lemon-800: #483414;
  --hds-color-core-magenta-500: #cf2cab;
  --hds-color-core-magenta-800: #4f2055;
  --hds-color-core-neutral-0: #fff;
  --hds-color-core-neutral-100: #d4dee9;
  --hds-color-core-neutral-200: #bac8da;
  --hds-color-core-neutral-25: #f8fafd;
  --hds-color-core-neutral-25A: #1658bc08;
  --hds-color-core-neutral-300: #95a4ba;
  --hds-color-core-neutral-400: #7d8ba4;
  --hds-color-core-neutral-50: #e5edf5;
  --hds-color-core-neutral-500: #64748d;
  --hds-color-core-neutral-50A: #a8c3de4d;
  --hds-color-core-neutral-600: #50617a;
  --hds-color-core-neutral-700: #3c4f69;
  --hds-color-core-neutral-800: #273951;
  --hds-color-core-neutral-900: #1a2c44;
  --hds-color-core-neutral-950: #11273e;
  --hds-color-core-neutralDark-500: #6480b2;
  --hds-color-core-neutralDark-600: #45639d;
  --hds-color-core-neutralDark-700: #273f73;
  --hds-color-core-neutralDark-800: #23356e;
  --hds-color-core-neutralDark-900: #182659;
  --hds-color-core-neutralDark-990: #0d1738;
  --hds-color-core-orange-100: #ffd8c6;
  --hds-color-core-orange-350: #ff6118;
  --hds-color-core-orange-50: #ffe5da;
  --hds-color-core-orange-500: #d04900;
  --hds-color-core-orange-600: #ab3500;
  --hds-color-core-orange-800: #56281b;
  --hds-color-core-ruby-100: #fed9de;
  --hds-color-core-ruby-400: #ea2261;
  --hds-color-core-ruby-50: #fee8eb;
  --hds-color-core-ruby-500: #e2225f;
  --hds-color-core-ruby-600: #b51145;
  --hds-color-core-ruby-800: #5d1c3c;
  --hds-color-core-success-100: #b6f2c7;
  --hds-color-heading-solid: #061b31;
  --hds-color-input-border-error: #d8351e;
  --hds-color-input-text-disabled: #95a4ba;
  --hds-color-surface-bg-quiet: #fff;
  --hds-color-surface-bg-subdued: #f8fafd;
  --hds-color-surface-border-quiet: #e5edf5;
  --hds-color-text-solid: #061b31;
  --hds-color-text-subdued: #64748d;
  --hds-color-util-accent-magenta-100: #ffd7ef;
  --hds-color-util-action-fg-solid: #533afd;
  --hds-color-util-black: #061b31;
  --hds-color-util-border-quiet: #e5edf5;
  --hds-color-util-brand-300: #9a9afe;
  --hds-color-util-neutral-0: #fff;
  --hds-color-util-neutral-25: #f8fafd;
  --hds-color-util-neutral-50: #e5edf5;
  --hds-color-util-neutral-500: #64748d;
  --hds-color-util-neutral-600: #50617a;
  --hds-color-util-neutral-700: #3c4f69;
  --hds-color-util-neutral-800: #273951;
  --hds-color-util-neutral-990: #061b31;
  --hds-color-util-text-soft: #50617a;
  --hds-color-util-text-subdued: #64748d;
  --hds-color-util-white: #fff;
  --hds-font-family: "sohne-var","SF Pro Display",sans-serif;
  --hds-font-heading-md-letterSpacing: -0.01em;
  --hds-font-heading-md-lineHeight: 1.12;
  --hds-font-heading-md-size: 1.625rem;
  --hds-font-heading-xl-letterSpacing: -0.02em;
  --hds-font-heading-xl-lineHeight: 1.03;
  --hds-font-heading-xl-size: 3rem;
  --hds-font-heading-xs-letterSpacing: 0em;
  --hds-font-heading-xs-lineHeight: 1.2;
  --hds-font-heading-xs-size: 1rem;
  --hds-font-heading-xs-weight: 400;
  --hds-font-text-lg-letterSpacing: 0em;
  --hds-font-text-lg-lineHeight: 1.4;
  --hds-font-text-lg-size: 1.125rem;
  --hds-font-text-lg-weight: 300;
  --hds-font-text-md-letterSpacing: 0em;
  --hds-font-text-md-lineHeight: 1.4;
  --hds-font-text-md-size: 1rem;
  --hds-font-text-md-weight: 300;
  --hds-font-text-sm-letterSpacing: 0em;
  --hds-font-text-sm-lineHeight: 1.4;
  --hds-font-text-sm-size: 0.875rem;
  --hds-font-text-sm-weight: 300;
  --hds-font-weight-bold: 400;
  --hds-font-weight-normal: 300;
  --hds-icon-inline-gap: var(--hds-space-core-75);
  --hds-space-core-1200: 96px;
  --hds-space-core-200: 16px;
  --hds-space-core-25: 2px;
  --hds-space-core-350: 28px;
  --hds-space-core-400: 32px;
  --hds-space-core-50: 4px;
  --hds-space-core-700: 56px;
  --hds-space-core-75: 6px;
  --hds-space-core-900: 72px;
  --hds-space-input-text-paddingX-listbox: 12px;
  --hds-space-input-text-paddingY-listbox: 8px;
  --hds-space-layout-content-margin: 16px;
  --hds-space-layout-page-margin: 16px;
  --headerMaxWidth: var(--copyMaxWidth);
  --headerPaddingLeft: var(--paddingLeft);
  --headerPaddingRight: var(--paddingRight);
  --horizontal-scale-left: 0;
  --horizontal-transform: 0;
  --hover-progress: 0;
  --hoverTransition: none;
  --iconBorderRadius: 50%;
  --iconSize: 16px;
  --knockoutColor: #fff;
  --layoutWidth: 1080px;
  --linkColor: var(--accentColor);
  --linkWeight: var(--fontWeightBold);
  --maskSpacing: 16px;
  --maxWidth: 100%;
  --mouse-in-dir: right;
  --navColor: #fff;
  --navContainerBorderBottomRadius: 8px;
  --navHoverColor: #fff;
  --navHoverOpacity: 0.6;
  --navigation-border-radius: 6px;
  --navigation-content-padding: var(--hds-space-core-300);
  --paddingLeft: var(--columnPaddingNormal);
  --paddingRight: var(--columnPaddingMedium);
  --pictureBleedLeft: 0;
  --pictureBleedLeftMobile: 0;
  --pictureBleedRight: 0;
  --pictureBleedRightMobile: 0;
  --pictureMaxWidth: none;
  --pricingGridBorder: 1px solid rgba(66,71,112,0.06);
  --pricingGridDisclaimerFont: var(--fontWeightNormal) 13px/21px var(--fontFamily);
  --pricingGridPriceAmountFont: 425 15px/19px "sohne-var","Helvetica Neue","Arial",sans-serif;
  --pricingGridPriceCaptionFont: var(--fontWeightSemibold) 13px/21px var(--fontFamily);
  --pricingGridSubpriceFont: 300 13px/21px "sohne-var","Helvetica Neue","Arial",sans-serif;
  --progress: 0;
  --progress-in-window: clamp(0,calc((var(--combined-progress-bars) - var(--scale-start)) / (var(--scale-end) - var(--scale-start))),1);
  --refreshedNavHeight: 64px;
  --refreshedNavMaxWidth: 1264px;
  --refreshedNavPaddingBlock: 6px;
  --refreshedNavWidth: calc(100vw - 16px*2 - 0px);
  --rowGap: 8px;
  --rowGapMedium: 24px;
  --rowGapNormal: 8px;
  --scale-end: calc(var(--scale-start) + 0.3);
  --scale-start: calc(var(--bar-index) / var(--bar-total) * 0.7);
  --scrollbarWidth: 0px;
  --section-container-border-block-end: none;
  --section-container-border-inline: none;
  --section-container-padding-inline: 0;
  --section-container-pbe: 0;
  --section-container-pbe-dt: 36px;
  --section-container-pbe-tb: 56px;
  --section-container-pbs: 0;
  --section-container-pbs-dt: 36px;
  --section-container-pbs-tb: 56px;
  --section-row-gap-mb: initial;
  --section-row-gap-tb: initial;
  --sectionAngleHeight: calc(calc(100vw - 0px)*0.106);
  --sectionAnglePaddingBaseMax: 128;
  --sectionAnglePaddingBaseMin: 100;
  --sectionAngleSin: 0.106;
  --sectionPaddingMax: 128;
  --sectionPaddingMin: 72;
  --sectionPaddingTop: calc(128*1px);
  --shadow-aside: #e5edf5;
  --siteMenuSectionOffset: 0;
  --siteMenuSpacing: 24px;
  --siteMenuTransition: 0ms;
  --siteMobileMenuFooterHeight: 64px;
  --siteMobileMenuHeaderHeight: 60px;
  --siteMobileMenuPadding: 4px;
  --siteMobileMenuSectionTransform: translateY(0px);
  --stop-color: #fb76fa;
  --stripeBorderOffset: 0px;
  --stripeHeight: 40px;
  --stripeInset: 0px;
  --stripeSetHeight: 72px;
  --stripeWidth: var(--gutterWidth);
  --tableAlternateRowsDisplay: none;
  --tableBodyMargin: 4px;
  --tableCardLeft: 75%;
  --tableCellHorizontalPadding: 16px;
  --tableCellPadding: 16px 16px;
  --tableColumnJustify: center;
  --tableGutter: 16px;
  --tableIconColor: #8c9eb1;
  --tableRowGrid: auto/3fr 1fr;
  --tableRowHeaderGridArea: 1/span 1;
  --tableRowHeaderPaddingRight: 32px;
  --tableRowHeaderScrollSnapAlign: center;
  --tableRowHeaderTextAlign: left;
  --tableRowHeight: 80px;
  --textColor: #adbdcc;
  --textFont: 300 12px/100% "sohne-var","Helvetica Neue","Arial",sans-serif;
  --titleAnchorDisplay: none;
  --titleBorderColor: var(--accentColor);
  --titleColor: #fff;
  --titleFont: var(--titleWeight) var(--titleFontSize)/var(--titleLineHeight) var(--fontFamily);
  --titleFontSize: 24px;
  --titleLetterSpacing: 0.1px;
  --titleLineHeight: 1.333333333;
  --titlePaddingLeft: 0;
  --titlePaddingRight: 0;
  --titleWeight: var(--fontWeightBold);
  --tooltipFocusRingOffset: -2px;
  --tooltipItemBackgroundColor: #fff;
  --tooltipItemFont: 300 15px/1.333333333 "sohne-var","Helvetica Neue","Arial",sans-serif;
  --tooltipItemPadding: 12px 16px;
  --tooltipItemShadow: 0 30px 60px -12px rgba(50,50,93,0.25),0 18px 36px -18px rgba(0,0,0,0.3);
  --tooltipPadding: 0;
  --tooltipPointHeight: 12px;
  --tooltipPointOffsetX: 0px;
  --transitionDuration: 240ms;
  --userLogoColor: var(--navColor);
  --userLogoMaxWidth: 140px;
  --windowWidth: calc(100vw - 0px);
}
```

## Core components

### Button (nav, second)

Button. Variants: Primary, Secondary, Tertiary, Blue, Pink, Cyan.
States: Default, Hover, Focus, Active.
- Hover: background-color #0A2540 (300 ms); opacity 0.6 (300 ms)
- Focus: box-shadow 0px 0px 0px 2px #4D90FE, inset 0px 0px 0px 2px #FFFFFFE6
- Active: background-color #0A2540 (300 ms); opacity 0.6 (300 ms)
Tokens: hds-color-core-brand-500 for background-color, color-gray-50 for color, radius-pill for border-radius, hds-space-core-150 for padding-right, listSpacing for padding-bottom, columnPaddingNormal for padding-left, type-text-15 for font, accordionCollapseAnimationDuration for transition-duration, ease-custom-1 for transition-timing-function.
Default: background hds-color-core-brand-500 · text color-gray-50 · radius radius-pill · padding 3px hds-space-core-150 listSpacing columnPaddingNormal · font type-text-15
Motion: hover · background-color · 300 ms · ease-custom-1; hover · opacity · 300 ms · ease-custom-1; active · background-color · 300 ms · ease-custom-1; active · opacity · 300 ms · ease-custom-1; 1 motion pattern in the Motion section

```css
.dse-root .CtaButton { display: flex; align-items: center; justify-content: center; }
.dse-root .CtaButton { transition-property: opacity, color, background-color, border, fill, stroke; transition-duration: var(--accordionCollapseAnimationDuration); transition-timing-function: var(--ease-custom-1); transform: translateZ(0px); }
.CtaButton { display: inline-block; padding: 3px 0px 6px; border-radius: 16.5px; font: var(--ctaFont); color: var(--buttonColor); transition: var(--hoverTransition); outline: none; }
.CtaButton.variant--Button { padding-left: var(--columnPaddingNormal); padding-right: var(--columnPaddingNormal); background-color: var(--buttonColor); color: var(--knockoutColor); white-space: nowrap; transition-property: background-color, opacity; }
.CtaButton.variant--Button.CtaButton--arrow { padding-right: var(--hds-space-core-150); }
.nobr { white-space: nowrap; line-height: 0; }
.dse-root .HoverArrow { --hoverTransition: 150ms cubic-bezier(0.215,0.61,0.355,1); }
.HoverArrow { --arrowSpacing: 5px; position: relative; top: 1px; margin-left: var(--arrowSpacing); stroke-width: 2px; fill: none; stroke: currentcolor; }
a { text-decoration: none; }
```

### Button (footer, pricing)

Button. Variants: Default, Large.
States: Default, Hover, Focus, Active.
Tokens: tooltipItemTextColor for color, type-bodyFontSize for font.
Default: text tooltipItemTextColor · font type-bodyFontSize
Motion: PortalTooltipItemFadeIn · 250 ms · ease

```css
.PortalTooltipItem { --tooltipItemPadding: 12px 16px; --tooltipItemTextColor: var(--textColor); --tooltipItemFont: var(--fontWeightNormal) 15px/1.333333333 var(--fontFamily); --tooltipItemBackgroundColor: #fff; --tooltipItemShadow: var(--cardShadowLarge); --tooltipFocusRingOffset: -2px; position: relative; border-width: medium; border-style: none; border-color: currentcolor; border-image: none; outline: none; background: none; display: inline-block; padding: 0px; color: inherit; font: inherit; cursor: pointer; }
.PortalTooltipItem::before { content: ""; position: absolute; width: calc(var(--iconSize, 100%) + 4px); height: calc(var(--iconSize, 100%) + 4px); transform: translate(var(--tooltipFocusRingOffset),var(--tooltipFocusRingOffset)); border-radius: var(--iconBorderRadius); box-shadow: var(--focusBoxShadow); opacity: 0; transition-property: opacity; pointer-events: none; }
.PortalTooltipItem::before { transition: var(--hoverTransition); }
.PortalTooltipItem__tooltip { --tooltipPointHeight: 12px; --tooltipPointOffsetX: 0px; --linkColor: var(--accentColor); position: absolute; top: 50%; left: 50%; width: fit-content; max-width: 290px; z-index: 999999; transform-origin: left top; transform: scale(0); padding: var(--tooltipItemPadding); border: 1px solid var(--tooltipItemBackgroundColor); background: var(--tooltipItemBackgroundColor); box-shadow: var(--tooltipItemShadow); border-radius: var(--refreshedNavBorderRadius); font: var(--tooltipItemFont); letter-spacing: 0.2px; color: var(--tooltipItemTextColor); text-align: left; white-space: normal; word-break: break-word; opacity: 1; transition: opacity 1ms; }
.PortalTooltipItem__tooltip { animation: var(--duration-250) var(--ease) 0s 1 normal none running PortalTooltipItemFadeIn; transition-duration: var(--duration-250); }
.PortalTooltipItem__tooltip::before { content: ""; position: absolute; left: 0px; width: 100%; height: var(--tooltipPointHeight); }
.PortalTooltipItem__tooltip::after { content: ""; position: absolute; width: 0px; height: 0px; border-left: var(--tooltipPointHeight) solid transparent; border-right: var(--tooltipPointHeight) solid transparent; border-bottom: 0px solid transparent; border-top: var(--tooltipPointHeight) solid var(--tooltipItemBackgroundColor); left: calc(50% - var(--tooltipPointHeight) + var(--tooltipPointOffsetX)); }
```

### Button (financial infrastructure)

Button. Variants: Outlined, Primary, Outlined muted, Primary small.
States: Default, Hover, Focus, Active.
- Hover: background-color #4032C8 (300 ms)
- Focus: outline-width 3px; outline-color rgb(84 82 251 / 75%) (300 ms); outline-offset 1px
- Active: background-color #4032C8 (300 ms)
Tokens: hds-color-core-brand-600 for background-color, color-gray-50 for color, hds-space-core-radius-sm for border-radius, hds-space-core-300 for padding-right, hds-space-core-300 for padding-left, type-subheading-strong-sm for font, accordionCollapseAnimationDuration for transition-duration, ease-custom-1 for transition-timing-function.
Default: background hds-color-core-brand-600 · text color-gray-50 · radius hds-space-core-radius-sm · padding 15.5px hds-space-core-300 16.5px hds-space-core-300 · font type-subheading-strong-sm
Motion: hover · background-color · 300 ms · ease-custom-1; focus · outline-color · 300 ms · ease-custom-1; active · background-color · 300 ms · ease-custom-1

```css
a { overflow-wrap: break-word; }
.hds-button { cursor: pointer; text-decoration: none; white-space: nowrap; font-family: var(--hds-font-family); font-weight: var(--hds-font-weight-bold); font-size: 1rem; line-height: 1; width: fit-content; letter-spacing: 0px; gap: var(--hds-space-core-100); height: fit-content; --hds-button-padding-block-start: 15.5px; --hds-button-padding-block-end: 16.5px; --hds-button-border-width: 1px; color: var(--hds-color-button-primary-text); background-color: var(--hds-color-button-primary-bg); display: inline-flex; align-items: center; text-box: cap alphabetic; border-radius: var(--hds-space-core-radius-sm); padding-block: var(--hds-button-padding-block-start) var(--hds-button-padding-block-end); padding-inline: var(--hds-space-core-300); outline: transparent solid 0px; box-shadow: none; }
.hds-button { transition: background-color var(--accordionCollapseAnimationDuration) var(--ease-custom-1), color var(--accordionCollapseAnimationDuration) var(--ease-custom-1), outline-color var(--accordionCollapseAnimationDuration) var(--ease-custom-1), border var(--accordionCollapseAnimationDuration) var(--ease-custom-1); }
.hds-button { border-width: medium; border-style: none; border-color: currentcolor; border-image: none; }
.dse-root .hds-button { flex-grow: 1; justify-content: center; overflow: hidden; }
.dse-root .hds-button { min-width: 0px; }
.hds-nowrap-svg { display: inline; white-space: nowrap; }
svg { display: block; vertical-align: middle; }
.hds-icon { display: inline; vertical-align: baseline; }
.hds-icon-hover-arrow { display: inline; vertical-align: baseline; overflow: visible; --hds-icon-inline-gap: var(--hds-space-core-75); }
.hds-icon-hover-arrow { transition: stroke var(--accordionCollapseAnimationDuration) var(--ease-custom-1); }
.hds-nowrap-svg::before { content: "⁠"; }
::placeholder { opacity: 1; }
```

### Button (postpayment invoices)

Button. Variants: Ghost, Ghost muted.
States: Default, Hover, Focus, Active.
Tokens: tooltipItemTextColor for color, type-bodyFontSize for font.
Default: text tooltipItemTextColor · padding 0px 2px 0px 2px · font type-bodyFontSize
Motion: PortalTooltipItemFadeIn · 250 ms · ease

```css
.PortalTooltipItem { --tooltipItemPadding: 12px 16px; --tooltipItemTextColor: var(--textColor); --tooltipItemFont: var(--fontWeightNormal) 15px/1.333333333 var(--fontFamily); --tooltipItemBackgroundColor: #fff; --tooltipItemShadow: var(--cardShadowLarge); --tooltipFocusRingOffset: -2px; position: relative; border-width: medium; border-style: none; border-color: currentcolor; border-image: none; outline: none; background: none; display: inline-block; padding: 0px; color: inherit; font: inherit; cursor: pointer; }
.dse-root .PricingGridPrice__tooltipButton.TooltipButton { --tooltipPadding: 0 2px; vertical-align: middle; position: relative; top: -1px; }
.TooltipButton.PortalTooltipItem { --tooltipPadding: 8px; --tooltipFocusRingOffset: 0px; --iconBorderRadius: 50%; z-index: 1; display: inline-flex; justify-content: center; align-items: center; padding: var(--tooltipPadding); pointer-events: auto; user-select: none; }
.TooltipButton--iconSizeNormal { --iconSize: 16px; }
.PortalTooltipItem::before { content: ""; position: absolute; width: calc(var(--iconSize, 100%) + 4px); height: calc(var(--iconSize, 100%) + 4px); transform: translate(var(--tooltipFocusRingOffset),var(--tooltipFocusRingOffset)); border-radius: var(--iconBorderRadius); box-shadow: var(--focusBoxShadow); opacity: 0; transition-property: opacity; pointer-events: none; }
.PortalTooltipItem::before { transition: var(--hoverTransition); }
.TooltipButton__icon { display: block; width: var(--iconSize); height: var(--iconSize); }
.PortalTooltipItem__tooltip { --tooltipPointHeight: 12px; --tooltipPointOffsetX: 0px; --linkColor: var(--accentColor); position: absolute; top: 50%; left: 50%; width: fit-content; max-width: 290px; z-index: 999999; transform-origin: left top; transform: scale(0); padding: var(--tooltipItemPadding); border: 1px solid var(--tooltipItemBackgroundColor); background: var(--tooltipItemBackgroundColor); box-shadow: var(--tooltipItemShadow); border-radius: var(--refreshedNavBorderRadius); font: var(--tooltipItemFont); letter-spacing: 0.2px; color: var(--tooltipItemTextColor); text-align: left; white-space: normal; word-break: break-word; opacity: 1; transition: opacity 1ms; }
.PortalTooltipItem__tooltip { animation: var(--duration-250) var(--ease) 0s 1 normal none running PortalTooltipItemFadeIn; transition-duration: var(--duration-250); }
.PortalTooltipItem__tooltip::before { content: ""; position: absolute; left: 0px; width: 100%; height: var(--tooltipPointHeight); }
.PortalTooltipItem__tooltip::after { content: ""; position: absolute; width: 0px; height: 0px; border-left: var(--tooltipPointHeight) solid transparent; border-right: var(--tooltipPointHeight) solid transparent; border-bottom: 0px solid transparent; border-top: var(--tooltipPointHeight) solid var(--tooltipItemBackgroundColor); left: calc(50% - var(--tooltipPointHeight) + var(--tooltipPointOffsetX)); }
```

### Button (footer, enterprise)

Button. Variants: Default.
States: Default.
Tokens: overlay-hds-color-core-brand-500-6 for background-color, hds-color-core-brand-500 for color, hds-space-core-radius-sm for border-radius, listSpacing for padding-top, columnPaddingNormal for padding-right, hds-space-core-100 for padding-bottom, columnPaddingNormal for padding-left, duration-150 for transition-duration, ease-out-cubic for transition-timing-function.
Default: background overlay-hds-color-core-brand-500-6 · text hds-color-core-brand-500 · radius hds-space-core-radius-sm · padding listSpacing columnPaddingNormal hds-space-core-100 columnPaddingNormal · font 16px 425
Motion: none

```css
.Link { font-weight: var(--linkWeight,var(--fontWeightSemibold)); cursor: pointer; color: var(--linkColor); opacity: 1; transition-property: color, opacity; outline: none; }
.BucketLink.Link { padding: 6px var(--columnPaddingNormal) var(--hds-space-core-100); border-radius: var(--hds-space-core-radius-sm); background: rgba(99, 91, 255, 0.05); }
a { text-decoration: none; }
```

### Button (nav, pricing)

Button. Variants: Ghost, Ghost muted.
States: Default, Hover, Focus, Active, Open.
- Hover: color #061B31 (300 ms); border-color #061B31 (300 ms); text-decoration-color #061B31
- Focus: color #061B31 (300 ms); border-color #061B31 (300 ms); box-shadow 0px 0px 0px 2px #4D90FE, inset 0px 0px 0px 2px #FFFFFFE6; text-decoration-color #061B31
- Active: color #061B31 (300 ms); border-color #061B31 (300 ms); text-decoration-color #061B31
- Open: color #061B31; border-color #061B31; text-decoration-color #061B31
Tokens: hds-color-core-neutral-975 for color, hds-space-core-150 for padding-top, hds-space-core-150 for padding-right, hds-space-core-150 for padding-left, type-body for font, accordionCollapseAnimationDuration for transition-duration, ease-custom-1 for transition-timing-function.
Default: text hds-color-core-neutral-975 · padding hds-space-core-150 hds-space-core-150 14px hds-space-core-150 · font type-body
Motion: hover · color · 300 ms · ease-custom-1; hover · border-color · 300 ms · ease-custom-1; focus · color · 300 ms · ease-custom-1; focus · border-color · 300 ms · ease-custom-1; active · color · 300 ms · ease-custom-1; active · border-color · 300 ms · ease-custom-1

```css
.dse-root .SiteHeaderNavItem__link { text-box: cap alphabetic; }
.dse-root .SiteHeaderNavItem__link--hasCaret { column-gap: var(--listSpacing); }
.dse-root .SiteHeaderNavItem__link { transition-property: opacity, color, background-color, border, fill, stroke; transition-duration: var(--accordionCollapseAnimationDuration); transition-timing-function: var(--ease-custom-1); transform: translateZ(0px); }
.SiteHeaderNavItem__link { --linkColor: var(--navColor); display: block; padding: 10px var(--hds-space-core-250); font: var(--fontWeightBold) 15px/1.6 var(--fontFamily); letter-spacing: 0.2px; color: var(--navColor); cursor: pointer; appearance: none; background-color: transparent; border-width: medium; border-style: none; border-color: currentcolor; border-image: none; outline: none; }
.SiteHeaderNavItem__link[aria-haspopup="true"] { cursor: default; transition-property: color, opacity; }
.SiteHeaderNavItem__link--hasCaret { display: flex; align-items: center; column-gap: 3px; }
.dse-root .SiteHeaderNavItem__link { letter-spacing: normal; font: 400 14px/1 var(--fontFamily); padding-block: var(--hds-space-core-150) 14px; padding-inline: var(--hds-space-core-150); cursor: pointer; }
.dse-root .SiteHeaderNavItem__link--hasCaret .SiteHeaderNavItem__linkCaretContainer { margin-block-start: 2px; padding: 0px; }
.SiteHeaderNavItem__link--hasCaret span, .SiteHeaderNavItem__link--hasCaret svg { display: inline-flex; }
.SiteHeaderNavItem__link--hasCaret .SiteHeaderNavItem__linkCaretContainer { position: relative; padding: 7px 1px 5px; }
.SiteHeaderNavItem__link--hasCaret .SiteHeaderNavItem__linkCaret { transition: transform var(--duration-400) var(--ease-custom-2); }
.SiteHeaderNavItem__link--hasCaret .SiteHeaderNavItem__linkCaret--left { translate: 2px; }
.SiteHeaderNavItem__link--hasCaret .SiteHeaderNavItem__linkCaret--right { translate: -2px; }
```

### Button

Button. Variants: Ghost, Ghost muted.
States: Default, Hover, Focus, Active, Open.
- Focus: outline-width 3px; outline-color rgb(84 82 251 / 75%); outline-offset 1px
Tokens: hds-color-core-neutral-990 for color, hds-space-core-radius-sm for border-radius, hds-space-core-150 for padding-top, hds-space-core-150 for padding-bottom, type-body for font, navigation-duration for transition-duration, navigation-easing for transition-timing-function.
Default: text hds-color-core-neutral-990 · radius hds-space-core-radius-sm · padding hds-space-core-150 0px hds-space-core-150 0px · font type-body
Motion: none

```css
button { padding: 0px; padding: 0px; padding: 0px; }
button { font: inherit; letter-spacing: inherit; }
.hds-button { cursor: pointer; text-decoration: none; white-space: nowrap; font-family: var(--hds-font-family); font-weight: var(--hds-font-weight-bold); font-size: 1rem; line-height: 1; width: fit-content; letter-spacing: 0px; gap: var(--hds-space-core-100); height: fit-content; --hds-button-padding-block-start: 15.5px; --hds-button-padding-block-end: 16.5px; --hds-button-border-width: 1px; color: var(--hds-color-button-primary-text); background-color: var(--hds-color-button-primary-bg); display: inline-flex; align-items: center; text-box: cap alphabetic; border-radius: var(--hds-space-core-radius-sm); padding-block: var(--hds-button-padding-block-start) var(--hds-button-padding-block-end); padding-inline: var(--hds-space-core-300); outline: transparent solid 0px; box-shadow: none; }
.hds-button { transition: background-color var(--accordionCollapseAnimationDuration) var(--ease-custom-1), color var(--accordionCollapseAnimationDuration) var(--ease-custom-1), outline-color var(--accordionCollapseAnimationDuration) var(--ease-custom-1), border var(--accordionCollapseAnimationDuration) var(--ease-custom-1); }
.hds-button { border-width: medium; border-style: none; border-color: currentcolor; border-image: none; }
.hds-button--transparent { background-color: transparent; color: var(--hds-color-action-text-onTransparent); border-width: medium; border-style: none; border-color: currentcolor; border-image: none; }
.dse-root .hds-navigation-menu__trigger { font-size: 0.875rem; gap: var(--hds-space-core-50); align-items: center; }
.hds-navigation-menu__trigger { position: relative; }
.dse-root * { flex: 1 1 0%; }
.dse-root .hds-button--transparent { padding-inline: 0px; padding-block: var(--hds-space-core-150); color: var(--hds-color-text-solid); }
.dse-root .hds-button { transition: color var(--navigation-duration) var(--navigation-easing) 0s,background-color var(--navigation-duration) var(--navigation-easing) 0s,border-color var(--navigation-duration) var(--navigation-easing) 0s; }
svg { display: block; vertical-align: middle; }
.hds-icon { display: inline; vertical-align: baseline; }
:where(.hds-navigation-menu__trigger) .hds-icon { top: 0.1em; position: relative; fill: none; }
.hds-navigation-menu__trigger::after { content: ""; position: absolute; inset: 0px; margin-inline: calc(-1 * var(--hds-space-core-150)); }
::placeholder { opacity: 1; }
```

### Button (nav, third)

Button. Variants: Default.
States: Default, Hover, Focus, Active.
Tokens: hds-color-core-neutral-975 for color, hds-space-core-300 for padding-left, type-bodyFontSize for font.
Default: text hds-color-core-neutral-975 · padding 0px 0px 0px hds-space-core-300 · font type-bodyFontSize
Motion: none

```css
.LocaleControl__trigger { margin: var(--listSpacing) 0px; padding: 0px 0px 0px var(--hds-space-core-300); outline: none; background-color: transparent; border-width: medium; border-style: none; border-color: currentcolor; border-image: none; display: flex; align-items: center; user-select: none; cursor: pointer; font: var(--fontWeightNormal) 15px/1.6 var(--fontFamily); color: var(--accentColor); text-align: left; }
.LocaleControl__triggerIcon { position: absolute; top: 5px; left: 0px; }
```

### Button (embed payments)

Button. Variants: Default, Small.
States: Default, Hover, Focus, Active, Open.
Tokens: color-gray-950 for color, type-subheading-strong-sm for font, duration-120 for transition-duration, ease-steps-1 for transition-timing-function.
Default: text color-gray-950 · font type-subheading-strong-sm
Motion: 11 motion patterns in the Motion section

```css
h3 { margin: 0px; margin: 0px; margin: 0px; }
button { padding: 0px; padding: 0px; padding: 0px; }
.tabular-nums--tight { font-feature-settings: "tnum"; font-variant-numeric: tabular-nums; }
.tabular-nums--tight { letter-spacing: -0.03em; }
button { font: inherit; letter-spacing: inherit; }
.modular-solutions-bento-card { --card-ease: cubic-bezier(0.165,0.84,0.44,1); --card-duration: 800ms; --card-radius: var(--hds-space-core-radius-md); position: relative; display: flex; flex: 1 1 0%; transition: z-index 0.1s step-end; cursor: pointer; aspect-ratio: 344 / 504; max-height: 676px; contain: layout style; border-width: medium; border-style: none; border-color: currentcolor; border-image: none; background: none; appearance: none; border-radius: 0px; box-shadow: none; padding: 0px; color: inherit; font: inherit; }
.dse-root .modular-solutions-bento-card { flex-basis: 100%; max-height: 576px; }
.dse-root .modular-solutions-bento-card { flex-basis: calc(50% - var(--hds-space-core-200)); max-height: 100%; }
.dse-root .modular-solutions-bento-card.modular-solutions-bento__card-payments { aspect-ratio: 816 / 676; max-width: 816px; flex-basis: calc(66.666% - 8px); }
.modular-solutions-bento-card__dialog-entry { position: absolute; right: 16px; top: 16px; width: 38px; height: 38px; z-index: 3; pointer-events: none; }
.modular-solutions-bento-card__dialog-entry { transition: transform var(--card-duration) var(--card-ease); }
.modular-solutions-bento-card__dialog-entry .modular-solutions-bento-card__dialog-entry-wrapper { position: relative; border-width: medium; border-style: none; border-color: currentcolor; border-image: none; cursor: pointer; padding: 0px; text-decoration: none; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; will-change: background-color; z-index: 1; }
svg { display: block; vertical-align: middle; }
.link-brand-logo { display: block; }
.modular-solutions-bento-card svg { pointer-events: none; }
.modular-solutions-bento-card__text { pointer-events: none; max-width: min(100% - 80px, 21ch); position: absolute; top: var(--hds-space-core-200); left: var(--hds-space-core-200); z-index: 3; font-size: var(--hds-font-heading-md-size); }
.modular-solutions-bento-card__text { max-width: min(100% - 100px, 21ch); }
.modular-solutions-bento-card__text { max-width: min(100% - 120px, 21ch); }
.modular-solutions-bento-card__text { max-width: 21ch; padding-right: 60px; top: var(--hds-space-core-300); left: var(--hds-space-core-300); }
.modular-solutions-bento__card-payments .modular-solutions-bento-card__text { max-width: 42ch; }
h3 { font-size: inherit; font-weight: inherit; }
h3 { overflow-wrap: break-word; }
.hds-heading { font-family: var(--hds-font-family); color: var(--hds-color-heading-solid); }
.hds-heading--md { font-weight: 300; font-size: var(--hds-font-heading-md-size); line-height: var(--hds-font-heading-md-lineHeight); letter-spacing: var(--hds-font-heading-md-letterSpacing); }
.modular-solutions-bento-card__text .modular-solutions-bento-card__title { font-size: min(var(--hds-font-heading-md-size),2.75vw); }
.modular-solutions-bento-card__text .modular-solutions-bento-card__title { font-size: min(var(--hds-font-heading-md-size),3.3vw); }
.modular-solutions-bento-card__text .modular-solutions-bento-card__title { font-size: min(var(--hds-font-heading-md-size),2.1vw); }
.modular-solutions-bento-card__title { text-wrap: balance; }
.modular-solutions-bento-card__title { transition: transform var(--card-duration) var(--card-ease); }
.modular-solutions-bento-card__border { position: absolute; inset: -1px; z-index: 1; border-radius: var(--card-radius); background: var(--hds-color-core-neutral-50); overflow: hidden; pointer-events: none; }
.modular-solutions-bento-card__border { inset: calc(-1 * var(--card-grow-y) - 1px) calc(-1 * var(--card-grow-x) - 1px) calc(-1 * var(--card-grow-y) - 1px) calc(-1 * var(--card-grow-x) - 1px);
/* shortened · 3,934 of 25,980 characters · the component's own prompt has all of it */
```

### Button (do you)

Button. Variants: Default.
States: Default, Hover, Focus, Active, Open.
Tokens: color-gray-50 for background-color, hds-color-core-neutral-975 for color, columnPaddingMedium for padding-right, columnPaddingNormal for padding-left, type-text-15 for font, duration-150 for transition-duration, ease-out-cubic for transition-timing-function.
Default: background color-gray-50 · text hds-color-core-neutral-975 · padding 17px columnPaddingMedium 19px columnPaddingNormal · font type-text-15
Motion: none

```css
.AccordionItem__headingButton { appearance: none; margin: 0px; position: relative; transition: var(--hoverTransition); display: flex; gap: var(--columnPaddingNormal); align-items: center; justify-content: space-between; width: 100%; padding: 17px var(--columnPaddingNormal) 19px; border-width: medium; border-style: none; border-color: currentcolor; border-image: none; border-radius: 0px; background: var(--color-gray-50); color: var(--titleColor); font: var(--ctaFont); cursor: pointer; }
.AccordionItem__headingButton { padding: 17px var(--columnPaddingMedium) 19px var(--columnPaddingNormal); }
.AccordionItem__headingButtonLabel { transition: var(--hoverTransition); text-align: left; }
.AccordionItem__headingIcon { transform: rotate(180deg); transition: transform var(--accordionCollapseAnimationDuration) var(--accordionCollapseAnimationEasing); flex-shrink: 0; }
```

### Button (nav, blog)

Button. Variants: Ghost, Primary.
States: Default.
Tokens: hds-color-core-brand-500 for background-color, color-gray-50 for color, radius-pill for border-radius, columnPaddingNormal for padding-right, listSpacing for padding-bottom, columnPaddingNormal for padding-left, type-text-15 for font, duration-150 for transition-duration, ease-out-cubic for transition-timing-function.
Default: background hds-color-core-brand-500 · text color-gray-50 · radius radius-pill · padding 3px columnPaddingNormal listSpacing columnPaddingNormal · font type-text-15
Motion: none

```css
.SegmentedControlButton { height: 32px; outline: none; appearance: none; border-width: medium; border-style: none; border-color: currentcolor; border-image: none; background-color: transparent; font: var(--ctaFont); border-radius: 16.5px; padding: 3px var(--columnPaddingNormal) 6px; cursor: pointer; position: relative; color: var(--navColor); white-space: nowrap; transition-property: opacity; }
.SegmentedControlButton--active { background-color: var(--accentColor); color: var(--knockoutColor); }
```

### Button (support plans)

Button. Variants: Default.
States: Default, Hover, Focus, Active.
Tokens: color-gray-950 for color, columnPaddingNormal for padding-right, columnPaddingNormal for padding-left, type-subheading-strong-sm for font.
Default: text color-gray-950 · padding 0px columnPaddingNormal 0px columnPaddingNormal · font type-subheading-strong-sm
Motion: none

```css
h3 { margin: 0px; margin: 0px; margin: 0px; }
button { padding: 0px; padding: 0px; padding: 0px; }
button { font: inherit; letter-spacing: inherit; }
.customer-stories__customer-button { flex: 1 1 auto; padding-inline: var(--hds-space-core-200); border-width: medium; border-style: none; border-color: currentcolor; border-image: none; background: none; text-align: left; cursor: pointer; appearance: none; }
.dse-root .customer-stories__customer-button { cursor: default; }
h3 { font-size: inherit; font-weight: inherit; }
h3 { overflow-wrap: break-word; }
.hds-heading { font-family: var(--hds-font-family); color: var(--hds-color-heading-solid); }
.hds-heading--sm { font-weight: 300; font-size: 1.375rem; line-height: 1.1; letter-spacing: -0.01em; }
::placeholder { opacity: 1; }
```

### Button (manage platform)

Button. Variants: Default.
States: Default, Hover, Focus, Active.
- Hover: cursor pointer
- Focus: outline-width 3px; outline-color rgb(84 82 251 / 75%) (300 ms); outline-offset 1px
- Active: cursor pointer
Tokens: hds-space-core-radius-sm for border-radius, columnPaddingMedium for padding-top, columnPaddingMedium for padding-bottom, accordionCollapseAnimationDuration for transition-duration, ease-custom-1 for transition-timing-function.
Default: radius hds-space-core-radius-sm · padding columnPaddingMedium 0px columnPaddingMedium 0px
Motion: focus · outline-color · 300 ms · ease-custom-1

### Button (footer)

Button. Variants: Default.
States: Default, Hover, Focus, Active.
- Hover: color #2E2B8C (300 ms); border-color #2E2B8C (300 ms); text-decoration-color #2E2B8C
- Active: color #2E2B8C (300 ms); border-color #2E2B8C (300 ms); text-decoration-color #2E2B8C
Tokens: hds-color-core-brand-600 for color, hds-space-core-radius-sm for border-radius, type-subheading-strong-sm for font, accordionCollapseAnimationDuration for transition-duration, ease-custom-1 for transition-timing-function.
Default: text hds-color-core-brand-600 · radius hds-space-core-radius-sm · font type-subheading-strong-sm
Motion: hover · color · 300 ms · ease-custom-1; hover · border-color · 300 ms · ease-custom-1; active · color · 300 ms · ease-custom-1; active · border-color · 300 ms · ease-custom-1

### Button (nav, fourth)

Button. Variants: Primary, Secondary, Tertiary, Orange, Pink.
States: Default, Hover, Focus, Active.
- Focus: outline-width 1px; outline-style auto; outline-color #005FCC
Tokens: hds-color-core-brand-500 for background-color, hds-space-core-radius-md for border-radius, ease-custom-8 for transition-timing-function, duration-250 for transition-duration, ease-in-out for transition-timing-function.
Default: background hds-color-core-brand-500 · radius hds-space-core-radius-md
Motion: none

### Button (decagon decreases)

Button. Variants: Default, Small.
States: Default, Hover, Focus, Active, Disabled.
- Hover: background-color #D6D9FC (300 ms); color #000000; border-color #000000; outline-width 0px; outline-color transparent (300 ms); outline-offset 0px; text-decoration-color #000000; cursor pointer
- Focus: background-color #E8E9FF (300 ms); color #000000; border-color #000000; outline-width 0px; outline-color transparent (300 ms); outline-offset 0px; text-decoration-color #000000; cursor pointer
- Active: background-color #D6D9FC (300 ms); color #000000; border-color #000000; outline-width 0px; outline-color transparent (300 ms); outline-offset 0px; text-decoration-color #000000; cursor pointer
Tokens: hds-space-core-radius-sm for border-radius, accordionCollapseAnimationDuration for transition-duration, ease-custom-1 for transition-timing-function.
Default: radius hds-space-core-radius-sm
Motion: hover · background-color · 300 ms · ease-custom-1; hover · outline-color · 300 ms · ease-custom-1; focus · background-color · 300 ms · ease-custom-1; focus · outline-color · 300 ms · ease-custom-1; active · background-color · 300 ms · ease-custom-1; active · outline-color · 300 ms · ease-custom-1

### Button (nav, sixth)

Button. Variants: Default.
States: Default.
Tokens: none.
Default: background none
Motion: none

### Button (nav, atlas)

Button. Variants: Default.
States: Default.
Tokens: hds-space-core-100 for padding-top, hds-space-core-100 for padding-bottom.
Default: padding hds-space-core-100 0px hds-space-core-100 0px
Motion: none

### Button (nav, eighth)

Button. Variants: Default.
States: Default.
Tokens: none.
Default: background none
Motion: none

### Button (home, third)

Button. Variants: Primary bold, Primary.
States: Default, Hover, Focus, Active.
- Hover: background-color #1A3A5C (200 ms); width 180.844px
- Active: background-color #1A3A5C (200 ms); width 180.844px
Tokens: hds-color-core-neutral-975 for background-color, color-gray-50 for color, overlay-white-12 for border-color, hds-space-core-radius-sm for border-radius, hds-space-core-300 for padding-right, hds-space-core-300 for padding-left, ease-in-out for transition-timing-function.
Default: background hds-color-core-neutral-975 · text color-gray-50 · border 1px overlay-white-12 · radius hds-space-core-radius-sm · padding 0px hds-space-core-300 0px hds-space-core-300 · font 15px 400
Motion: hover · background-color · 200 ms · ease-in-out; active · background-color · 200 ms · ease-in-out

### Button (the backbone)

Button. Variants: Default.
States: Default, Hover, Focus, Active.
Tokens: color-gray-950 for color, type-subheading-strong-sm for font.
Default: text color-gray-950 · font type-subheading-strong-sm
Motion: none

### Button (nav, home)

Button. Variants: Primary, Secondary.
States: Default, Hover, Focus, Active, Open.
- Hover: background-color #D6D9FC (300 ms)
- Focus: outline-width 3px; outline-color rgb(84 82 251 / 75%) (300 ms); outline-offset 1px
- Active: background-color #D6D9FC (300 ms)
Tokens: hds-color-action-bg-subdued for background-color, hds-space-core-radius-sm for border-radius, accordionCollapseAnimationDuration for transition-duration, ease-custom-1 for transition-timing-function.
Default: background hds-color-action-bg-subdued · radius hds-space-core-radius-sm
Motion: hover · background-color · 300 ms · ease-custom-1; focus · outline-color · 300 ms · ease-custom-1; active · background-color · 300 ms · ease-custom-1

### Button (see how)

Button. Variants: Default.
States: Default, Hover, Focus, Active.
Tokens: hds-space-core-250 for padding-top, hds-space-core-250 for padding-bottom.
Default: padding hds-space-core-250 0px hds-space-core-250 0px
Motion: none

### Button (pricing)

Button. Variants: Default.
States: Default, Hover, Focus, Active.
Tokens: hds-space-core-100 for padding-top, hds-space-core-100 for padding-right, columnPaddingNormal for padding-bottom, columnPaddingNormal for padding-left.
Default: padding hds-space-core-100 hds-space-core-100 columnPaddingNormal columnPaddingNormal
Motion: none

### Button (nav)

Button. Variants: Default.
States: Default, Hover, Focus, Active.
- Hover: background-color #4032C8 (240 ms)
- Active: background-color #4032C8 (240 ms)
Tokens: hds-color-core-brand-600 for background-color, color-gray-50 for color, hds-space-core-radius-sm for border-radius, hds-space-core-250 for padding-right, hds-space-core-250 for padding-left, type-body for font, navigation-duration for transition-duration, navigation-easing for transition-timing-function.
Default: background hds-color-core-brand-600 · text color-gray-50 · radius hds-space-core-radius-sm · padding 11.5px hds-space-core-250 12.5px hds-space-core-250 · font type-body
Motion: hover · background-color · 240 ms · navigation-easing; active · background-color · 240 ms · navigation-easing

### Header (pricing)

Header. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, tooltipItemTextColor for color, listSpacing for padding-top, listSpacing for padding-bottom, type-bodyFontSize for font.
Default: background color-gray-50 · text tooltipItemTextColor · padding listSpacing 0px listSpacing 0px · font type-bodyFontSize
Motion: refreshed-nav-hover-arrow-out · 150 ms · ease-custom-1

### Nav bar (header, pricing)

Nav bar. Variants: Default.
States: Default.
Tokens: tooltipItemTextColor for color, type-bodyFontSize for font.
Default: text tooltipItemTextColor · font type-bodyFontSize
Motion: none

### Nav bar (header, second)

Nav bar. Variants: Default.
States: Default.
Tokens: tooltipItemTextColor for color, type-bodyFontSize for font.
Default: text tooltipItemTextColor · font type-bodyFontSize
Motion: none

### Nav bar (header, third)

Nav bar. Variants: Default.
States: Default.
Tokens: none.
Default: background none
Motion: none

### Nav bar

Nav bar. Variants: Default.
States: Default.
Tokens: color-gray-950 for color, hds-space-core-radius-md for border-radius, hds-space-core-100 for padding-top, columnPaddingNormal for padding-right, hds-space-core-100 for padding-bottom, columnPaddingNormal for padding-left, type-subheading-strong-sm for font.
Default: text color-gray-950 · radius hds-space-core-radius-md · padding hds-space-core-100 columnPaddingNormal hds-space-core-100 columnPaddingNormal · font type-subheading-strong-sm
Motion: detect-scroll · 0 ms · ease-linear

### Nav bar (header)

Nav bar. Variants: Ghost square, Ghost rounded.
States: Default.
Tokens: hds-space-core-150 for padding-top, hds-space-core-150 for padding-right, columnPaddingNormal for padding-left.
Default: padding hds-space-core-150 hds-space-core-150 14px columnPaddingNormal
Motion: detect-scroll · 0 ms · ease-linear

### Breadcrumb

Breadcrumb. Variants: Default.
States: Default.
Tokens: tooltipItemTextColor for color, columnPaddingNormal for padding-top, columnPaddingNormal for padding-bottom, type-bodyFontSize for font.
Default: text tooltipItemTextColor · padding columnPaddingNormal 0px columnPaddingNormal 0px · font type-bodyFontSize
Motion: none

### Nav bar (custom pricing)

Nav bar. Variants: Default.
States: Default.
Tokens: color-green-400 for color, columnPaddingNormal for padding-top, columnPaddingNormal for padding-bottom, columnPaddingNormal for padding-left, type-bodyFontSize for font.
Default: text color-green-400 · padding columnPaddingNormal 0px columnPaddingNormal columnPaddingNormal · font type-bodyFontSize
Motion: none

### Header (home)

Header. Variants: Default.
States: Default.
Tokens: none.
Default: background none
Motion: detect-scroll · 0 ms · ease-linear

### List row (dispute prevention)

List row. Variants: Default.
States: Default.
Tokens: tooltipItemTextColor for color, color-gray-50 for border-color, type-bodyFontSize for font.
Default: text tooltipItemTextColor · border 1px color-gray-50 · font type-bodyFontSize
Motion: none

### Card (see how, third)

Card. Variants: Primary, Secondary, Tertiary, Teal, Indigo, Blue, Cyan, Amber, Orange.
States: Default.
Tokens: hds-color-core-brand-500 for background-color, color-gray-50 for color, hds-space-core-radius-md for border-radius, hds-space-core-300 for padding-right, hds-space-core-300 for padding-left, type-bodyFontSize for font.
Default: background hds-color-core-brand-500 · text color-gray-50 · radius hds-space-core-radius-md · padding 22px hds-space-core-300 22px hds-space-core-300 · font type-bodyFontSize
Motion: none

### Card (header)

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, tooltipItemTextColor for color, columnPaddingMedium for padding-top, columnPaddingMedium for padding-right, hds-space-core-600 for padding-bottom, columnPaddingMedium for padding-left, type-bodyFontSize for font.
Default: background color-gray-50 · text tooltipItemTextColor · padding columnPaddingMedium columnPaddingMedium hds-space-core-600 columnPaddingMedium · font type-bodyFontSize
Motion: refreshed-nav-hover-arrow-out · 150 ms · ease-custom-1

### Card (dispute prevention)

Card. Variants: Default.
States: Default.
Tokens: tooltipItemTextColor for color, columnPaddingNormal for padding-top, hds-space-core-300 for padding-right, columnPaddingNormal for padding-bottom, hds-space-core-300 for padding-left, type-bodyFontSize for font.
Default: text tooltipItemTextColor · padding columnPaddingNormal hds-space-core-300 columnPaddingNormal hds-space-core-300 · font type-bodyFontSize
Motion: none

### List row (embed payments)

List row. Variants: Outlined, Outlined bold.
States: Default.
Tokens: hds-color-core-neutral-990 for color, color-gray-50 for border-color, hds-space-core-100 for padding-top, hds-space-core-100 for padding-bottom.
Default: text hds-color-core-neutral-990 · border 1px color-gray-50 · padding hds-space-core-100 0px hds-space-core-100 0px · font 11px 300
Motion: none

### Card (header, pricing)

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, tooltipItemTextColor for color, columnPaddingMedium for padding-top, columnPaddingMedium for padding-right, hds-space-core-600 for padding-bottom, columnPaddingMedium for padding-left, type-bodyFontSize for font.
Default: background color-gray-50 · text tooltipItemTextColor · padding columnPaddingMedium columnPaddingMedium hds-space-core-600 columnPaddingMedium · font type-bodyFontSize
Motion: refreshed-nav-hover-arrow-out · 150 ms · ease-custom-1

### List row

List row. Variants: Default.
States: Default.
Tokens: color-gray-950 for color, listSpacing for padding-top, listSpacing for padding-bottom, type-subheading-strong-sm for font.
Default: text color-gray-950 · padding listSpacing 0px listSpacing 0px · font type-subheading-strong-sm
Motion: none

### Card (cellular)

Card. Variants: Default.
States: Default.
Tokens: tooltipItemTextColor for color, color-gray-50 for border-color, columnPaddingNormal for padding-top, hds-space-core-300 for padding-right, columnPaddingNormal for padding-bottom, hds-space-core-300 for padding-left, type-bodyFontSize for font.
Default: text tooltipItemTextColor · border 1px color-gray-50 · padding columnPaddingNormal hds-space-core-300 columnPaddingNormal hds-space-core-300 · font type-bodyFontSize
Motion: none

### List row (embed payments, home)

List row. Variants: Default.
States: Default.
Tokens: hds-color-text-soft for color, color-gray-50 for border-color, listSpacing for padding-top, hds-space-core-300 for padding-right, hds-space-core-100 for padding-bottom, hds-space-core-300 for padding-left, type-caption for font.
Default: text hds-color-text-soft · border 1px color-gray-50 · padding listSpacing hds-space-core-300 hds-space-core-100 hds-space-core-300 · font type-caption
Motion: none

### List row (manage platform)

List row. Variants: Ghost, Ghost bold.
States: Default.
Tokens: hds-color-text-soft for color, hds-space-core-100 for padding-top, hds-space-core-100 for padding-bottom.
Default: text hds-color-text-soft · padding hds-space-core-100 0px hds-space-core-100 0px · font 8px 400
Motion: none

### List row (frequently asked)

List row. Variants: Ghost, Outlined.
States: Default.
Tokens: color-gray-950 for color, color-gray-50 for border-color, type-subheading-strong-sm for font, duration-375 for transition-duration, accordionCollapseAnimationEasing for transition-timing-function.
Default: text color-gray-950 · border 1px color-gray-50 · font type-subheading-strong-sm
Motion: none

### Card (more)

Card. Variants: Default.
States: Default.
Tokens: tooltipItemTextColor for color, color-gray-50 for border-color, hds-space-core-300 for padding-top, hds-space-core-500 for padding-right, hds-space-core-300 for padding-bottom, columnPaddingMedium for padding-left, type-bodyFontSize for font.
Default: text tooltipItemTextColor · border 1px color-gray-50 · padding hds-space-core-300 hds-space-core-500 hds-space-core-300 columnPaddingMedium · font type-bodyFontSize
Motion: refreshed-nav-hover-arrow-out · 150 ms · ease-custom-1

### Card (more, pricing)

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, tooltipItemTextColor for color, columnPaddingMedium for padding-top, columnPaddingMedium for padding-right, columnPaddingMedium for padding-bottom, columnPaddingMedium for padding-left, type-bodyFontSize for font.
Default: background color-gray-50 · text tooltipItemTextColor · padding columnPaddingMedium columnPaddingMedium columnPaddingMedium columnPaddingMedium · font type-bodyFontSize
Motion: refreshed-nav-hover-arrow-out · 150 ms · ease-custom-1

### Card (finance automation)

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, hds-color-core-brand-500 for color, color-gray-50 for border-color, hds-space-core-300 for padding-top, duration-850 for transition-duration, accordionCollapseAnimationEasing for transition-timing-function.
Default: background color-gray-50 · text hds-color-core-brand-500 · border 1px color-gray-50 · padding hds-space-core-300 0px 2px 0px · font 16px 425
Motion: 3 motion patterns in the Motion section

### List row (own the, second)

List row. Variants: Primary square, Primary rounded.
States: Default.
Tokens: color-gray-800 for background-color, color-gray-50 for color, refreshedNavBorderRadius for border-radius, hds-space-core-150 for padding-right, hds-space-core-150 for padding-left.
Default: background color-gray-800 · text color-gray-50 · radius refreshedNavBorderRadius · padding 14px hds-space-core-150 14px hds-space-core-150 · font 11px 500
Motion: none

### Card (merchant of)

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, tooltipItemTextColor for color, refreshedNavBorderRadius for border-radius, type-bodyFontSize for font, shadow-sm for box-shadow.
Default: background color-gray-50 · text tooltipItemTextColor · radius refreshedNavBorderRadius · font type-bodyFontSize · shadow shadow-sm
Motion: none

### List row (the onramp, crypto onramp)

List row. Variants: Ghost tight, Ghost wide.
States: Default.
Tokens: hds-color-core-neutralDark-400 for color, hds-space-core-100 for padding-top, hds-space-core-150 for padding-right, hds-space-core-100 for padding-bottom, hds-space-core-150 for padding-left.
Default: text hds-color-core-neutralDark-400 · padding hds-space-core-100 hds-space-core-150 hds-space-core-100 hds-space-core-150 · font 8px 300
Motion: none

### List row (do you)

List row. Variants: Default.
States: Default.
Tokens: tooltipItemTextColor for color, type-bodyFontSize for font.
Default: text tooltipItemTextColor · font type-bodyFontSize
Motion: none

### Card (do you, pricing)

Card. Variants: Default.
States: Default.
Tokens: tooltipItemTextColor for color.
Default: text tooltipItemTextColor · font 18.72px 700
Motion: none

### List row (chance that)

List row. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, tooltipItemTextColor for color, color-gray-200 for border-color, refreshedNavBorderRadius for border-radius, type-bodyFontSize for font.
Default: background color-gray-50 · text tooltipItemTextColor · border 1px color-gray-200 · radius refreshedNavBorderRadius · font type-bodyFontSize
Motion: 2 motion patterns in the Motion section

### Card (embed payments, fifth)

Card. Variants: Primary, Secondary, Tertiary.
States: Default.
Tokens: hds-color-core-neutral-990 for color, suite-color for border-color, hds-space-core-radius-md for border-radius, type-subheading-strong-sm for font.
Default: background rgba(255, 229, 218, 0.1) · text hds-color-core-neutral-990 · border 1px suite-color · radius hds-space-core-radius-md · padding 2px 15px 2px 15px · font type-subheading-strong-sm
Motion: none

### List row (the onramp)

List row. Variants: Default.
States: Default.
Tokens: hds-color-core-neutral-990 for background-color, color-gray-50 for color, tooltipItemTextColor for border-color, hds-space-core-radius-sm for border-radius, columnPaddingNormal for padding-top, hds-space-core-150 for padding-right, columnPaddingNormal for padding-bottom, hds-space-core-150 for padding-left, type-body-xs for font.
Default: background hds-color-core-neutral-990 · text color-gray-50 · border 1px tooltipItemTextColor · radius hds-space-core-radius-sm · padding columnPaddingNormal hds-space-core-150 columnPaddingNormal hds-space-core-150 · font type-body-xs
Motion: none

### Card (crypto onramp, second)

Card. Variants: Default.
States: Default.
Tokens: color-blue-700c for color, hds-space-core-radius-md for border-radius, type-subheading-strong-sm for font, duration-250 for transition-duration, ease-linear for transition-timing-function.
Default: text color-blue-700c · radius hds-space-core-radius-md · font type-subheading-strong-sm · shadow 0px 2px 10px 0px #0037700F, 0px 1px 4px 0px #003B890A
Motion: none

### Card (own the)

Card. Variants: Default.
States: Default.
Tokens: color-blue-500 for color, hds-color-core-brand-600 for border-color, hds-space-core-radius-sm for border-radius, hds-space-core-150 for padding-top, hds-space-core-150 for padding-right, hds-space-core-150 for padding-bottom, hds-space-core-150 for padding-left, type-caption for font.
Default: text color-blue-500 · border 1px hds-color-core-brand-600 · radius hds-space-core-radius-sm · padding hds-space-core-150 hds-space-core-150 hds-space-core-150 hds-space-core-150 · font type-caption
Motion: none

### List row (behind the)

List row. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, hds-color-core-neutral-990 for color, color-gray-50 for border-color, hds-space-core-radius-md for border-radius, columnPaddingNormal for padding-top, columnPaddingNormal for padding-right, columnPaddingNormal for padding-bottom, columnPaddingNormal for padding-left, type-body-xs for font.
Default: background color-gray-50 · text hds-color-core-neutral-990 · border 1px color-gray-50 · radius hds-space-core-radius-md · padding columnPaddingNormal columnPaddingNormal columnPaddingNormal columnPaddingNormal · font type-body-xs
Motion: none

### List row (payments)

List row. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, tooltipItemTextColor for color, type-bodyFontSize for font.
Default: background color-gray-50 · text tooltipItemTextColor · font type-bodyFontSize
Motion: none

### List row (support plans)

List row. Variants: Default.
States: Default.
Tokens: color-gray-950 for color, color-gray-50 for border-color, type-subheading-strong-sm for font.
Default: text color-gray-950 · border 1px color-gray-50 · font type-subheading-strong-sm
Motion: none

### Card (custom)

Card. Variants: Primary, Secondary.
States: Default.
Tokens: color-gray-50 for background-color, tooltipItemTextColor for color, refreshedNavBorderRadius for border-radius, type-bodyFontSize for font.
Default: background color-gray-50 · text tooltipItemTextColor · radius refreshedNavBorderRadius · font type-bodyFontSize · shadow 0px 13px 27px -5px #32325D40, 0px 8px 16px -8px #0000004D
Motion: none

### Card (build with)

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, tooltipItemTextColor for color, refreshedNavBorderRadius for border-radius, columnPaddingMedium for padding-top, hds-space-core-300 for padding-right, hds-space-core-300 for padding-bottom, hds-space-core-300 for padding-left.
Default: background color-gray-50 · text tooltipItemTextColor · radius refreshedNavBorderRadius · padding columnPaddingMedium hds-space-core-300 hds-space-core-300 hds-space-core-300 · font 16px 425 · shadow 0px 6px 12px -2px #32325D40, 0px 3px 7px -3px #0000004D
Motion: none

### Card (build on)

Card. Variants: Default.
States: Default.
Tokens: color-gray-950 for color, color-gray-50 for border-color, hds-space-core-radius-sm for border-radius, hds-space-core-150 for padding-top, hds-space-core-150 for padding-right, hds-space-core-150 for padding-bottom, hds-space-core-150 for padding-left, type-subheading-strong-sm for font.
Default: text color-gray-950 · border 1px color-gray-50 · radius hds-space-core-radius-sm · padding hds-space-core-150 hds-space-core-150 hds-space-core-150 hds-space-core-150 · font type-subheading-strong-sm
Motion: none

### Card (grow your)

Card. Variants: Primary wide, Primary tight.
States: Default.
Tokens: color-gray-50 for background-color, hds-color-core-neutral-990 for color, color-gray-50 for border-color, hds-space-core-radius-md for border-radius, hds-space-core-150 for padding-top, columnPaddingNormal for padding-right, columnPaddingNormal for padding-bottom, columnPaddingNormal for padding-left.
Default: background color-gray-50 · text hds-color-core-neutral-990 · border 1px color-gray-50 · radius hds-space-core-radius-md · padding hds-space-core-150 columnPaddingNormal columnPaddingNormal columnPaddingNormal · font 10px 400
Motion: none

### Card (embed payments)

Card. Variants: Primary tall, Primary short.
States: Default.
Tokens: overlay-white-38 for background-color, color-gray-950 for color, radius-pill for border-radius, hds-space-core-100 for padding-right, hds-space-core-100 for padding-left, type-subheading-strong-sm for font.
Default: background overlay-white-38 · text color-gray-950 · radius radius-pill · padding 2px hds-space-core-100 2px hds-space-core-100 · font type-subheading-strong-sm
Motion: none

### Card

Card. Variants: Default.
States: Default.
Tokens: overlay-white-46 for background-color, color-gray-950 for color, hds-space-core-radius-md for border-radius, type-subheading-strong-sm for font.
Default: background overlay-white-46 · text color-gray-950 · radius hds-space-core-radius-md · font type-subheading-strong-sm · shadow 0px 15px 35px 0px #17171714
Motion: none

### Card (pricing)

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, tooltipItemTextColor for color, refreshedNavBorderRadius for border-radius, type-bodyFontSize for font.
Default: background color-gray-50 · text tooltipItemTextColor · radius refreshedNavBorderRadius · font type-bodyFontSize · shadow 0px 13px 27px -5px #32325D40, 0px 8px 16px -8px #0000004D
Motion: none

### Card (payments)

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, tooltipItemTextColor for color, hds-space-core-300 for padding-top, hds-space-core-300 for padding-bottom, type-bodyFontSize for font.
Default: background color-gray-50 · text tooltipItemTextColor · padding hds-space-core-300 0px hds-space-core-300 0px · font type-bodyFontSize
Motion: none

### List row (the onramp, second)

List row. Variants: Default.
States: Default.
Tokens: hds-color-core-neutralDark-400 for color, hds-space-core-100 for padding-top, hds-space-core-150 for padding-right, hds-space-core-100 for padding-bottom, hds-space-core-150 for padding-left, type-caption for font.
Default: text hds-color-core-neutralDark-400 · padding hds-space-core-100 hds-space-core-150 hds-space-core-100 hds-space-core-150 · font type-caption
Motion: none

### List row (own the)

List row. Variants: Default.
States: Default.
Tokens: color-blue-500 for color, hds-color-core-brand-600 for border-color, hds-space-core-radius-sm for border-radius, hds-space-core-150 for padding-top, hds-space-core-150 for padding-right, hds-space-core-150 for padding-bottom, hds-space-core-150 for padding-left, type-caption for font.
Default: text color-blue-500 · border 1px hds-color-core-brand-600 · radius hds-space-core-radius-sm · padding hds-space-core-150 hds-space-core-150 hds-space-core-150 hds-space-core-150 · font type-caption
Motion: none

### Card (own the, eighth)

Card. Variants: Default.
States: Default.
Tokens: color-gray-800 for background-color, color-gray-50 for color.
Default: background color-gray-800 · text color-gray-50 · radius 37px · padding 7px 7px 7px 7px · font 13px 500 · shadow inset 0px -2px 5px 0px #0A254033
Motion: none

### Card (own the, ninth)

Card. Variants: Default.
States: Default.
Tokens: color-gray-800 for background-color, color-gray-50 for color.
Default: background color-gray-800 · text color-gray-50 · radius 32px · padding 17px 17px 17px 17px · font 13px 500 · shadow 0px 1px 2px 0px #00000003
Motion: none

### Card (manage platform, home)

Card. Variants: Default.
States: Default.
Tokens: overlay-hds-color-core-magenta-50-20 for background-color, color-gray-950 for color, hds-space-core-radius-md for border-radius, hds-space-core-150 for padding-top, hds-space-core-150 for padding-right, hds-space-core-150 for padding-bottom, hds-space-core-150 for padding-left, type-subheading-strong-sm for font.
Default: background overlay-hds-color-core-magenta-50-20 · text color-gray-950 · radius hds-space-core-radius-md · padding hds-space-core-150 hds-space-core-150 hds-space-core-150 hds-space-core-150 · font type-subheading-strong-sm
Motion: none

### List row (your company)

List row. Variants: Default.
States: Default.
Tokens: tooltipItemTextColor for color, color-gray-200 for border-color, refreshedNavBorderRadius for border-radius, hds-space-core-100 for padding-top, hds-space-core-150 for padding-right, hds-space-core-100 for padding-bottom, hds-space-core-150 for padding-left, type-bodyFontSize for font.
Default: text tooltipItemTextColor · border 1px color-gray-200 · radius refreshedNavBorderRadius · padding hds-space-core-100 hds-space-core-150 hds-space-core-100 hds-space-core-150 · font type-bodyFontSize
Motion: none

### List row (your company, atlas)

List row. Variants: Default.
States: Default.
Tokens: hds-color-core-neutral-975 for color, listSpacing for padding-bottom.
Default: text hds-color-core-neutral-975 · padding 0px 0px listSpacing 0px · font 12px 400
Motion: none

### List row (your company, second)

List row. Variants: Default.
States: Default.
Tokens: hds-color-core-neutral-975 for color, listSpacing for padding-bottom.
Default: text hds-color-core-neutral-975 · padding 0px 0px listSpacing 0px · font 12px 400
Motion: none

### Card (the onramp)

Card. Variants: Default.
States: Default.
Tokens: overlay-blue-900b-36 for background-color, hds-color-core-neutralDark-400 for color, overlay-blue-700f-50 for border-color, hds-space-core-radius-sm for border-radius, type-subheading-strong-sm for font.
Default: background overlay-blue-900b-36 · text hds-color-core-neutralDark-400 · border 1px overlay-blue-700f-50 · radius hds-space-core-radius-sm · font type-subheading-strong-sm
Motion: none

### List row (own the, crypto onramp)

List row. Variants: Default.
States: Default.
Tokens: color-gray-800 for background-color, color-gray-50 for color, hds-space-core-100 for padding-top, hds-space-core-100 for padding-right, hds-space-core-100 for padding-bottom, hds-space-core-100 for padding-left.
Default: background color-gray-800 · text color-gray-50 · radius 10px · padding hds-space-core-100 hds-space-core-100 hds-space-core-100 hds-space-core-100 · font 11px 500
Motion: none

### Tag (manage platform, home)

Tag. Variants: Primary, Secondary.
States: Default.
Tokens: overlay-green-400-20 for background-color, color-success-500 for color, overlay-green-400-40 for border-color, hds-space-core-radius-sm for border-radius, listSpacing for padding-right, listSpacing for padding-left, type-caption for font.
Default: background overlay-green-400-20 · text color-success-500 · border 1px overlay-green-400-40 · radius hds-space-core-radius-sm · padding 1px listSpacing 1px listSpacing · font type-caption
Motion: none

### Alert (aside)

Alert. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, tooltipItemTextColor for color, color-gray-50 for border-color, hds-space-core-radius-sm for border-radius, type-bodyFontSize for font.
Default: background color-gray-50 · text tooltipItemTextColor · border 1px color-gray-50 · radius hds-space-core-radius-sm · font type-bodyFontSize
Motion: refreshed-nav-hover-arrow-out · 150 ms · ease-custom-1

### Empty state

Empty state. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, tooltipItemTextColor for color, color-gray-50 for border-color, refreshedNavBorderRadius for border-radius, hds-space-core-250 for padding-top, hds-space-core-250 for padding-right, columnPaddingMedium for padding-bottom, hds-space-core-250 for padding-left, type-bodyFontSize for font.
Default: background color-gray-50 · text tooltipItemTextColor · border 1px color-gray-50 · radius refreshedNavBorderRadius · padding hds-space-core-250 hds-space-core-250 columnPaddingMedium hds-space-core-250 · font type-bodyFontSize
Motion: none

### Tag (build your)

Tag. Variants: Default.
States: Default.
Tokens: color-gray-950 for color, hds-color-core-brandDark-700 for border-color, hds-space-core-radius-sm for border-radius, type-subheading-strong-sm for font, duration-500 for transition-duration, ease-custom-2 for transition-timing-function.
Default: text color-gray-950 · border 1px hds-color-core-brandDark-700 · radius hds-space-core-radius-sm · font type-subheading-strong-sm
Motion: none

### Alert

Alert. Variants: Default.
States: Default.
Tokens: none.
Default: background none
Motion: none

### Tag (behind the, crypto onramp)

Tag. Variants: Default.
States: Default.
Tokens: hds-color-text-soft for color, columnPaddingNormal for padding-left, type-body-xs for font.
Default: text hds-color-text-soft · padding 0px 0px 0px columnPaddingNormal · font type-body-xs
Motion: none

### Tag (build your, home)

Tag. Variants: Default.
States: Default.
Tokens: hds-color-core-brand-600 for background-color, color-gray-50 for color, hds-space-core-radius-sm for border-radius, listSpacing for padding-top, columnPaddingNormal for padding-right, listSpacing for padding-bottom, columnPaddingNormal for padding-left, type-body for font.
Default: background hds-color-core-brand-600 · text color-gray-50 · radius hds-space-core-radius-sm · padding listSpacing columnPaddingNormal listSpacing columnPaddingNormal · font type-body
Motion: none

### Tag (behind the)

Tag. Variants: Default.
States: Default.
Tokens: overlay-hds-color-core-success-400-16 for background-color, hds-color-core-success-400 for color, radius-pill for border-radius.
Default: background overlay-hds-color-core-success-400-16 · text hds-color-core-success-400 · radius radius-pill · padding 3px 7px 3px 7px · font 10px 400
Motion: none

### Tag (how stablecoins)

Tag. Variants: Default.
States: Default.
Tokens: hds-color-text-soft for color, color-gray-50 for border-color, hds-space-core-radius-sm for border-radius, listSpacing for padding-top, hds-space-core-100 for padding-right, listSpacing for padding-bottom, hds-space-core-100 for padding-left, type-bodyFontSize for font, accordionCollapseAnimationDuration for transition-duration, navigation-easing for transition-timing-function.
Default: text hds-color-text-soft · border 1px color-gray-50 · radius hds-space-core-radius-sm · padding listSpacing hds-space-core-100 listSpacing hds-space-core-100 · font type-bodyFontSize
Motion: none

### Tag (the onramp, fourth)

Tag. Variants: Primary, Secondary.
States: Default.
Tokens: overlay-blue-900b-36 for background-color, hds-color-core-neutralDark-300 for color, overlay-blue-700f-50 for border-color, hds-space-core-radius-sm for border-radius, hds-space-core-100 for padding-right, hds-space-core-100 for padding-left.
Default: background overlay-blue-900b-36 · text hds-color-core-neutralDark-300 · border 1px overlay-blue-700f-50 · radius hds-space-core-radius-sm · padding 3px hds-space-core-100 3px hds-space-core-100 · font 9px 300
Motion: none

### Tag (build your, third)

Tag. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, color-gray-50 for color.
Default: background color-gray-50 · text color-gray-50 · font 28px 300
Motion: none

### Tag (own the, crypto onramp)

Tag. Variants: Default.
States: Default.
Tokens: color-gray-800 for background-color, color-gray-50 for color, refreshedNavBorderRadius for border-radius, hds-space-core-100 for padding-top, hds-space-core-100 for padding-bottom.
Default: background color-gray-800 · text color-gray-50 · radius refreshedNavBorderRadius · padding hds-space-core-100 0px hds-space-core-100 0px · font 10px 500
Motion: none

### Dropdown

Dropdown. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, hds-color-core-neutral-990 for color, color-gray-50 for border-color, hds-space-core-radius-md for border-radius, type-subheading-strong-sm for font, shadow-lg for box-shadow.
Default: background color-gray-50 · text hds-color-core-neutral-990 · border 1px color-gray-50 · radius hds-space-core-radius-md · font type-subheading-strong-sm · shadow shadow-lg
Motion: none

### Dropdown (pricing)

Dropdown. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, tooltipItemTextColor for color, color-gray-50 for border-color, refreshedNavBorderRadius for border-radius, hds-space-core-150 for padding-top, columnPaddingNormal for padding-right, hds-space-core-150 for padding-bottom, columnPaddingNormal for padding-left, type-bodyFontSize for font.
Default: background color-gray-50 · text tooltipItemTextColor · border 1px color-gray-50 · radius refreshedNavBorderRadius · padding hds-space-core-150 columnPaddingNormal hds-space-core-150 columnPaddingNormal · font type-bodyFontSize · shadow 0px 30px 60px -12px #32325D40, 0px 18px 36px -18px #0000004D
Motion: open · opacity · 250 ms · ease

### Avatar (how the)

Avatar. Variants: Default.
States: Default.
Tokens: color-gray-50 for border-color, radius-pill for border-radius.
Default: border 1px color-gray-50 · radius radius-pill
Motion: none

### Avatar

Avatar. Variants: Ghost small, Outlined, Ghost small muted, Outlined muted.
States: Default.
Tokens: radius-pill for border-radius.
Default: radius radius-pill
Motion: none

## Page-specific components

### Button (dispute prevention)

Button. Variants: Default.
States: Default, Hover, Focus, Active, Open.
Tokens: hds-color-core-neutral-975 for color, type-text-15 for font, duration-150 for transition-duration, ease-out-cubic for transition-timing-function.
Default: text hds-color-core-neutral-975 · font type-text-15
Motion: none

### Button (nav, enterprise)

Button. Variants: Default.
States: Default.
Tokens: overlay-white-20 for background-color, radius-pill for border-radius, duration-150 for transition-duration, ease-out-cubic for transition-timing-function.
Default: background overlay-white-20 · radius radius-pill
Motion: none

### Card (embed payments, home)

Card. Variants: Default.
States: Default.
Tokens: color-gray-950 for color, color-gray-50 for border-color, hds-space-core-100 for padding-right, hds-space-core-100 for padding-left, type-subheading-strong-sm for font.
Default: text color-gray-950 · border 1px color-gray-50 · padding 11px hds-space-core-100 11px hds-space-core-100 · font type-subheading-strong-sm
Motion: none

### Card (embed payments, third)

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, color-gray-950 for color, hds-space-core-radius-md for border-radius, type-subheading-strong-sm for font.
Default: background color-gray-50 · text color-gray-950 · radius hds-space-core-radius-md · font type-subheading-strong-sm · shadow 0px 16px 32px 0px #32325D1F
Motion: none

### Card (stripe atlas)

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, color-blue-700c for color, hds-space-core-radius-md for border-radius, type-subheading-strong-sm for font.
Default: background color-gray-50 · text color-blue-700c · radius hds-space-core-radius-md · font type-subheading-strong-sm
Motion: none

### Card (the land, home)

Card. Variants: Default.
States: Default, Hover, Focus, Active.
- Hover: border-color #BAC8DA (200 ms)
- Focus: outline-style solid; outline-color rgb(84 82 251 / 75%); outline-offset 1px
- Active: color #FF0000; border-color #BAC8DA (200 ms); text-decoration-color #FF0000
Tokens: color-blue-700c for color, color-gray-50 for border-color, hds-space-core-radius-sm for border-radius, type-subheading-strong-sm for font, ease for transition-timing-function.
Default: text color-blue-700c · border 1px color-gray-50 · radius hds-space-core-radius-sm · padding 2px 2px 2px 2px · font type-subheading-strong-sm
Motion: hover · border-color · 200 ms · ease; active · border-color · 200 ms · ease

### Card (dispute prevention, pricing)

Card. Variants: Outlined square, Outlined rounded.
States: Default.
Tokens: tooltipItemTextColor for color, color-gray-50 for border-color, columnPaddingNormal for padding-top, hds-space-core-300 for padding-right, columnPaddingNormal for padding-bottom, hds-space-core-300 for padding-left, type-bodyFontSize for font, accordionCollapseAnimationDuration for transition-duration, accordionCollapseAnimationEasing for transition-timing-function.
Default: text tooltipItemTextColor · border 1px color-gray-50 · padding columnPaddingNormal hds-space-core-300 columnPaddingNormal hds-space-core-300 · font type-bodyFontSize
Motion: PortalTooltipItemFadeIn · 250 ms · ease

### Card (about, second)

Card. Variants: Default.
States: Default.
Tokens: color-gray-950 for color, color-gray-50 for border-color, type-subheading-strong-sm for font.
Default: text color-gray-950 · border 1px color-gray-50 · font type-subheading-strong-sm
Motion: none

### Card (own the, fourth)

Card. Variants: Default.
States: Default.
Tokens: hds-color-core-neutral-990 for background-color, color-gray-50 for color, hds-color-core-neutral-975 for border-color, hds-space-core-radius-sm for border-radius, hds-space-core-100 for padding-top, hds-space-core-100 for padding-right, hds-space-core-100 for padding-bottom, hds-space-core-100 for padding-left.
Default: background hds-color-core-neutral-990 · text color-gray-50 · border 1px hds-color-core-neutral-975 · radius hds-space-core-radius-sm · padding hds-space-core-100 hds-space-core-100 hds-space-core-100 hds-space-core-100 · font 13px 400
Motion: none

### Card (own the, fifth)

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, hds-color-core-neutral-990 for color, color-gray-50 for border-color, hds-space-core-radius-sm for border-radius, hds-space-core-100 for padding-top, hds-space-core-100 for padding-right, hds-space-core-100 for padding-bottom, hds-space-core-100 for padding-left.
Default: background color-gray-50 · text hds-color-core-neutral-990 · border 1px color-gray-50 · radius hds-space-core-radius-sm · padding hds-space-core-100 hds-space-core-100 hds-space-core-100 hds-space-core-100 · font 11px 400
Motion: none

### Card (own the, fourteenth)

Card. Variants: Default.
States: Default.
Tokens: color-gray-900 for color, columnPaddingNormal for padding-top, columnPaddingNormal for padding-bottom, type-body-sm-strong for font.
Default: text color-gray-900 · padding columnPaddingNormal 0px columnPaddingNormal 0px · font type-body-sm-strong
Motion: none

### Card (behind the, crypto onramp)

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, color-gray-950 for color, color-gray-50 for border-color, hds-space-core-radius-md for border-radius, type-subheading-strong-sm for font.
Default: background color-gray-50 · text color-gray-950 · border 1px color-gray-50 · radius hds-space-core-radius-md · font type-subheading-strong-sm
Motion: none

### Card (grow your, crypto onramp)

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, hds-color-core-neutral-990 for color, color-gray-50 for border-color, hds-space-core-radius-md for border-radius, hds-space-core-150 for padding-right, hds-space-core-100 for padding-bottom, hds-space-core-100 for padding-left.
Default: background color-gray-50 · text hds-color-core-neutral-990 · border 1px color-gray-50 · radius hds-space-core-radius-md · padding 9px hds-space-core-150 hds-space-core-100 hds-space-core-100 · font 10px 400
Motion: none

### Card (crypto onramp, third)

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, color-gray-950 for color, columnPaddingNormal for padding-right, columnPaddingNormal for padding-left, type-subheading-strong-sm for font.
Default: background color-gray-50 · text color-gray-950 · padding 0px columnPaddingNormal 0px columnPaddingNormal · font type-subheading-strong-sm
Motion: none

### Card (behind the, third)

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, color-gray-950 for color, color-gray-50 for border-color, hds-space-core-radius-md for border-radius, hds-space-core-300 for padding-top, hds-space-core-250 for padding-right, hds-space-core-300 for padding-bottom, hds-space-core-250 for padding-left, type-subheading-strong-sm for font.
Default: background color-gray-50 · text color-gray-950 · border 1px color-gray-50 · radius hds-space-core-radius-md · padding hds-space-core-300 hds-space-core-250 hds-space-core-300 hds-space-core-250 · font type-subheading-strong-sm
Motion: none

### Card (behind the, fourth)

Card. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, color-gray-950 for color, color-gray-50 for border-color, hds-space-core-radius-md for border-radius, columnPaddingMedium for padding-left, type-subheading-strong-sm for font.
Default: background color-gray-50 · text color-gray-950 · border 1px color-gray-50 · radius hds-space-core-radius-md · padding 0px 0px 0px columnPaddingMedium · font type-subheading-strong-sm
Motion: none

### Card (build on, crypto onramp)

Card. Variants: Default.
States: Default.
Tokens: color-gray-950 for color, color-gray-50 for border-color, hds-space-core-radius-sm for border-radius, hds-space-core-150 for padding-top, hds-space-core-150 for padding-right, hds-space-core-150 for padding-bottom, hds-space-core-150 for padding-left, type-subheading-strong-sm for font.
Default: text color-gray-950 · border 1px color-gray-50 · radius hds-space-core-radius-sm · padding hds-space-core-150 hds-space-core-150 hds-space-core-150 hds-space-core-150 · font type-subheading-strong-sm
Motion: none

### Tag

Tag. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, color-blue-500 for color, hds-space-core-radius-md for border-radius.
Default: background color-gray-50 · text color-blue-500 · radius hds-space-core-radius-md · padding 9px 7px 9px 7px · font 9px 300
Motion: none

### Tag (build on)

Tag. Variants: Default.
States: Default.
Tokens: hds-color-core-success-600 for color, hds-space-core-radius-xs for border-radius, listSpacing for padding-right, listSpacing for padding-left.
Default: background rgb(220, 252, 231) · text hds-color-core-success-600 · radius hds-space-core-radius-xs · padding 2px listSpacing 2px listSpacing · font 8px 400
Motion: none

### Tag (embed payments)

Tag. Variants: Default.
States: Default.
Tokens: suite-color for color, listSpacing for padding-top, listSpacing for padding-right, listSpacing for padding-bottom, listSpacing for padding-left.
Default: background rgb(255, 229, 218) · text suite-color · radius 4.51px · padding listSpacing listSpacing listSpacing listSpacing · font 11px 400
Motion: none

### Tag (build your, second)

Tag. Variants: Default.
States: Default.
Tokens: color-blue-400d for background-color, hds-color-core-neutral-975 for color, listSpacing for padding-right.
Default: background color-blue-400d · text hds-color-core-neutral-975 · padding 0px listSpacing 0px 9px · font 12px 500
Motion: none

### Tag (the onramp, third)

Tag. Variants: Default.
States: Default.
Tokens: color-indigo-400 for color, overlay-indigo-400-40 for border-color, hds-space-core-radius-xs for border-radius, hds-space-core-150 for padding-right, hds-space-core-150 for padding-left.
Default: text color-indigo-400 · border 1px overlay-indigo-400-40 · radius hds-space-core-radius-xs · padding 1px hds-space-core-150 2px hds-space-core-150 · font 9px 400 · shadow 0px 1.568px 3.136px 0px #0000000D, 0px 0.784px 1.176px 0px #00000008
Motion: none

### Tag (own the)

Tag. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, color-blue-500 for color, type-caption for font.
Default: background color-gray-50 · text color-blue-500 · radius 3px · padding 1.5px 3px 1.5px 3px · font type-caption
Motion: none

### Code block

Code block. Variants: Default.
States: Default.
Tokens: color-gray-50 for color, columnPaddingNormal for padding-top, columnPaddingNormal for padding-right, columnPaddingNormal for padding-bottom, columnPaddingNormal for padding-left.
Default: text color-gray-50 · padding columnPaddingNormal columnPaddingNormal columnPaddingNormal columnPaddingNormal · font 12px 500
Motion: none

### Dropdown (home)

Dropdown. Variants: Default.
States: Default.
Tokens: color-gray-50 for background-color, color-gray-950 for color, type-subheading-strong-sm for font.
Default: background color-gray-50 · text color-gray-950 · radius 16px · font type-subheading-strong-sm
Motion: none

## Rules

- Use only these tokens. Do not invent colors, sizes, spacing, radii or shadows.
- Keep every text and background pair at the contrast ratio it has here.
- Match each component contract, including its states.
- Use only these durations and easings. Apply the entrance and scroll patterns to the equivalent elements of what you build; patterns marked observed were measured at runtime and their easing is the nearest token when none was recorded.
- No em dashes in any copy you write.

Source: http://localhost:3000/r/uno14531eh
