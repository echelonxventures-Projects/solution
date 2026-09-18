"""
Database Connection with TimescaleDB support
"""

import asyncpg
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import json
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

    # Create TimescaleDB tables
    await create_tables()


async def close_db():
    """Close database connection pool"""
    global pool
    if pool:
        await pool.close()
        logger.info("Database pool closed")


async def create_tables():
    """Create analytics tables with TimescaleDB hypertables"""
    async with pool.acquire() as conn:
        # Metrics table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS metrics (
                id SERIAL,
                metric_name VARCHAR(100) NOT NULL,
                metric_type VARCHAR(20) NOT NULL,
                value DOUBLE PRECISION NOT NULL,
                timestamp TIMESTAMPTZ NOT NULL,
                dimensions JSONB,
                metadata JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        # Create hypertable for time-series data
        try:
            await conn.execute("""
                SELECT create_hypertable('metrics', 'timestamp',
                    if_not_exists => TRUE,
                    chunk_time_interval => INTERVAL '1 day'
                );
            """)
            logger.info("Created hypertable for metrics")
        except Exception as e:
            logger.warning(f"Hypertable creation skipped: {e}")

        # Aggregated metrics table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS aggregated_metrics (
                id SERIAL,
                metric_name VARCHAR(100) NOT NULL,
                granularity VARCHAR(20) NOT NULL,
                time_bucket TIMESTAMPTZ NOT NULL,
                value DOUBLE PRECISION NOT NULL,
                dimensions JSONB,
                count INTEGER DEFAULT 1,
                min_value DOUBLE PRECISION,
                max_value DOUBLE PRECISION,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(metric_name, granularity, time_bucket, dimensions)
            );
        """)

        try:
            await conn.execute("""
                SELECT create_hypertable('aggregated_metrics', 'time_bucket',
                    if_not_exists => TRUE,
                    chunk_time_interval => INTERVAL '7 days'
                );
            """)
        except Exception as e:
            logger.warning(f"Hypertable creation skipped: {e}")

        # Dashboard configurations
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS dashboards (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                widgets JSONB,
                layout JSONB,
                filters JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        # Reports table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id VARCHAR(50) PRIMARY KEY,
                report_type VARCHAR(50) NOT NULL,
                time_range VARCHAR(50) NOT NULL,
                generated_at TIMESTAMPTZ DEFAULT NOW(),
                format VARCHAR(20),
                file_path TEXT,
                download_url TEXT,
                data JSONB,
                summary TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        # KPI targets
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS kpi_targets (
                id VARCHAR(50) PRIMARY KEY,
                kpi_name VARCHAR(100) NOT NULL,
                target_value DOUBLE PRECISION,
                warning_threshold DOUBLE PRECISION,
                critical_threshold DOUBLE PRECISION,
                unit VARCHAR(20),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        logger.info("Analytics tables created")


async def query_metrics(
    metric_name: str,
    start_time: datetime,
    end_time: datetime,
    granularity: str = "hour",
    aggregation: str = "avg",
    dimensions: Optional[Dict] = None,
) -> List[Dict]:
    """Query metrics with aggregation"""
    async with pool.acquire() as conn:
        # Build dimension filter
        dim_filter = ""
        if dimensions:
            dim_conditions = []
            for key, value in dimensions.items():
                dim_conditions.append(f"dimensions->>'{key}' = '{value}'")
            dim_filter = "AND " + " AND ".join(dim_conditions)

        # Query based on granularity
        interval_map = {
            "minute": "1 minute",
            "hour": "1 hour",
            "day": "1 day",
            "week": "1 week",
            "month": "1 month",
        }
        interval = interval_map.get(granularity, "1 hour")

        query = f"""
            SELECT
                time_bucket('{interval}', timestamp) AS bucket,
                {aggregation}(value) AS value,
                COUNT(*) AS count
            FROM metrics
            WHERE metric_name = $1
                AND timestamp >= $2
                AND timestamp <= $3
                {dim_filter}
            GROUP BY bucket
            ORDER BY bucket
        """

        rows = await conn.fetch(query, metric_name, start_time, end_time)
        return [dict(row) for row in rows]


async def insert_metric(
    metric_name: str,
    metric_type: str,
    value: float,
    timestamp: datetime,
    dimensions: Optional[Dict] = None,
    metadata: Optional[Dict] = None,
) -> bool:
    """Insert a metric record"""
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO metrics (metric_name, metric_type, value, timestamp, dimensions, metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
        """,
            metric_name,
            metric_type,
            value,
            timestamp,
            json.dumps(dimensions) if dimensions else None,
            json.dumps(metadata) if metadata else None,
        )
        return True


