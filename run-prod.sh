#!/bin/bash
# run-prod.sh

echo "Starting Stream Fighter in PRODUCTION mode..."
# Ensure NODE_ENV is production for the build context if needed
export NODE_ENV=production
docker compose -f docker-compose.prod.yaml up --build -d
