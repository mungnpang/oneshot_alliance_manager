FROM python:3.11-slim

WORKDIR /app

# System deps for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Export deps via poetry then install with pip (more reliable in Docker)
RUN pip install --no-cache-dir poetry==2.1.2

COPY pyproject.toml poetry.lock ./

RUN poetry export -f requirements.txt --output requirements.txt --without-hashes --without dev \
    && pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
