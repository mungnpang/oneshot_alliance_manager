FROM python:3.11-slim

WORKDIR /app

# System deps for psycopg2 and easyocr
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install poetry
RUN pip install --no-cache-dir poetry==2.1.2

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies (no dev, no venv inside container)
RUN poetry config virtualenvs.create false \
    && poetry install --only main --no-interaction --no-ansi

# Copy app code
COPY . .

# Start: run migrations then launch server
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
