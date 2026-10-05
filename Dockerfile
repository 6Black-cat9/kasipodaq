# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS base
WORKDIR /app
# Prisma's Debian engine needs OpenSSL. The proxy CA is mounted only for this step.
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then \
      apt-get -o Acquire::https::CaInfo=/run/secrets/proxy_ca update && \
      apt-get -o Acquire::https::CaInfo=/run/secrets/proxy_ca install -y --no-install-recommends openssl ca-certificates; \
    else \
      apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates; \
    fi && rm -rf /var/lib/apt/lists/*

FROM base AS build
COPY . .
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi; \
    npm ci --strict-ssl=true && npm run db:generate && npm run build

FROM base AS runtime
ENV NODE_ENV=production
# A single copy avoids large duplicate filesystem layers with VFS storage drivers.
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /app/server/uploads && chown node:node /app/server/uploads && chmod 755 /app/docker/entrypoint.sh
USER node
WORKDIR /app/server
EXPOSE 4000
ENTRYPOINT ["/app/docker/entrypoint.sh"]
