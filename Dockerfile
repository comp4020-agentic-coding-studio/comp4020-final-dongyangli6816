# syntax = docker/dockerfile:1

# Spotter: an Astro server app on Node, with SQLite on the /data volume.
# Fly (fly.toml) and CI both build this file and run what it produces; the app
# serves HTTP on 0.0.0.0:$PORT and publishes README.md at /readme/.

FROM docker.io/library/node:24.21.0-slim AS build
# better-sqlite3 downloads a prebuilt binding, and compiles one if it can't
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm@11.9.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build && pnpm prune --prod

FROM docker.io/library/node:24.21.0-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 DATA_DIR=/data
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json README.md ./
COPY drizzle ./drizzle
COPY docs ./docs
CMD ["node", "dist/server/entry.mjs"]
