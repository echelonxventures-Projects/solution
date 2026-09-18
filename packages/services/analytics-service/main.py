"""
Analytics Service - Main Entry Point
Handles metrics, dashboards, reports, and predictive analytics
"""

import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from structlog import get_logger

from app.config import settings
from app.database import init_db, close_db
from app.events.consumer import KafkaConsumer
from app.routes import metrics, dashboard, reports, predictions
from app.aggregation.engine import AggregationEngine

logger = get_logger()

# Kafka consumer for event-driven metrics
kafka_consumer = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting Analytics Service")

    # Initialize database
    await init_db()
    logger.info("Database connected")

    # Start Kafka consumer
    kafka_consumer = KafkaConsumer(settings.KAFKA_BROKERS, settings.KAFKA_TOPIC_PREFIX)
    asyncio.create_task(kafka_consumer.start())
    logger.info("Kafka consumer started")

    # Start aggregation engine
    aggregation_engine = AggregationEngine()
    asyncio.create_task(aggregation_engine.start())
    logger.info("Aggregation engine started")

    yield

    # Shutdown
    logger.info("Shutting down Analytics Service")

    if kafka_consumer:
        await kafka_consumer.stop()

    await close_db()
    logger.info("Service shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Analytics Service",
    description="Metrics, dashboards, reports, and predictive analytics",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])

# Health endpoints
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "analytics-service"}

@app.get("/ready")
async def ready():
    return {"ready": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=True,
        log_level="info",
    )