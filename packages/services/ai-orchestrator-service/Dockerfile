FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir uvicorn fastapi pydantic pydantic-settings asyncpg aiokafka anthropic openai langchain numpy aiohttp redis tenacity structlog python-multipart

# Copy application
COPY . .

EXPOSE 3007

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3007"]