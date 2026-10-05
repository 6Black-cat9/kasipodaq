#!/bin/sh
set -eu

npm run db:deploy
if [ "${SEED_DEMO:-false}" = "true" ]; then
  npm run db:seed
fi
exec node dist/index.js
