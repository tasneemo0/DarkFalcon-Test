FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    postgresql-client \
    build-essential \
    libpq-dev \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

# Collect static during build (with SQLite defaults)
RUN SECRET_KEY=build-only-key DATABASE_URL=sqlite:///db.sqlite3 python manage.py collectstatic --noinput || true

EXPOSE 8000

# Simple startup: migrate then gunicorn
CMD ["bash", "-c", "echo STARTING && python manage.py migrate --noinput && echo STARTING_GUNICORN && exec gunicorn darkfalcon.wsgi:application --bind 0.0.0.0:8000 --workers 2 --log-level debug"]
