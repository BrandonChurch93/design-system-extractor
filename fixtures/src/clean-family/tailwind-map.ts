// The clean design as Tailwind utilities, class by class. Computed styles must equal clean.css.

const focusRing = 'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-blue-600 focus-visible:outline-offset-2';
const motion = 'motion-reduce:transition-none';

export const twMap: Record<string, string> = {
  container: 'mx-auto max-w-[1120px] px-6',
  section: 'py-16',
  stack: 'flex flex-col gap-4',
  'page-head': 'flex flex-col gap-3 pt-12 pb-8',
  display: 'text-[48px] leading-[56px] font-bold max-[640px]:text-[36px] max-[640px]:leading-[44px]',
  'text-sm': 'text-[14px] leading-[22px]',
  caption: 'text-[12px] leading-[16px]',
  'site-header': `sticky top-0 z-10 bg-white border-b border-solid border-slate-200 transition-shadow duration-160 ${motion} dark:bg-navy-900`,
  'is-scrolled': 'shadow-raised',
  'header-inner': 'flex items-center justify-between gap-8 h-[72px]',
  logo: 'text-[20px] leading-[28px] font-semibold text-navy-900 dark:text-white',
  'nav-links': 'flex items-center gap-6 max-[640px]:hidden',
  'nav-link': `text-[14px] leading-[20px] font-semibold text-navy-900 hover:text-blue-600 ${focusRing}`,
  'header-actions': 'flex items-center gap-3 max-[640px]:hidden',
  dropdown: 'relative',
  'dropdown-trigger': `inline-flex items-center gap-1 h-11 px-3 border-0 rounded-lg bg-transparent text-[14px] leading-[20px] font-semibold text-navy-900 cursor-pointer hover:bg-slate-200 aria-expanded:bg-slate-200 ${focusRing}`,
  'dropdown-menu': 'absolute top-12 left-0 z-20 min-w-56 p-2 bg-white border border-solid border-slate-200 rounded-xl shadow-raised',
  'menu-item': `flex items-center h-11 px-3 rounded-lg text-[14px] leading-[22px] text-navy-900 hover:bg-slate-200 ${focusRing}`,
  'menu-button': `hidden max-[640px]:inline-flex items-center justify-center w-11 h-11 border-0 rounded-lg bg-transparent text-navy-900 cursor-pointer ${focusRing}`,
  'mobile-menu': 'border-t border-solid border-slate-200 pt-2 pb-4',
  'mobile-link': 'flex items-center h-12 text-[16px] leading-[26px] text-navy-900',
  btn: `inline-flex items-center justify-center gap-2 h-11 px-5 border border-solid border-transparent rounded-lg text-[14px] leading-[20px] font-semibold cursor-pointer transition-colors duration-160 ${motion} disabled:opacity-50 disabled:cursor-not-allowed aria-disabled:opacity-50 ${focusRing}`,
  'btn-sm': 'h-9 px-4 max-[640px]:h-11',
  'btn-primary': 'bg-blue-600 text-white hover:bg-navy-900 active:bg-navy-900',
  'btn-secondary': 'bg-white text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white active:bg-blue-600 active:text-white',
  'btn-ghost': 'bg-transparent text-navy-900 hover:bg-slate-200 active:bg-slate-200',
  'btn-on-dark': 'focus-visible:outline-white',
  'icon-button': `inline-flex items-center justify-center w-11 h-11 border border-solid border-slate-200 rounded-lg bg-white text-navy-900 cursor-pointer hover:bg-slate-200 ${focusRing}`,
  hero: 'flex flex-col items-start gap-6 pt-24 pb-16 max-w-[720px] max-[640px]:pt-16 max-[640px]:pb-12',
  'hero-actions': 'flex gap-3 flex-wrap',
  grid: 'grid grid-cols-1 gap-6 lg:grid-cols-3',
  'grid-2': 'lg:grid-cols-2',
  card: 'flex flex-col gap-3 p-6 bg-white border border-solid border-slate-200 rounded-xl shadow-card dark:bg-navy-900',
  'feature-icon': 'w-6 h-6 text-teal-600',
  'tag-new': 'inline-flex items-center self-start h-6 px-2 rounded-full bg-teal-600 text-white text-[12px] leading-[16px]',
  'pricing-card': 'p-8 gap-4',
  'pricing-card--featured': 'bg-navy-900 border-navy-900 text-white shadow-raised',
  price: 'text-[48px] leading-[56px] font-bold',
  'plan-features': 'flex flex-col gap-2',
  testimonial: 'flex items-center gap-4',
  avatar: 'w-10 h-10 rounded-[50%] bg-slate-200',
  badge: 'inline-flex items-center h-6 px-2 rounded-full text-white text-[12px] leading-[16px]',
  'badge-success': 'bg-success-700',
  'badge-warning': 'bg-warning-700',
  'badge-danger': 'bg-danger-600',
  'status-list': 'flex gap-2 flex-wrap',
  form: 'flex flex-col gap-6 max-w-[480px]',
  'auth-card': 'max-w-[480px]',
  field: 'flex flex-col gap-2',
  label: 'text-[14px] leading-[20px] font-semibold text-navy-900',
  input: 'w-full h-11 py-2 px-3 border border-solid border-slate-200 rounded-lg bg-white text-navy-900 text-[16px] leading-[26px] focus:border-blue-600 focus:outline-2 focus:outline-solid focus:outline-blue-600 focus:outline-offset-2 aria-invalid:border-danger-600',
  select: 'w-full h-11 py-2 pl-3 pr-10 border border-solid border-slate-200 rounded-lg bg-white text-navy-900 text-[16px] leading-[26px] appearance-none select-chevron focus:border-blue-600 focus:outline-2 focus:outline-solid focus:outline-blue-600 focus:outline-offset-2',
  textarea: 'w-full h-32 py-2 px-3 border border-solid border-slate-200 rounded-lg bg-white text-navy-900 text-[16px] leading-[26px] resize-y focus:border-blue-600 focus:outline-2 focus:outline-solid focus:outline-blue-600 focus:outline-offset-2',
  'field-error': 'text-[14px] leading-[22px] text-danger-600',
  'check-row': 'flex items-center gap-2 text-[14px] leading-[22px]',
  checkbox: `appearance-none flex-none w-11 h-11 -mx-3 border-0 rounded-lg checkbox-box checked:checkbox-checked cursor-pointer ${focusRing}`,
  'toggle-row': 'flex items-center gap-3 text-[14px] leading-[22px]',
  toggle: `relative flex-none w-[52px] h-11 border-0 bg-transparent cursor-pointer ${focusRing} before:content-[''] before:absolute before:left-1 before:top-2.5 before:w-11 before:h-6 before:rounded-full before:bg-slate-200 aria-checked:before:bg-blue-600 after:content-[''] after:absolute after:left-2 after:top-3.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform after:duration-160 motion-reduce:after:transition-none aria-checked:after:translate-x-5`,
  table: 'w-full border-collapse text-[14px] leading-[22px]',
  th: 'py-3 px-4 border-b border-solid border-slate-200 text-left text-[14px] leading-[20px] font-semibold',
  td: 'py-3 px-4 border-b border-solid border-slate-200',
  'table-wrap': 'overflow-x-auto',
  'code-block': 'py-4 px-6 rounded-lg bg-navy-900 text-white font-mono text-[14px] leading-[22px] overflow-x-auto',
  breadcrumb: 'flex items-center gap-2 text-[14px] leading-[22px]',
  crumb: `text-blue-600 ${focusRing}`,
  'crumb-current': 'text-navy-900',
  tabs: 'flex gap-1 border-b border-solid border-slate-200',
  tab: `h-11 px-4 border-0 border-b-2 border-solid border-transparent bg-transparent text-[14px] leading-[20px] font-semibold text-navy-900 cursor-pointer aria-selected:text-blue-600 aria-selected:border-b-blue-600 ${focusRing}`,
  'tab-panel': 'py-6',
  'doc-list': 'flex flex-col gap-3',
  alert: 'flex items-start gap-3 p-4 border border-solid border-success-700 rounded-lg bg-white text-navy-900',
  'alert-warning': 'border-warning-700',
  'alert-icon': 'flex-none w-6 h-6',
  'alert-icon-success': 'text-success-700',
  'alert-icon-warning': 'text-warning-700',
  'alert-success': '',
  'empty-state': 'flex flex-col items-center gap-4 py-24 px-6 border border-solid border-slate-200 rounded-xl text-center',
  'empty-icon': 'w-12 h-12 text-teal-600',
  'site-footer': 'border-t border-solid border-slate-200 py-12',
  'footer-inner': 'flex justify-between gap-8 flex-wrap',
  'footer-links': 'flex gap-6 flex-wrap',
  'footer-link': 'text-[14px] leading-[22px] text-navy-900',
};

