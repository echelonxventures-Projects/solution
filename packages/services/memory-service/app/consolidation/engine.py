"""
Memory Consolidation Engine
Runs periodic consolidation and cleanup
"""

import asyncio
from datetime import datetime, timedelta
from typing import Optional
from structlog import get_logger

from app.config import settings
from app.storage import query_documents
from app.routes.consolidation import run_consolidation, ConsolidationRequest

logger = get_logger()


class ConsolidationEngine:
    """Engine for periodic memory consolidation"""

    def __init__(self):
        self.running = False
        self.interval_hours = settings.MEMORY_CONSOLIDATION_INTERVAL_HOURS

    async def start(self):
        """Start periodic consolidation"""
        self.running = True

        while self.running:
            try:
                logger.info("Running periodic memory consolidation")

                # Get all users with memories
                memories = await query_documents("memories", {}, limit=10000)

                # Extract unique user IDs
                user_ids = set()
                for m in memories:
                    if m.get("user_id"):
                        user_ids.add(m["user_id"])

                # Run consolidation for each user
                for user_id in user_ids:
                    try:
                        request = ConsolidationRequest(user_id=user_id)
                        result = await run_consolidation(request)
                        logger.info(
                            f"Consolidated for {user_id}: "
                            f"{result.memories_consolidated} consolidated, "
                            f"{result.memories_archived} archived"
                        )
                    except Exception as e:
                        logger.error(f"Consolidation error for {user_id}: {e}")

                logger.info("Periodic consolidation complete")

            except Exception as e:
                logger.error(f"Consolidation engine error: {e}")

            # Wait for next interval
            await asyncio.sleep(self.interval_hours * 3600)

    async def stop(self):
        """Stop the consolidation engine"""
        self.running = False
        logger.info("Consolidation engine stopped")

    async def run_for_user(self, user_id: str) -> dict:
        """Run consolidation for specific user"""
        request = ConsolidationRequest(user_id=user_id, force=True)
        return await run_consolidation(request)


# Global consolidation engine instance
consolidation_engine: Optional[ConsolidationEngine] = None


def get_consolidation_engine() -> ConsolidationEngine:
    """Get consolidation engine instance"""
    global consolidation_engine
    if consolidation_engine is None:
        consolidation_engine = ConsolidationEngine()
    return consolidation_engine