"""
API Routes for Dashboards
"""

import json
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from fastapi import APIRouter, HTTPException
from structlog import get_logger

from app.models import Dashboard, DashboardWidget, DashboardData
from app.database import save_dashboard, get_dashboard, query_metrics, get_latest_metrics
from app.config import settings

logger = get_logger()
router = APIRouter()


# Default dashboards
DEFAULT_DASHBOARDS = {
    "platform": {
        "id": "platform",
        "name": "Platform Overview",
        "description": "Overall platform health and performance",
        "widgets": [
            {"id": "users_total", "title": "Total Users", "widget_type": "metric", "metrics": ["users.total"], "time_range": "24h"},
            {"id": "consultants_active", "title": "Active Consultants", "widget_type": "metric", "metrics": ["consultants.active"], "time_range": "24h"},
            {"id": "sessions_active", "title": "Active Sessions", "widget_type": "gauge", "metrics": ["sessions.active"], "time_range": "1h"},
            {"id": "revenue_chart", "title": "Revenue Trend", "widget_type": "chart", "metrics": ["revenue.daily"], "time_range": "7d"},
            {"id": "rating_chart", "title": "Ratings Distribution", "widget_type": "chart", "metrics": ["rating.session"], "time_range": "30d"},
        ],
        "layout": {"columns": 3, "rows": 2},
    },
    "consultant": {
        "id": "consultant",
        "name": "Consultant Dashboard",
        "description": "Consultant performance metrics",
        "widgets": [
            {"id": "sessions_completed", "title": "Sessions Completed", "widget_type": "metric", "metrics": ["consultant.sessions"], "time_range": "30d"},
            {"id": "earnings", "title": "Earnings", "widget_type": "metric", "metrics": ["consultant.earnings"], "time_range": "30d"},
            {"id": "rating_avg", "title": "Average Rating", "widget_type": "gauge", "metrics": ["consultant.rating"], "time_range": "30d"},
            {"id": "hours_chart", "title": "Session Hours", "widget_type": "chart", "metrics": ["consultant.hours"], "time_range": "30d"},
        ],
        "layout": {"columns": 2, "rows": 2},
    },
    "seeker": {
        "id": "seeker",
        "name": "Seeker Dashboard",
        "description": "User engagement metrics",
        "widgets": [
            {"id": "sessions_booked", "title": "Sessions Booked", "widget_type": "metric", "metrics": ["seeker.bookings"], "time_range": "30d"},
            {"id": "spent", "title": "Amount Spent", "widget_type": "metric", "metrics": ["seeker.spent"], "time_range": "30d"},
            {"id": "ratings_given", "title": "Ratings Given", "widget_type": "chart", "metrics": ["seeker.ratings"], "time_range": "30d"},
        ],
        "layout": {"columns": 2, "rows": 2},
    },
}


@router.get("/")
async def list_dashboards():
    """
    List all available dashboards
    """
    return {
        "dashboards": list(DEFAULT_DASHBOARDS.keys()),
        "total": len(DEFAULT_DASHBOARDS),
    }


