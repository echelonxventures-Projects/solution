FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir uvicorn fastapi pydantic pydantic-settings asyncpg aiokafka redis pinecone-client neo4j pymongo motor openai numpy structlog tenacity aiohttp

COPY . .

EXPOSE 3008

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3008"]