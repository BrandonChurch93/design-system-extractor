// A small robots.txt parser: User-agent, Allow, Disallow, Crawl-delay, Sitemap (docs/specs/crawler.md).

type Rule = { allow: boolean; path: string };
type Group = { agents: string[]; rules: Rule[]; crawlDelay?: number };
export type Robots = { groups: Group[]; sitemaps: string[]; raw: string };

export function parseRobots(text: string): Robots {
  const groups: Group[] = [];
  const sitemaps: string[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (key === 'sitemap') {
      if (value) sitemaps.push(value);
      continue;
    }
    if (!current) continue;
    if (key === 'allow' || key === 'disallow') {
      if (key === 'disallow' && value === '') continue;
      current.rules.push({ allow: key === 'allow', path: value });
    } else if (key === 'crawl-delay') {
      const n = Number(value);
      if (Number.isFinite(n) && n >= 0) current.crawlDelay = n;
    }
  }
  return { groups, sitemaps, raw: text };
}

function groupFor(robots: Robots, agent: string): Group | null {
  const name = agent.toLowerCase().split('/')[0]!;
  return robots.groups.find((g) => g.agents.some((a) => a !== '*' && name.includes(a))) ?? robots.groups.find((g) => g.agents.includes('*')) ?? null;
}

function patternMatches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const re = new RegExp(`^${body.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}${anchored ? '$' : ''}`);
  return re.test(path);
}

/** Longest matching rule wins; Allow wins a tie. No matching rule means allowed. */
export function isAllowed(robots: Robots, agent: string, pathWithQuery: string): boolean {
  const g = groupFor(robots, agent);
  if (!g) return true;
  let best: Rule | null = null;
  for (const r of g.rules) {
    if (!patternMatches(r.path, pathWithQuery)) continue;
    if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow)) best = r;
  }
  return best ? best.allow : true;
}

/** Crawl-delay in ms for our agent, honored above 800 ms and up to 5 s. */
export function crawlDelayMs(robots: Robots, agent: string): number {
  const d = groupFor(robots, agent)?.crawlDelay;
  if (d === undefined) return 800;
  return Math.min(5000, Math.max(800, Math.round(d * 1000)));
}
