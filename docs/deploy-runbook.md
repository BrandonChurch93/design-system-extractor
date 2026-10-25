# Deploy runbook

For Brandon, at the end of the build. This is the only hands-on work (D-012). Every command runs in the VS Code integrated terminal, opened at the repository root (View → Terminal in VS Code, or Ctrl+backtick). The build verifies this document in P15 and corrects any name or command that changed; if something here does not match the repository, the repository is right and STATUS will say so.

Expected time: about 30 minutes plus the showcase run, which takes 15 to 30 minutes on its own.

## 0 · Before you start

1. The build's last STATUS entry says `Build complete`, the Blocker line says `None`, and `docs/traceability.md` exists.
2. Read `STATUS.md` → Known limitations, so nothing surprises you.
3. Accounts you need (sign up where you do not have one): GitHub (have), Vercel (have), Upstash (have), Anthropic console (have), **Supabase** (new), **Railway** (new), **npm** (have; you will create the org `design-system-extractor`).

## 1 · Push the repository

New terminal, repository root:

```
git status
git log --oneline -5
```

Create an empty public repository on GitHub named `design-system-extractor` (no README, no license; the repo has them). Then:

```
git remote add origin git@github.com:BrandonChurch93/design-system-extractor.git
git push -u origin main
```

## 2 · Supabase (Postgres and storage)

1. New project, region closest to you (US West). Note the database password.
2. Project Settings → Database → Connection string (URI, "Transaction" pooler for Vercel; "Session" for the worker). You need both.
3. Storage → New bucket `dse`, public. Storage → Settings → S3 connection: enable, create an access key pair. Note endpoint, access key, secret key, region.
4. No auth setup; v1 does not use it.

## 3 · Upstash (Redis)

Create a Redis database (regional, same region). Note the `REDIS_URL` (the `rediss://` TLS URL). Check the plan's command quota: the worker uses about 3,000 commands a day idle (one blocking poll every 30 s) plus a few hundred per run, and the web app a handful per request. If the free tier's daily quota is under 100,000 commands, pick the next tier.

## 4 · Anthropic

Console → Limits: set a monthly spend limit of $20. Create an API key named `dse-production`. Note it.

## 5 · Secrets

In the terminal:

```
node -e "console.log('DSE_JOB_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('DSE_ADMIN_TOKEN=' + require('crypto').randomBytes(32).toString('base64url'))"
```

Keep both lines; you will paste them into two places.

## 6 · Production env file (for checking only)

Copy `.env.example` to `.env.production.local` at the repository root and fill it with the production values:

- `ANTHROPIC_API_KEY` · from step 4
- `DATABASE_URL` · the Session connection string (port 5432). This file is what the worker and the migration use. Vercel gets the Transaction pooler string (port 6543) instead, in step 9.
- `REDIS_URL` · from step 3
- `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET=dse`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` · from step 2
- `STORAGE_PUBLIC_BASE_URL` · `https://{project}.supabase.co/storage/v1/object/public/dse`
- `DSE_JOB_ENCRYPTION_KEY`, `DSE_ADMIN_TOKEN` · from step 5
- `NEXT_PUBLIC_APP_URL` · `https://design-system-extractor.vercel.app` (change if you add a domain)
- `DSE_USER_AGENT` · `DesignSystemExtractorBot/1.0 (+https://design-system-extractor.vercel.app/how-it-works)`
- `DSE_CONTACT_EMAIL` · your email
- `DSE_MODEL_MODE=live`, `BILLING_ENABLED=false`, the caps at their defaults
- `DSE_ALLOW_PRIVATE_HOSTS` · leave it out or empty (`pnpm run doctor --production` fails if it is set)

Then:

```
pnpm run doctor --production
```

It reads `.env.production.local` by default (`--env <file>` for another) and checks the shape of every variable without connecting, warns if the Redis URL is not TLS, and tells you which connection string belongs where. Fix anything it flags. This file is gitignored; never commit it. `fixtures/env/production.sample` is the committed template the build validated against; copy it if you want the full variable list with placeholder values of the right shape.

