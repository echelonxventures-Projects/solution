"""
Metrics Aggregation Engine
Runs periodic aggregation of raw metrics
"""

import asyncio
from datetime import datetime, timedelta
from typing import Optional
from structlog import get_logger

from app.config import settings
from app.database import (
    query_metrics, insert_aggregated_metric, execute_raw
)

logger = get_logger()


class AggregationEngine:
    """Engine for periodic metrics aggregation"""

    def __init__(self):
        self.running = False
        self.interval_minutes = settings.ANALYTICS_AGGREGATION_INTERVAL_MINUTES

    async def start(self):
        """Start periodic aggregation"""
        self.running = True

        while self.running:
            try:
                logger.info("Running metrics aggregation")

                # Aggregate metrics for different granularities
                await self.aggregate_metrics("hour")
                await self.aggregate_metrics("day")

                logger.info("Aggregation complete")

            except Exception as e:
                logger.error(f"Aggregation error: {e}")

            # Wait for next interval
            await asyncio.sleep(self.interval_minutes * 60)

    async def stop(self):
        """Stop the aggregation engine"""
        self.running = False
        logger.info("Aggregation engine stopped")

    async def aggregate_metrics(self, granularity: str):
        """Aggregate metrics for a specific granularity"""
        # Get distinct metric names
        metrics = await execute_raw("""
            SELECT DISTINCT metric_name, metric_type
            FROM metrics
            WHERE timestamp >= NOW() - INTERVAL '24 hours'
        """)

        for metric in metrics:
            metric_name = metric["metric_name"]
            metric_type = metric["metric_type"]

            try:
                await self.aggregate_single_metric(metric_name, granularity, metric_type)
            except Exception as e:
                logger.error(f"Failed to aggregate {metric_name}: {e}")

    async def aggregate_single_metric(
        self,
        metric_name: str,
        granularity: str,
        metric_type: str,
    ):
        """Aggregate a single metric"""
        # Determine aggregation function based on metric type
        agg_func = {
            "counter": "sum",
            "gauge": "avg",
            "histogram": "avg",
            "timer": "avg",
        }.get(metric_type, "avg")

        # Time range
        end_time = datetime.utcnow()
        interval_map = {
            "hour": timedelta(hours=24),
            "day": timedelta(days=30),
        }
        start_time = end_time - interval_map.get(granularity, timedelta(hours=24))

        # Query and aggregate
        data = await query_metrics(
            metric_name=metric_name,
            start_time=start_time,
            end_time=end_time,
            granularity=granularity,
            aggregation=agg_func,
        )

        # Store aggregated data
        for dp in data:
            await insert_aggregated_metric(
                metric_name=metric_name,
                granularity=granularity,
                time_bucket=dp["bucket"],
                value=dp["value"],
                count=dp["count"],
            )

        logger.info(f"Aggregated {metric_name} for {granularity}: {len(data)} buckets")


# Global aggregation engine
aggregation_engine: Optional[AggregationEngine] = None


def get_aggregation_engine() -> AggregationEngine:
    """Get aggregation engine instance"""
    global aggregation_engine
    if aggregation_engine is None:
        aggregation_engine = AggregationEngine()
    return aggregation_engine