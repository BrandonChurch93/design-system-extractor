# Build from the repository root: docker build -f apps/worker/Dockerfile .
FROM node:22-bookworm-slim AS build
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/worker/package.json apps/worker/
COPY packages/schema/package.json packages/schema/
COPY packages/pipeline/package.json packages/pipeline/
RUN pnpm install --frozen-lockfile --filter worker... --ignore-scripts
COPY packages/schema packages/schema
COPY packages/pipeline packages/pipeline
COPY apps/worker apps/worker
RUN pnpm --filter worker build \
  && pnpm --filter worker deploy --prod /out \
  && cp -r apps/worker/dist /out/dist

FROM mcr.microsoft.com/playwright:v1.64.1-noble AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=pwuser:pwuser /out /app
USER pwuser
CMD ["node", "dist/index.js"]
