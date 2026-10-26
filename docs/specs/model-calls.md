# Model calls

Five calls use a model. Everything else is code. Each call has a purpose, a model, a structured output, a cost record, and a deterministic fallback so a model outage never fails a run.

## Models

One config file, `packages/pipeline/src/models/config.ts`:

```
export const models = {
  small: process.env.DSE_MODEL_SMALL ?? '<verified Haiku id>',
  large: process.env.DSE_MODEL_LARGE ?? '<verified Sonnet id>',
}
export const prices = { /* USD per million tokens, per model id: input, cachedInput (cache read), cacheWrite (5-minute write), output, and an optional longContext row with its prompt-size threshold */ }
```

At P0, verify the current ids and prices on https://docs.claude.com/en/docs/about-claude/models and fill them in; record the ids and the date checked in `docs/decisions.md`. The expected ids at the time this kit was written are the current Haiku and Sonnet models of the 5.5 generation (`claude-haiku-5-5`, `claude-sonnet-5-5`); confirm rather than assume. Verified on 2026-10-25 (D-026): both ids are current, and `pnpm run doctor` retrieves both through the Models API. Opus is never used at runtime.

## The five calls

| Purpose | Model | Stage | Input | Output | Fallback |
| --- | --- | --- | --- | --- | --- |
| Select pages | small | `select` | text table of ≤ 30 page candidates, cap, rules | array of candidate ids | deterministic ranking |
| Name and type components | small | `components` | batches of 8: crop (only if rule confidence < 0.9), fingerprint, text, guess | `{type, name, isComponent, variantHint}[]` | rule type, generated name |
| Resolve name collisions | small | `components` | text only: pairs of same-name, same-type clusters with their fingerprints | `{same: boolean}[]` | keep separate, suffix names |
| Name color tokens | small | `tokens` | clustered colors with hue, role, usage contexts | names | deterministic hue-step names |
| Narrative and intro | large | `drift` | facts JSON, run stats, voice rules | `{narrative, designSystemIntro}` | template text |

Select, collision, token naming and narrative run once per run each; the component call runs once per batch. A 46-component, 31-token run is roughly: select 1.5k in / 0.1k out; components 40k in / 3k out; collision 1k in / 0.1k out; token naming 2k in / 0.4k out; narrative 6k in / 0.6k out. At the small model's price that is a few cents; the narrative on the large model is under ten cents. The worst-case figure (`DSE_WORST_CASE_RUN_USD`, 0.60) assumes a 120-component run with every crop sent.

## Structured output

Every call uses the API's structured outputs: `output_config.format` carries a JSON schema generated from the Zod schema for that output (Zod 4's built-in `z.toJSONSchema`, through the SDK's `zodOutputFormat` helper). Forced `tool_choice` is not used: the current Sonnet returns a 400 for it (D-027). The result is parsed with the same Zod schema. A parse failure retries once with the validation error appended to the prompt; a second failure takes the fallback. No sampling parameters are sent: API version `2026-10-21` rejects `temperature`, `top_p` and `top_k` on every model, so stable output comes from tight prompts, structured outputs, validation and record and replay, not from temperature (D-027). Thinking: the small model runs with thinking disabled at effort `low`; the large model cannot disable thinking, so it runs adaptive thinking at effort `low`. Thinking tokens are billed as output and are counted in the cost record.

## Prompt caching

Each call's system prompt (rules, enums, rubric, examples) is static per pipeline version and is sent with `cache_control: { type: 'ephemeral' }`. Dynamic content goes in the user turn. The cost record notes `cached: true` when the response reports cached input tokens.

## Images

Crops are PNG, downscaled so the longer side is at most 512 px, sent as base64 image blocks. Only items with rule confidence below 0.9 get an image; the rest are text-only lines in the same batch.

## Cost accounting

`packages/pipeline/src/models/client.ts` wraps the SDK. Every response's `usage` is converted to USD with the price table and appended to the run's `cost.calls` with purpose and model, summed into `cost.usd`, and, for non-BYO runs, added to the Redis budget counter through the worker's `BudgetMeter`. In the web app nothing calls a model.

