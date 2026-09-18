"""
Database Connection Module
"""

import asyncpg
from typing import Optional
from structlog import get_logger

from app.config import settings

logger = get_logger()

pool: Optional[asyncpg.Pool] = None


async def init_db():
    """Initialize database connection pool"""
    global pool
    pool = await asyncpg.create_pool(
        settings.DATABASE_URL,
        min_size=5,
        max_size=20,
        command_timeout=60,
    )
    logger.info("Database pool created")


async def close_db():
    """Close database connection pool"""
    global pool
    if pool:
        await pool.close()
        logger.info("Database pool closed")

    # Close storage clients
    from app.storage import close_storage_clients
    close_storage_clients()