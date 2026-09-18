"""
Memory Service - Main Entry Point
Handles vector storage, knowledge graphs, and working memory for AI Brain
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
from app.routes import memory, agent, consolidation, search
from app.storage import init_storage_clients

logger = get_logger()

# Kafka consumer for event-driven memory updates
kafka_consumer = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting Memory Service")

    # Initialize database
    await init_db()
    logger.info("Database connected")

    # Initialize storage clients
    await init_storage_clients()
    logger.info("Storage clients initialized")

    # Start Kafka consumer
    kafka_consumer = KafkaConsumer(settings.KAFKA_BROKERS, settings.KAFKA_TOPIC_PREFIX)
    asyncio.create_task(kafka_consumer.start())
    logger.info("Kafka consumer started")

    # Start memory consolidation process
    from app.consolidation.engine import ConsolidationEngine
    consolidation_engine = ConsolidationEngine()
    asyncio.create_task(consolidation_engine.start())
    logger.info("Memory consolidation started")

    yield

    # Shutdown
    logger.info("Shutting down Memory Service")

    if kafka_consumer:
        await kafka_consumer.stop()

    await close_db()
    logger.info("Service shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Memory Service",
    description="AI Brain memory systems - Vector, Graph, and Working memory",
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
app.include_router(memory.router, prefix="/memory", tags=["Memory"])
app.include_router(agent.router, prefix="/agent", tags=["Agent Memory"])
app.include_router(consolidation.router, prefix="/consolidation", tags=["Consolidation"])
app.include_router(search.router, prefix="/search", tags=["Memory Search"])

# Health endpoints
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "memory-service"}

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