## 7 · Migrate the database

```
env DOTENV_FILE=.env.production.local pnpm db:migrate
```

(`pnpm db:migrate` reads `DOTENV_FILE` when set, so this runs the migration against production with the Session string from step 6.)

## 8 · Railway (the worker)

1. New project → Deploy from GitHub repo → `design-system-extractor`.
2. Service settings: root directory `/` (the repository root, so the image can copy `packages/`), builder Dockerfile with the path `apps/worker/Dockerfile`, one replica, restart on failure.
3. Variables: paste every variable from step 6, including `NEXT_PUBLIC_APP_URL` (the worker uses it for the bot identity and share links).
4. Deploy. Watch the logs for `worker ready · queue dse · concurrency 1`.

## 9 · Vercel (the web app)

1. Import the GitHub repository. Framework Next.js, root directory `apps/web`; the install and build commands come from `apps/web/vercel.json`.
2. Environment variables: every variable from step 6, except `DATABASE_URL`, which here is the Transaction pooler string (port 6543) from step 2.
3. Deploy. Open the URL. The home page shows an empty showcase until step 11.

## 10 · Verify

```
curl -s https://design-system-extractor.vercel.app/api/health
```

Expect `ok: true`, `worker.alive: true`, `budget.remaining` at the daily budget. Then paste your portfolio URL into the home page and watch the run complete. If the worker does not pick it up, check the Railway logs and the `REDIS_URL` on both sides.

## 11 · The showcase

```
env DOTENV_FILE=.env.production.local pnpm showcase --remote
```

It runs the twelve roster sites through production (priority 10, outside the public budget), replaces blocked ones with alternates, uploads the content to storage (the live site picks it up within the hour, or immediately after a redeploy), writes the local `apps/web/content/showcase.json`, and prints a table. When it finishes:

```
git add apps/web/content/showcase.json
git commit -m "Showcase content"
git push
```

Open the home page; the showcase is live. Read through two or three runs on your phone.

## 12 · Publish the packages

Create the `design-system-extractor` organization once at https://www.npmjs.com/org/create (the npm CLI cannot create organizations). Then:

```
npm login
pnpm --filter @design-system-extractor/mcp publish --access public
pnpm --filter @design-system-extractor/cli publish --access public
```

Then, in Claude Code, paste the MCP install line from any run page (`claude mcp add design-system-extractor -- npx -y @design-system-extractor/mcp --run <id>`) and ask it for a component's CSS; this is the one MCP check the build could not do itself. Then run `npx @design-system-extractor/cli extract https://brandonchurchportfolio.com --out ./test-run` in a scratch folder and open the result at `/open`.

## 13 · Optional: a domain

In Hostinger DNS, add the CNAME Vercel shows for the domain; in Vercel, add the domain to the project. Update `NEXT_PUBLIC_APP_URL` and `DSE_USER_AGENT` in both Vercel and Railway and in `.env.production.local`, redeploy both, then rewrite the share links in the showcase content without re-running anything:

```
env DOTENV_FILE=.env.production.local pnpm showcase --remote --refresh-links
```

## 14 · Testing v1 (your checklist before deciding on v2)

- Run five sites you know well. Do the tokens look right? Do the components have the states you expect? Does the drift report say something true?
- Open a run on your phone. Open a component. Share a link to a component.
- Compare two runs of the same site after you change something on it.
- Try the cap: run three times from one browser; the third should land on the "Run limit" page with the key form.
- Add the MCP server to Claude Code and ask it for a component's CSS.
- Read `STATUS.md` → Known limitations again with real runs in front of you.
- If it works really well: `docs/v2-plan.md` is the next build.

## Backstops

- Anthropic monthly limit (step 4) caps the worst case.
- Vercel and Railway have no autoscaling in this setup.
- To pause everything: set `DSE_GLOBAL_DAILY_BUDGET_USD=0` in Vercel and redeploy; every new run lands on the budget page.