@router.get("/{dashboard_id}")
async def get_dashboard_config(dashboard_id: str):
    """
    Get dashboard configuration
    """
    try:
        # Check default dashboards first
        if dashboard_id in DEFAULT_DASHBOARDS:
            config = DEFAULT_DASHBOARDS[dashboard_id]
            return Dashboard(
                id=config["id"],
                name=config["name"],
                description=config.get("description"),
                widgets=[DashboardWidget(**w) for w in config["widgets"]],
                layout=config["layout"],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

        # Check saved dashboards
        saved = await get_dashboard(dashboard_id)
        if saved:
            return Dashboard(**saved)

        raise HTTPException(status_code=404, detail="Dashboard not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard config error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{dashboard_id}/data")
async def get_dashboard_data(dashboard_id: str):
    """
    Get data for all widgets in a dashboard
    """
    try:
        # Get dashboard config
        config = DEFAULT_DASHBOARDS.get(dashboard_id)
        if not config:
            saved = await get_dashboard(dashboard_id)
            if saved:
                config = saved

        if not config:
            raise HTTPException(status_code=404, detail="Dashboard not found")

        # Get data for each widget
        widget_data = {}

        for widget in config["widgets"]:
            widget_id = widget["id"]
            metrics = widget.get("metrics", [])
            time_range = widget.get("time_range", "24h")
            widget_type = widget.get("widget_type", "metric")

            end_time = datetime.utcnow()
            start_time = parse_time_range(time_range, end_time)

            # Get data based on widget type
            if widget_type == "metric":
                # Single value
                latest = await get_latest_metrics(metrics)
                widget_data[widget_id] = {
                    "type": "metric",
                    "values": latest,
                    "timestamp": end_time,
                }

            elif widget_type == "gauge":
                # Current value with thresholds
                latest = await get_latest_metrics(metrics)
                value = list(latest.values())[0] if latest else 0
                widget_data[widget_id] = {
                    "type": "gauge",
                    "value": value,
                    "min": 0,
                    "max": 100,  # Default max
                    "thresholds": {"warning": 50, "critical": 25},
                }

            elif widget_type == "chart":
                # Time series data
                for metric in metrics:
                    data = await query_metrics(
                        metric_name=metric,
                        start_time=start_time,
                        end_time=end_time,
                        granularity="hour",
                        aggregation="avg",
                    )
                    widget_data[widget_id] = {
                        "type": "chart",
                        "series": [{
                            "name": metric,
                            "data": data,
                        }],
                        "time_range": time_range,
                    }

            elif widget_type == "table":
                # Tabular data (simplified)
                widget_data[widget_id] = {
                    "type": "table",
                    "rows": [],
                    "columns": metrics,
                }

        return DashboardData(
            dashboard_id=dashboard_id,
            widget_data=widget_data,
            timestamp=datetime.utcnow(),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_dashboard(dashboard: Dashboard):
    """
    Create a new custom dashboard
    """
    try:
        await save_dashboard({
            "id": dashboard.id,
            "name": dashboard.name,
            "description": dashboard.description,
            "widgets": [w.dict() for w in dashboard.widgets],
            "layout": dashboard.layout,
            "filters": {},
        })

        return {"created": True, "dashboard_id": dashboard.id}

    except Exception as e:
        logger.error(f"Dashboard creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{dashboard_id}")
async def update_dashboard(dashboard_id: str, dashboard: Dashboard):
    """
    Update existing dashboard
    """
    try:
        await save_dashboard({
            "id": dashboard_id,
            "name": dashboard.name,
            "description": dashboard.description,
            "widgets": [w.dict() for w in dashboard.widgets],
            "layout": dashboard.layout,
            "filters": {},
        })

        return {"updated": True, "dashboard_id": dashboard_id}

    except Exception as e:
        logger.error(f"Dashboard update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{dashboard_id}")
async def delete_dashboard(dashboard_id: str):
    """
    Delete a dashboard
    """
    # Only custom dashboards can be deleted
    if dashboard_id in DEFAULT_DASHBOARDS:
        raise HTTPException(status_code=400, detail="Cannot delete default dashboard")

    from app.database import execute_raw

    try:
        await execute_raw("DELETE FROM dashboards WHERE id = $1", dashboard_id)
        return {"deleted": True, "dashboard_id": dashboard_id}

    except Exception as e:
        logger.error(f"Dashboard delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/widget/{widget_type}/preview")
async def preview_widget(widget_type: str, metric: str, time_range: str = "24h"):
    """
    Preview a widget with sample data
    """
    try:
        end_time = datetime.utcnow()
        start_time = parse_time_range(time_range, end_time)

        if widget_type == "chart":
            data = await query_metrics(
                metric_name=metric,
                start_time=start_time,
                end_time=end_time,
                granularity="hour",
            )
            return {"type": "chart", "data": data}

        elif widget_type == "metric":
            latest = await get_latest_metrics([metric])
            return {"type": "metric", "value": latest.get(metric, 0)}

        elif widget_type == "gauge":
            latest = await get_latest_metrics([metric])
            return {
                "type": "gauge",
                "value": latest.get(metric, 0),
                "min": 0,
                "max": 100,
            }

        else:
            return {"type": widget_type, "preview": True}

    except Exception as e:
        logger.error(f"Widget preview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def parse_time_range(time_range: str, end_time: datetime) -> datetime:
    """Parse time range to start time"""
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