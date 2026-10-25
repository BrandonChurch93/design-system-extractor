# Caps, budget, BYO key, and abuse guards

Anyone can run the tool. These rules are what keep that safe (D-005). All values are env-configured with the defaults below; nothing is hardcoded elsewhere.

## Defaults

| Setting | Env | Default |
| --- | --- | --- |
| Global daily budget | `DSE_GLOBAL_DAILY_BUDGET_USD` | 2.00 |
| Runs per visitor per day | `DSE_VISITOR_RUNS_PER_DAY` | 2 |
| Page cap | `DSE_PAGE_CAP` | 12 |
| Page cap with BYO key | `DSE_BYO_PAGE_CAP` | 40 |
| Worst-case run cost (pre-check) | `DSE_WORST_CASE_RUN_USD` | 0.60 |
| Run timeout | `DSE_RUN_TIMEOUT_MS` | 360000 |
| Budget day boundary | `DSE_BUDGET_TIMEZONE` | America/Boise |
| Dev spend cap (build only) | `DSE_DEV_SPEND_CAP_USD` | 20 |

## Entitlements (the one module)

`packages/schema/src/entitlements.ts` exports `plans` (a map of plan id to limits) and `apps/web/lib/entitlements.ts` exports `resolveViewer(request)` → `{ visitorId, userId: null, plan: 'free', byoKey: boolean }` and `check(viewer, action)` → `{ ok } | { blocked: reason, detail }`. Every limit decision in the app and worker calls `check`. v1 has one plan:

```
free: { runsPerDay: 2, pageCap: 12, includeCap: 5, viewports: ['desktop','mobile'], retentionDays: 90, privateRuns: false, scheduledRuns: false, priority: 0, teamSeats: 1 }
byo:  { ...free, runsPerDay: Infinity, pageCap: 40 }
```

`byo` is not a plan a viewer has and is not in `plans`; `entitlements.ts` exports it separately as `byoLimits`, the set `check` applies when a valid-looking key is present. The include cap is 5 for everyone. See `docs/specs/v2-seams.md` for how plans grow.

## Visitor identity

