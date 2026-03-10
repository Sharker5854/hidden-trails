FROM python:3.14-slim

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir poetry==2.3.2

WORKDIR /app

COPY pyproject.toml poetry.lock alembic.ini ./

RUN poetry config virtualenvs.create false \
    && poetry install --no-root --no-interaction --no-ansi

VOLUME app/ ./app/
VOLUME alembic/ ./alembic/

EXPOSE 8000

CMD ["sh", "-c", "poetry run alembic upgrade head && poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"]
