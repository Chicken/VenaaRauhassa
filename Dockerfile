FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

FROM base AS deps

RUN apt-get update \
  && apt-get install --no-install-recommends -y build-essential python3 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder

WORKDIR /app

ARG GITHUB_SHA=development

ENV NEXT_OUTPUT=standalone
ENV GITHUB_SHA=$GITHUB_SHA

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

FROM node:24-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p .next data \
  && chown nextjs:nodejs .next data

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