async def insert_aggregated_metric(
    metric_name: str,
    granularity: str,
    time_bucket: datetime,
    value: float,
    dimensions: Optional[Dict] = None,
    count: int = 1,
    min_val: Optional[float] = None,
    max_val: Optional[float] = None,
) -> bool:
    """Insert or update aggregated metric"""
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO aggregated_metrics
                (metric_name, granularity, time_bucket, value, dimensions, count, min_value, max_value)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (metric_name, granularity, time_bucket, dimensions)
            DO UPDATE SET
                value = $4,
                count = $6,
                min_value = $7,
                max_value = $8,
                created_at = NOW()
        """,
            metric_name,
            granularity,
            time_bucket,
            value,
            json.dumps(dimensions) if dimensions else "{}",
            count,
            min_val,
            max_val,
        )
        return True


async def get_latest_metrics(metric_names: List[str]) -> Dict[str, float]:
    """Get latest values for multiple metrics"""
    async with pool.acquire() as conn:
        results = {}
        for name in metric_names:
            row = await conn.fetchrow("""
                SELECT value, timestamp FROM metrics
                WHERE metric_name = $1
                ORDER BY timestamp DESC LIMIT 1
            """, name)
            if row:
                results[name] = row["value"]
        return results


async def get_metric_stats(
    metric_name: str,
    start_time: datetime,
    end_time: datetime,
) -> Dict[str, float]:
    """Get statistics for a metric"""
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT
                AVG(value) AS avg,
                MIN(value) AS min,
                MAX(value) AS max,
                STDDEV(value) AS stddev,
                COUNT(*) AS count,
                SUM(value) AS sum
            FROM metrics
            WHERE metric_name = $1
                AND timestamp >= $2
                AND timestamp <= $3
        """, metric_name, start_time, end_time)

        return dict(row) if row else {}


async def get_platform_stats() -> Dict[str, Any]:
    """Get overall platform statistics"""
    async with pool.acquire() as conn:
        # Get various metrics
        stats = {}

        # Users
        row = await conn.fetchrow("""
            SELECT value FROM metrics WHERE metric_name = 'users.total'
            ORDER BY timestamp DESC LIMIT 1
        """)
        stats["total_users"] = row["value"] if row else 0

        # Consultants
        row = await conn.fetchrow("""
            SELECT value FROM metrics WHERE metric_name = 'consultants.total'
            ORDER BY timestamp DESC LIMIT 1
        """)
        stats["total_consultants"] = row["value"] if row else 0

        # Sessions
        row = await conn.fetchrow("""
            SELECT value FROM metrics WHERE metric_name = 'sessions.active'
            ORDER BY timestamp DESC LIMIT 1
        """)
        stats["active_sessions"] = row["value"] if row else 0

        # Revenue
        row = await conn.fetchrow("""
            SELECT SUM(value) AS total FROM metrics
            WHERE metric_name = 'revenue.session'
            AND timestamp >= NOW() - INTERVAL '30 days'
        """)
        stats["total_revenue"] = row["total"] if row else 0

        # Average rating
        row = await conn.fetchrow("""
            SELECT AVG(value) AS avg FROM metrics
            WHERE metric_name = 'rating.session'
            AND timestamp >= NOW() - INTERVAL '30 days'
        """)
        stats["avg_rating"] = row["avg"] if row else 0

        stats["timestamp"] = datetime.utcnow()

        return stats


async def save_dashboard(dashboard_data: Dict) -> bool:
    """Save dashboard configuration"""
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO dashboards (id, name, description, widgets, layout, filters)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET
                name = $2,
                description = $3,
                widgets = $4,
                layout = $5,
                filters = $6,
                updated_at = NOW()
        """,
            dashboard_data["id"],
            dashboard_data["name"],
            dashboard_data.get("description"),
            json.dumps(dashboard_data.get("widgets", [])),
            json.dumps(dashboard_data.get("layout", {})),
            json.dumps(dashboard_data.get("filters", {})),
        )
        return True


async def get_dashboard(dashboard_id: str) -> Optional[Dict]:
    """Get dashboard configuration"""
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT * FROM dashboards WHERE id = $1
        """, dashboard_id)
        return dict(row) if row else None


async def save_report(report_data: Dict) -> bool:
    """Save generated report"""
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO reports (id, report_type, time_range, format, file_path, download_url, data, summary)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """,
            report_data["id"],
            report_data["report_type"],
            report_data["time_range"],
            report_data.get("format", "pdf"),
            report_data.get("file_path"),
            report_data.get("download_url"),
            json.dumps(report_data.get("data")),
            report_data.get("summary"),
        )
        return True


async def execute_raw(query: str, *args) -> List[Dict]:
    """Execute raw query"""
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *args)
        return [dict(row) for row in rows]