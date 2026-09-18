FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir uvicorn fastapi pydantic pydantic-settings asyncpg aiokafka redis numpy pandas scikit-learn matplotlib structlog tenacity aiohttp

COPY . .

EXPOSE 3011

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3011"]