A `dse_v` cookie: 16-char nanoid, `httpOnly`, `secure` in production, `sameSite=lax`, one year. Set on the first `POST /api/runs` (not on page view, to keep the home page cookie-free until a run). Fallback for cookie-less requests: a hash of the client IP (from the platform's forwarded header) plus the user agent. Both keys are counted, and the stricter count applies.

## Counting

Redis keys, all with a TTL of 48 hours:

- `cap:visitor:{visitorId}:{YYYY-MM-DD}` · integer, incremented when a run is created, decremented when the run ends `blocked`, `failed` or `cancelled` (so those do not count).
- `cap:ip:{ipHash}:{YYYY-MM-DD}` · same, limit 6 (an IP shared by several people gets room; one person cannot exceed 2 per cookie).
- `budget:{YYYY-MM-DD}` · integer cents of actual model spend, incremented after every model call with the computed cost of that call (token counts × the price table in `model-calls.md`).
- `budget:reserved:{YYYY-MM-DD}` · cents reserved by running runs (worst-case each), released when the run ends and replaced by actual.

The day is computed in `DSE_BUDGET_TIMEZONE`. The budget-reached page's "resets in about {hours} hours" uses the same clock.

## The pre-check on `POST /api/runs`

In order, the first failure wins:

1. Schema validation of the body (`400` with the generic validation line; a well-behaved client never sends this).
2. Rate limit: `POST /api/runs` is limited to 5 per minute per IP hash (Redis sliding window). Over the limit returns `429` with a `Retry-After` header; the home page shows the rate-limit line inline.
3. URL validation (`invalid-url`): parseable, `http:` or `https:`, has a host with a dot or is a known TLD, no credentials in the URL, length ≤ 2,048. Include URLs: same host, at most `includeCap`.
4. Private address (`private-address`): resolve the host (A and AAAA); reject if any address is loopback, link-local, private (10/8, 172.16/12, 192.168/16, fc00::/7, fe80::/10), carrier NAT (100.64/10), multicast, or the metadata ranges (169.254.169.254, fd00:ec2::254). Also reject hosts `localhost`, `*.local`, `*.internal`, raw IPs in private ranges, and ports other than 80 and 443. The implementation is `packages/pipeline/src/net/private-ranges.ts`, shared with the crawler, which repeats the check on every redirect and before every navigation (DNS rebinding guard) and aborts with `private-address` if it ever fails. The one exception is `DSE_ALLOW_PRIVATE_HOSTS`, a comma-separated list of `host:port` values that the validator accepts; it is set to `localhost:4100,localhost:4300` in development and test so the fixture server and `dse serve` can be crawled, is empty in production, and `pnpm run doctor --production` fails if it is set.
5. Queue depth (`busy`): if more than 20 runs are queued, blocked with reason `busy`. This applies to every run, with or without a key, because the single worker is the bottleneck.
6. Visitor cap (`visitor-cap`): skipped with a BYO key.
7. Budget (`budget`): skipped with a BYO key. Require `budget + reserved + worstCase ≤ dailyBudget` in cents; otherwise blocked with detail `{ used, budget, runsToday, resetsAt }`.

A blocked result is `200 { blocked, detail, runsLeft }`; the client navigates to the state route in `docs/design/pages.md`. Nothing is enqueued and nothing counts. A successful result is `200 { id, runsLeft }`.

## BYO key

- The browser stores the key in `localStorage.dse_key` (try/catch) and sends it only on `POST /api/runs` as the `x-byo-key` header over HTTPS. It is never put in a URL, a cookie, or a log.
- The API validates the shape (`/^sk-ant-/`, length ≤ 200), encrypts it with AES-256-GCM using `DSE_JOB_ENCRYPTION_KEY`, and places the ciphertext in the job payload. The `runs` row stores only `byo_key = true`.
- The worker decrypts into memory for the run, creates an Anthropic client with it, and discards it when the run ends. A BYO run's model costs are computed for display but not added to the global budget.
- An invalid key (401 from the API on the first model call) ends the run `failed` with the key-rejected detail from `docs/design/copy.md`; the visitor count is refunded.
- With a key, the page cap is `DSE_BYO_PAGE_CAP`. The include cap stays 5.

## Run-level guards (worker)

- Hard timeout `DSE_RUN_TIMEOUT_MS`; on expiry the run is `failed` with the timeout detail from `docs/design/copy.md` and whatever stages completed stay in the document.
- Page-candidate cap 300, fingerprint fetch cap 60, state-capture cap 40 per page per viewport, component cap 120, preview CSS cap 200 KB, screenshot height cap 8,000 px, snapshot cap 6,000 elements.
- Concurrency: one run at a time per worker process (`concurrency: 1` in BullMQ); Railway runs one instance in v1. Two pages in flight within a run.
- Memory: a browser context per run; pages closed after capture; the browser restarted every 25 runs or when RSS exceeds 1.5 GB.
- Job retry: a job that crashes (worker restart) is retried once from the beginning; a second crash marks the run `failed` with the stopped-unexpectedly detail. Idempotency: the run row's status gate prevents double processing.
- Cancel: `POST /api/runs/{id}/cancel` sets a Redis flag the worker checks between pages; the run becomes `cancelled`, the count is refunded.
- Heartbeat: the worker writes `worker:heartbeat` (an ISO timestamp) to Redis every 15 s with a 60 s TTL; `/api/health` reports `alive` when it is under 45 s old.

## Redis and BullMQ settings

The queue is `dse`. The BullMQ connection uses `maxRetriesPerRequest: null` and `enableReadyCheck: false` (required by BullMQ), TLS when the URL is `rediss://`. The worker sets `drainDelay: 30` so an idle worker issues one blocking command every 30 s (about 3,000 commands a day idle; a run adds a few hundred). `pnpm run doctor --production` warns if `REDIS_URL` is not TLS. If the Redis provider's command quota is below 100,000 a day, the runbook says to choose a higher tier.

## Platform backstops (runbook)

- Anthropic console: a monthly spend limit set by the owner (the runbook says $20).
- Vercel and Railway: default resource limits; no autoscaling of the worker.
- Redis: the command budget above; the runbook names the number to check against the provider's quota.

## Events and visibility

`GET /api/health` reports the remaining budget and queue depth; `/catalog` shows the dev spend meter when running locally; the budget state page shows the used and total figures.

## Tests

- Unit: URL validation table, private-range table (IPv4 and IPv6, including rebinding to a public name that resolves privately on the second lookup), rate limiter, cap counting and refunds, budget arithmetic with reservations, key encryption round trip, key never present in logs (a log capture test).
- Integration: a run that exceeds the budget is blocked before enqueue; a BYO run bypasses the budget; a cancelled run refunds; a crashed worker retries once.
