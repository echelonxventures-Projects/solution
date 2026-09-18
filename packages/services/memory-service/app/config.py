"""
Application Configuration using Pydantic Settings
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # Server
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 3008

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/consultancy_memory"

    # Kafka
    KAFKA_BROKERS: str = "localhost:9092"
    KAFKA_TOPIC_PREFIX: str = "consultancy"

    # Redis (Working Memory)
    REDIS_URL: str = "localhost:6379"
    REDIS_DB: int = 0

    # Pinecone (Vector Storage)
    PINECONE_API_KEY: str = ""
    PINECONE_ENVIRONMENT: str = ""
    PINECONE_INDEX_NAME: str = "consultancy-memory"

    # Neo4j (Knowledge Graph)
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "neo4j_password"

    # MongoDB (Document Storage)
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "consultancy_memory"

    # Embeddings
    EMBEDDINGS_PROVIDER: str = "openai"
    EMBEDDINGS_MODEL: str = "text-embedding-3-small"
    EMBEDDINGS_DIMENSION: int = 1536

    # Memory Settings
    MEMORY_RETENTION_DAYS: int = 365
    MEMORY_CONSOLIDATION_INTERVAL_HOURS: int = 24
    MEMORY_MAX_WORKING_SIZE_MB: int = 100
    MEMORY_SIMILARITY_THRESHOLD: float = 0.85

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()