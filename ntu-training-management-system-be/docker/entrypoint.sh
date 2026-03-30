#!/bin/sh
set -eu

cd /var/www

is_true() {
  value=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')
  [ "$value" = "1" ] || [ "$value" = "true" ] || [ "$value" = "yes" ] || [ "$value" = "on" ]
}

APP_AUTO_MIGRATE=${APP_AUTO_MIGRATE:-true}
APP_AUTO_SEED=${APP_AUTO_SEED:-false}
DB_WAIT_TIMEOUT_SECONDS=${DB_WAIT_TIMEOUT_SECONDS:-60}
DB_WAIT_INTERVAL_SECONDS=${DB_WAIT_INTERVAL_SECONDS:-2}

if is_true "$APP_AUTO_MIGRATE" || is_true "$APP_AUTO_SEED"; then
  DB_HOST=${DB_HOST:-postgres}
  DB_PORT=${DB_PORT:-5432}
  DB_DATABASE=${DB_DATABASE:-ntu_training_management}
  DB_USERNAME=${DB_USERNAME:-postgres}
  DB_PASSWORD=${DB_PASSWORD:-}

  elapsed=0
  echo "Waiting for database ${DB_HOST}:${DB_PORT}/${DB_DATABASE}..."

  until php -r "try { new PDO('pgsql:host=' . getenv('DB_HOST') . ';port=' . getenv('DB_PORT') . ';dbname=' . getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD')); exit(0); } catch (Throwable \$e) { exit(1); }"; do
    if [ "$elapsed" -ge "$DB_WAIT_TIMEOUT_SECONDS" ]; then
      echo "Database is not ready after ${DB_WAIT_TIMEOUT_SECONDS}s. Exiting."
      exit 1
    fi

    sleep "$DB_WAIT_INTERVAL_SECONDS"
    elapsed=$((elapsed + DB_WAIT_INTERVAL_SECONDS))
  done

  echo "Database connection is ready."
fi

if is_true "$APP_AUTO_MIGRATE"; then
  echo "Running migrations..."
  php artisan migrate --force
fi

if is_true "$APP_AUTO_SEED"; then
  echo "Running database seeders..."
  php artisan db:seed --force
fi

echo "Starting Laravel app..."
exec php artisan serve --host=0.0.0.0 --port=8000
