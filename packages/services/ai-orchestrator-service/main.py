"""
AI Orchestrator Service - Main Entry Point
Handles AI-powered consultant matching, chatbot, copilot, and translation services
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
from app.routes import matching, chatbot, copilot, translation, sentiment, summarization
from app.llm.clients import init_llm_clients

logger = get_logger()

# Kafka consumer for event-driven processing
kafka_consumer = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting AI Orchestrator Service")

    # Initialize database
    await init_db()
    logger.info("Database connected")

    # Initialize LLM clients
    await init_llm_clients()
    logger.info("LLM clients initialized")

    # Start Kafka consumer
    kafka_consumer = KafkaConsumer(settings.KAFKA_BROKERS, settings.KAFKA_TOPIC_PREFIX)
    asyncio.create_task(kafka_consumer.start())
    logger.info("Kafka consumer started")

    yield

    # Shutdown
    logger.info("Shutting down AI Orchestrator Service")

    if kafka_consumer:
        await kafka_consumer.stop()

    await close_db()
    logger.info("Service shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="AI Orchestrator Service",
    description="AI-powered consultant matching, chatbot, and analysis services",
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
app.include_router(matching.router, prefix="/matching", tags=["Matching"])
app.include_router(chatbot.router, prefix="/chatbot", tags=["Chatbot"])
app.include_router(copilot.router, prefix="/copilot", tags=["Copilot"])
app.include_router(translation.router, prefix="/translation", tags=["Translation"])
app.include_router(sentiment.router, prefix="/sentiment", tags=["Sentiment"])
app.include_router(summarization.router, prefix="/summarization", tags=["Summarization"])

# Health endpoints
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ai-orchestrator-service"}

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