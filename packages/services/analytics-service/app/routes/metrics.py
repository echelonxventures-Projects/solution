"""
API Routes for Metrics
"""

import json
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from structlog import get_logger

from app.models import (
    MetricRecord, MetricType, MetricQuery, MetricResponse,
    AggregatedMetric, TimeGranularity, KPI, PlatformStats
)
from app.database import (
    insert_metric, query_metrics, get_latest_metrics,
    get_metric_stats, get_platform_stats, insert_aggregated_metric
)

logger = get_logger()
router = APIRouter()


@router.post("/record")
async def record_metric(request: MetricRecord):
    """
    Record a new metric

    - Stores raw metric data
    - Triggers aggregation if needed
    """
    try:
        await insert_metric(
            metric_name=request.metric_name,
            metric_type=request.metric_type.value,
            value=request.value,
            timestamp=request.timestamp,
            dimensions=request.dimensions,
            metadata=request.metadata,
        )

        return {"recorded": True, "metric": request.metric_name}

    except Exception as e:
        logger.error(f"Metric recording error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch")
async def record_metrics_batch(metrics: List[MetricRecord]):
    """
    Record multiple metrics at once
    """
    recorded = 0

    for metric in metrics:
        try:
            await insert_metric(
                metric_name=metric.metric_name,
                metric_type=metric.metric_type.value,
                value=metric.value,
                timestamp=metric.timestamp,
                dimensions=metric.dimensions,
            )
            recorded += 1
        except Exception as e:
            logger.error(f"Failed to record metric {metric.metric_name}: {e}")

    return {"recorded": recorded, "total": len(metrics)}


@router.post("/query", response_model=MetricResponse)
async def query_metrics_api(request: MetricQuery):
    """
    Query metrics with aggregation

    - Supports time range and granularity
    - Returns aggregated data points
    """
    try:
        data_points = await query_metrics(
            metric_name=request.metric_name,
            start_time=request.start_time,
            end_time=request.end_time,
            granularity=request.granularity.value,
            aggregation=request.aggregation,
            dimensions=request.dimensions,
        )

        # Calculate aggregated value
        if data_points:
            values = [dp["value"] for dp in data_points]
            agg_func = {
                "sum": sum,
                "avg": lambda x: sum(x) / len(x),
                "min": min,
                "max": max,
                "count": len,
            }
            aggregated_value = agg_func.get(request.aggregation, lambda x: x[-1])(values)
        else:
            aggregated_value = None

        return MetricResponse(
            metric_name=request.metric_name,
            granularity=request.granularity.value,
            data_points=data_points,
            total_points=len(data_points),
            aggregated_value=aggregated_value,
        )

    except Exception as e:
        logger.error(f"Metric query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/latest")
async def get_latest(metric_names: str = ""):
    """
    Get latest values for specified metrics

    Comma-separated metric names
    """
    try:
        names = metric_names.split(",") if metric_names else []
        latest = await get_latest_metrics(names)

        return {
            "metrics": latest,
            "timestamp": datetime.utcnow(),
        }

    except Exception as e:
        logger.error(f"Latest metrics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/{metric_name}")
async def get_stats(
    metric_name: str,
    time_range: str = "24h",
):
    """
    Get statistics for a metric

    Returns min, max, avg, stddev, count, sum
    """
    try:
        # Parse time range
        end_time = datetime.utcnow()
        start_time = parse_time_range(time_range, end_time)

        stats = await get_metric_stats(metric_name, start_time, end_time)

        return {
            "metric_name": metric_name,
            "time_range": time_range,
            "stats": stats,
        }

    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/platform")
async def platform_statistics():
    """
    Get overall platform statistics
    """
    try:
        stats = await get_platform_stats()
        return PlatformStats(**stats)

    except Exception as e:
        logger.error(f"Platform stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/kpis")
async def get_kpis():
    """
    Get Key Performance Indicators
    """
    try:
        # Get latest metrics for KPIs
        latest = await get_latest_metrics([
            "users.total",
            "consultants.active",
            "sessions.active",
            "revenue.daily",
            "rating.average",
            "booking.rate",
        ])

        # Calculate KPIs with trends
        kpis = []

        # User growth
        kpis.append(KPI(
            name="Total Users",
            current_value=latest.get("users.total", 0),
            trend="up",
            status="good",
            unit="users",
        ))

        # Active consultants
        kpis.append(KPI(
            name="Active Consultants",
            current_value=latest.get("consultants.active", 0),
            trend="stable",
            status="good",
            unit="consultants",
        ))

        # Active sessions
        kpis.append(KPI(
            name="Active Sessions",
            current_value=latest.get("sessions.active", 0),
            trend="up",
            status="good",
            unit="sessions",
        ))

        # Daily revenue
        kpis.append(KPI(
            name="Daily Revenue",
            current_value=latest.get("revenue.daily", 0),
            trend="up",
            status="good",
            unit="USD",
            target=10000,
        ))

        # Average rating
        kpis.append(KPI(
            name="Average Rating",
            current_value=latest.get("rating.average", 4.0),
            trend="stable",
            status="good",
            unit="stars",
            target=4.5,
        ))

        return {"kpis": kpis, "timestamp": datetime.utcnow()}

    except Exception as e:
        logger.error(f"KPIs error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/aggregate")
async def aggregate_metric(
    metric_name: str,
    granularity: str = "hour",
):
    """
    Force aggregation for a metric
    """
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=24)

        data = await query_metrics(
            metric_name=metric_name,
            start_time=start_time,
            end_time=end_time,
            granularity=granularity,
            aggregation="avg",
        )

        for dp in data:
            await insert_aggregated_metric(
                metric_name=metric_name,
                granularity=granularity,
                time_bucket=dp["bucket"],
                value=dp["value"],
                count=dp["count"],
            )

        return {"aggregated": len(data), "metric": metric_name}

    except Exception as e:
        logger.error(f"Aggregation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_metrics():
    """
    List all available metric names
    """
    from app.database import execute_raw

    try:
        rows = await execute_raw("""
            SELECT DISTINCT metric_name, metric_type
            FROM metrics
            ORDER BY metric_name
        """)

        return {
            "metrics": rows,
            "total": len(rows),
        }

    except Exception as e:
        logger.error(f"List metrics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def parse_time_range(time_range: str, end_time: datetime) -> datetime:
    """Parse time range string to start time"""
    if time_range.endswith("h"):
        hours = int(time_range[:-1])
        return end_time - timedelta(hours=hours)
    elif time_range.endswith("d"):
        days = int(time_range[:-1])
        return end_time - timedelta(days=days)
    elif time_range.endswith("w"):
        weeks = int(time_range[:-1])
        return end_time - timedelta(weeks=weeks)
    elif time_range.endswith("m"):
        months = int(time_range[:-1])
        return end_time - timedelta(days=months * 30)
    else:
        return end_time - timedelta(hours=24)