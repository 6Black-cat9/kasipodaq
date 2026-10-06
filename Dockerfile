# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS base
WORKDIR /app
# Prisma's Debian engine needs OpenSSL.
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

FROM base AS build
COPY . .
RUN npm ci && npm run db:generate && npm run build

FROM base AS runtime
ENV NODE_ENV=production
# A single copy avoids large duplicate filesystem layers with VFS storage drivers.
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /app/server/uploads && chown node:node /app/server/uploads && chmod 755 /app/docker/entrypoint.sh
USER node
WORKDIR /app/server
EXPOSE 4000
ENTRYPOINT ["/app/docker/entrypoint.sh"]
