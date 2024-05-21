FROM --platform=$BUILDPLATFORM node:20-alpine AS base_build
FROM --platform=$TARGETPLATFORM node:20-alpine AS base_target



FROM base_build AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile



FROM base_build AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build



FROM base_target AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder --chown=node:node /app .

USER node:node

CMD ["yarn", "start"]
