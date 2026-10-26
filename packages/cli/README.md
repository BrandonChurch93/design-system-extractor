# @design-system-extractor/cli

The `dse` command runs the Design System Extractor pipeline on your machine: tokens, components with every state, automated checks and a drift report from a site, written to a folder.

```
npx @design-system-extractor/cli extract https://example.com --out ./dse-run
```

- `dse extract <url> [--pages 12] [--out ./dse-run] [--cdp <url>] [--include <url>]… [--set proposed|raw]` runs the pipeline and writes `run.json`, `exports/` (every format), `screenshots/` and `components/`.
- With `--cdp`, it opens new tabs in a Chrome you started with `--remote-debugging-port=9222`, so it sees whatever you are signed in to. Nothing leaves your machine.
- `dse export <run.json> --format tokens.css [--set raw]` writes one export from a run file.
- `dse serve <dir>` serves a run folder on `http://localhost:4300` so the web app's `/open` page can show its crops and previews.

Model steps use `ANTHROPIC_API_KEY` when it is set; without it, names and the drift narrative come from templates. Playwright's Chromium is installed on first use, after asking.

MIT license.