## Modes: live, record, replay

`DSE_MODEL_MODE`:

- `live` · real calls. Default in development and production.
- `record` · real calls, and each request and response pair is written to `fixtures/recordings/{purpose}/{sha256(request)}.json`. Used once per fixture to build the replay set.
- `replay` · no network; the request hash is looked up; a miss throws in tests (so a changed prompt is noticed) and takes the fallback in non-test contexts. Default in `test`, and the mode `pnpm evals` forces unless `DSE_MODEL_MODE=live` is passed on its command line (`env DSE_MODEL_MODE=live pnpm evals`); `.env.local` never switches evals to live.

Request hashing excludes volatile fields (run ids, timestamps, storage keys that embed a run id) and image bytes (a crop differs by a few anti-aliased pixels between machines; the text beside each image identifies it) so recordings survive re-runs (D-040). Recordings are committed. A recording run waits up to 60 s per call (build-time work; a timed-out call would leave replay without its answer), records an answer that came on the retry and marks it so, and stores the request text beside the answer so a miss can be compared (`DSE_REPLAY_MISS_DIR` writes missed requests). `pnpm evals --prune-recordings`, after a full replay of every fixture, deletes the recordings no call read (D-052). They are made in `record` mode once per phase that adds a call: P3 (select), P4 (token naming), P5 (components, collision), P8 (narrative and intro), and refreshed by the final live eval in P15.

## The build-time spend cap (D-011)

Outside production (`NODE_ENV !== 'production'`), the same `BudgetMeter` enforces `DSE_DEV_SPEND_CAP_USD` across all live calls, persisted in a local file (`.dse/dev-spend.json`, gitignored) so it survives restarts; in production the dev cap and reserve are ignored and only the Redis daily budget applies. The meter's file half is built in P3 with the model client; its Redis half in P10. When reached, the client refuses live calls with a clear error and the fallback runs; tests continue in replay. `/catalog` shows the meter. The live spend is budgeted: recordings in P3, P4, P5 and P8 (a few dollars in all), the real-roster dry run in P13 (which must stop when the meter reaches the cap minus the reserve), and a final live eval in P15 with a reserved $4 (`DSE_DEV_SPEND_RESERVE_USD`, enforced by the meter: before P15, live calls are refused at cap minus reserve). If the reserve is somehow gone, P15's `results.json` comes from replay and STATUS says so under Known limitations.

## Fallbacks (exact)

- Select: deterministic top-N by score with constraints.
- Component naming: rule type; name `{Type label} {n}` numbered within the type; `isComponent: true`; no variant hint.
- Collision: keep separate; the later cluster's name gets a numeric suffix.
- Color naming: the deterministic names from `token-clustering.md`.
- Narrative: `{headline} {supporting[0]} {supporting[1]} The proposed set keeps every passing contrast ratio.`
- Design-system.md intro: `This design system was extracted from {host} on {date}: {colors} colors, {typeStyles} type styles, {spacingSteps} spacing steps and {components} components across {pages} pages.`
- The prompt opening is static and never comes from a model (see `exports-and-mcp.md`).

The log line for each call states `by model`, `by model (retry)`, or `by fallback` with the reason (`timeout`, `invalid`, `budget`, `error`).

## Prompts

Prompts live in `packages/pipeline/src/models/prompts/*.md` and are loaded at build time. They state the voice rules (no em dashes, sentence case, the three forbidden words from copy rule 3; the one prompt line that names those words carries the `qa-copy-allow` marker because `pnpm qa:copy` scans the prompts), the enum values verbatim, two or three worked examples, and the output schema in words. They never ask the model to compute numbers; numbers come in as facts.

## Tests

- Replay tests for every purpose, including malformed, wrong-enum and timeout cases asserting the fallback.
- Cost accounting arithmetic against the price table with a cached and an uncached response.
- The dev spend cap refuses the next live call at the cap (a mocked meter).
- Request hash stability across volatile fields.
