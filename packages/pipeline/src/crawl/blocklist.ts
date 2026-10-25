// Third-party scripts from known tracker, ad and chat domains are blocked (docs/specs/crawler.md).
export const trackerDomains = [
  'google-analytics.com',
  'googletagmanager.com',
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'facebook.net',
  'connect.facebook.net',
  'hotjar.com',
  'segment.com',
  'segment.io',
  'mixpanel.com',
  'amplitude.com',
  'heap.io',
  'heapanalytics.com',
  'fullstory.com',
  'clarity.ms',
  'intercom.io',
  'intercomcdn.com',
  'drift.com',
  'crisp.chat',
  'zdassets.com',
  'tawk.to',
  'hs-scripts.com',
  'hs-analytics.net',
  'hubspot.com',
  'linkedin.com/px',
  'snap.licdn.com',
  'ads-twitter.com',
  'static.ads-twitter.com',
  'tiktok.com/i18n/pixel',
  'analytics.tiktok.com',
  'bat.bing.com',
  'quantserve.com',
  'scorecardresearch.com',
  'adroll.com',
  'taboola.com',
  'outbrain.com',
  'cookielaw.org',
  'onetrust.com',
  'cookiebot.com',
  'usercentrics.eu',
  'optimizely.com',
  'newrelic.com',
  'nr-data.net',
  'sentry-cdn.com',
  'datadoghq-browser-agent.com',
  'plausible.io',
];

export function isTracker(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  const host = u.hostname.toLowerCase();
  const hostPath = `${host}${u.pathname}`;
  return trackerDomains.some((d) => (d.includes('/') ? hostPath.includes(d) : host === d || host.endsWith(`.${d}`)));
}
