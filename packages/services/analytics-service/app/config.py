"""
Application Configuration
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Server
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 3011

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/consultancy_analytics"

    # Kafka
    KAFKA_BROKERS: str = "localhost:9092"
    KAFKA_TOPIC_PREFIX: str = "consultancy"

    # Redis
    REDIS_URL: str = "localhost:6379"
    REDIS_DB: int = 1

    # Analytics Settings
    ANALYTICS_RETENTION_DAYS: int = 365
    ANALYTICS_AGGREGATION_INTERVAL_MINUTES: int = 5
    ANALYTICS_PREDICTION_ENABLED: bool = True

    # Dashboard
    DASHBOARD_REFRESH_INTERVAL_SECONDS: int = 30
    DASHBOARD_MAX_DATA_POINTS: int = 1000

    # Reports
    REPORT_STORAGE_PATH: str = "/var/consultancy/reports"
    REPORT_FORMATS: str = "pdf,csv,json"

    # Prediction
    PREDICTION_FORECAST_DAYS: int = 30
    PREDICTION_MIN_DATA_POINTS: int = 30

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()