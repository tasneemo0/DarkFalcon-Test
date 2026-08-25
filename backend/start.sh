#!/bin/bash
set -e

echo "=== TrustChat Backend Startup ==="
echo "PORT: ${PORT:-not set}"
echo "DATABASE_URL: ${DATABASE_URL:+is set}"
echo "CELERY_BROKER_URL: ${CELERY_BROKER_URL:+is set}"
echo "DEBUG: ${DEBUG:-not set}"

echo "=== Running migrations ==="
python manage.py migrate --noinput

echo "=== Collecting static files ==="
python manage.py collectstatic --noinput || echo "collectstatic failed but continuing..."

echo "=== Starting Gunicorn on port ${PORT:-8000} ==="
exec gunicorn darkfalcon.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --log-level info --access-logfile - --error-logfile -
