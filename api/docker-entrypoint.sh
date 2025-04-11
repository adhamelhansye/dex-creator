#!/bin/sh
set -e

# Run database migrations if MIGRATE_DB=true
if [ "$MIGRATE_DB" = "true" ]; then
  echo "Running database migrations..."
  yarn db:migrate:deploy
fi

# Start the application
echo "Starting API server..."
exec "$@" 