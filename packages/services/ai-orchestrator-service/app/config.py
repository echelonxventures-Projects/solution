"""
Application Configuration using Pydantic Settings
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # Server
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 3007

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/consultancy_ai"

    # Kafka
    KAFKA_BROKERS: str = "localhost:9092"
    KAFKA_TOPIC_PREFIX: str = "consultancy"

    # AI Providers
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # Redis
    REDIS_URL: str = "localhost:6379"

    # Matching Settings
    MATCHING_MIN_SCORE: float = 0.6
    MATCHING_MAX_RESULTS: int = 20
    MATCHING_USE_AI: bool = True

    # Chatbot Settings
    CHATBOT_MODEL: str = "claude-3-opus-20240229"
    CHATBOT_MAX_TOKENS: int = 4096
    CHATBOT_TEMPERATURE: float = 0.7

    # Copilot Settings
    COPILOT_MODEL: str = "claude-3-opus-20240229"
    COPILOT_MAX_TOKENS: int = 2048
    COPILOT_TEMPERATURE: float = 0.5

    # Translation
    TRANSLATION_PROVIDER: str = "deep"
    TRANSLATION_ENABLED: bool = True

    # Sentiment
    SENTIMENT_ENABLED: bool = True

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()