export const twInput = `@import "tailwindcss" source(none);
@source "../../sites/tailwind";

@theme {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: ui-monospace, 'SFMono-Regular', Menlo, monospace;
  --color-navy-900: #0B1F3A;
  --color-blue-600: #2458E6;
  --color-teal-600: #0F8A8A;
  --color-success-700: #15803D;
  --color-warning-700: #B45309;
  --color-danger-600: #DC2626;
  --color-white: #FFFFFF;
  --color-slate-200: #E2E8F0;
  --shadow-card: 0 1px 2px rgba(11, 31, 58, 0.12);
  --shadow-raised: 0 12px 32px rgba(11, 31, 58, 0.12);
}

@utility select-chevron {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230B1F3A' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}
@utility checkbox-box {
  background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect x='0.5' y='0.5' width='19' height='19' rx='3.5' fill='%23FFFFFF' stroke='%230B1F3A'/%3E%3C/svg%3E") center no-repeat;
}
@utility checkbox-checked {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='20' height='20' rx='4' fill='%232458E6'/%3E%3Cpath d='m5 10 3.5 3.5L15 7' fill='none' stroke='%23FFFFFF' stroke-width='2'/%3E%3C/svg%3E");
}

@layer base {
  body { font-family: var(--font-sans); font-size: 16px; line-height: 26px; color: #0B1F3A; background: #FFFFFF; }
  a { color: #2458E6; }
  h1 { font-size: 36px; line-height: 44px; font-weight: 700; }
  h2 { font-size: 28px; line-height: 36px; font-weight: 700; }
  h3 { font-size: 20px; line-height: 28px; font-weight: 600; }
  p { font-size: 16px; line-height: 26px; }
  img, svg { display: block; }
  pre code { font: inherit; }
}

@media (prefers-color-scheme: dark) {
  body { background: #0B1F3A; color: #FFFFFF; }
}
`;
