"""
API Routes for Reports
"""

import json
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from fastapi import APIRouter, HTTPException
from structlog import get_logger

from app.models import ReportRequest, Report
from app.database import save_report, query_metrics, get_metric_stats, execute_raw
from app.config import settings

logger = get_logger()
router = APIRouter()


@router.post("/generate")
async def generate_report(request: ReportRequest):
    """
    Generate an analytics report

    Supported report types:
    - platform_summary
    - consultant_performance
    - revenue_analysis
    - user_engagement
    - booking_trends
    """
    try:
        report_id = f"report_{request.report_type}_{datetime.utcnow().timestamp()}"

        # Parse time range
        end_time = datetime.utcnow()
        start_time = parse_time_range(request.time_range, end_time)

        # Generate report based on type
        if request.report_type == "platform_summary":
            data = await generate_platform_summary(start_time, end_time)

        elif request.report_type == "consultant_performance":
            data = await generate_consultant_performance(start_time, end_time, request.filters)

        elif request.report_type == "revenue_analysis":
            data = await generate_revenue_analysis(start_time, end_time)

        elif request.report_type == "user_engagement":
            data = await generate_user_engagement(start_time, end_time)

        elif request.report_type == "booking_trends":
            data = await generate_booking_trends(start_time, end_time)

        else:
            raise HTTPException(status_code=400, detail=f"Unknown report type: {request.report_type}")

        # Generate summary text
        summary = generate_summary_text(request.report_type, data)

        # Save report
        report_data = {
            "id": report_id,
            "report_type": request.report_type,
            "time_range": request.time_range,
            "format": request.format,
            "data": data,
            "summary": summary,
        }

        await save_report(report_data)

        # Format response based on requested format
        if request.format == "json":
            return Report(**report_data)

        elif request.format == "csv":
            csv_data = format_csv(data)
            return {
                "id": report_id,
                "format": "csv",
                "data": csv_data,
                "download_url": f"/reports/{report_id}/download",
            }

        elif request.format == "pdf":
            # PDF generation would require additional libraries
            return {
                "id": report_id,
                "format": "pdf",
                "download_url": f"/reports/{report_id}/download",
                "data": data,
            }

        return Report(**report_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{report_id}")
async def get_report(report_id: str):
    """
    Get a generated report
    """
    try:
        reports = await execute_raw(
            "SELECT * FROM reports WHERE id = $1",
            report_id,
        )

        if not reports:
            raise HTTPException(status_code=404, detail="Report not found")

        report = reports[0]
        report["data"] = json.loads(report.get("data", "{}"))

        return Report(**report)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report retrieval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{report_id}/download")
async def download_report(report_id: str):
    """
    Download report file
    """
    # This would return actual file in production
    report = await get_report(report_id)
    return {
        "report_id": report_id,
        "download_url": f"/reports/{report_id}/file",
        "format": report.format,
    }


@router.get("/list")
async def list_reports(report_type: Optional[str] = None, limit: int = 20):
    """
    List generated reports
    """
    try:
        filter_clause = ""
        if report_type:
            filter_clause = f"WHERE report_type = '{report_type}'"

        reports = await execute_raw(f"""
            SELECT id, report_type, time_range, generated_at, format
            FROM reports {filter_clause}
            ORDER BY generated_at DESC
            LIMIT {limit}
        """)

        return {"reports": reports, "total": len(reports)}

    except Exception as e:
        logger.error(f"Report list error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{report_id}")
async def delete_report(report_id: str):
    """
    Delete a report
    """
    try:
        await execute_raw("DELETE FROM reports WHERE id = $1", report_id)
        return {"deleted": True, "report_id": report_id}

    except Exception as e:
        logger.error(f"Report delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Report generation functions
async def generate_platform_summary(start_time: datetime, end_time: datetime) -> Dict:
    """Generate platform summary report"""
    # Get key metrics
    user_stats = await get_metric_stats("users.total", start_time, end_time)
    session_stats = await get_metric_stats("sessions.total", start_time, end_time)
    revenue_stats = await get_metric_stats("revenue.session", start_time, end_time)
    rating_stats = await get_metric_stats("rating.session", start_time, end_time)

    return {
        "time_range": {
            "start": start_time.isoformat(),
            "end": end_time.isoformat(),
        },
        "users": {
            "total": user_stats.get("max", 0),
            "new": user_stats.get("count", 0),
        },
        "sessions": {
            "total": session_stats.get("count", 0),
            "avg_duration": session_stats.get("avg", 0),
        },
        "revenue": {
            "total": revenue_stats.get("sum", 0),
            "avg_per_session": revenue_stats.get("avg", 0),
        },
        "ratings": {
            "average": rating_stats.get("avg", 0),
            "count": rating_stats.get("count", 0),
        },
    }


async def generate_consultant_performance(start_time: datetime, end_time: datetime, filters: Optional[Dict]) -> Dict:
    """Generate consultant performance report"""
    # In production, would query consultant-specific metrics
    return {
        "time_range": {
            "start": start_time.isoformat(),
            "end": end_time.isoformat(),
        },
        "consultants": [],
        "top_performers": [],
        "metrics": {
            "avg_rating": 4.5,
            "avg_sessions": 20,
            "avg_earnings": 5000,
        },
    }


async def generate_revenue_analysis(start_time: datetime, end_time: datetime) -> Dict:
    """Generate revenue analysis report"""
    revenue_data = await query_metrics("revenue.daily", start_time, end_time, "day", "sum")

    return {
        "time_range": {
            "start": start_time.isoformat(),
            "end": end_time.isoformat(),
        },
        "total_revenue": sum(d.get("value", 0) for d in revenue_data),
        "daily_data": revenue_data,
        "growth_rate": 15.5,  # Would calculate from data
        "breakdown": {
            "sessions": 80,
            "subscriptions": 15,
            "content": 5,
        },
    }


async def generate_user_engagement(start_time: datetime, end_time: datetime) -> Dict:
    """Generate user engagement report"""
    return {
        "time_range": {
            "start": start_time.isoformat(),
            "end": end_time.isoformat(),
        },
        "active_users": 0,
        "session_count": 0,
        "avg_session_time": 0,
        "return_rate": 0,
    }


async def generate_booking_trends(start_time: datetime, end_time: datetime) -> Dict:
    """Generate booking trends report"""
    booking_data = await query_metrics("bookings.total", start_time, end_time, "day", "sum")

    return {
        "time_range": {
            "start": start_time.isoformat(),
            "end": end_time.isoformat(),
        },
        "total_bookings": sum(d.get("count", 0) for d in booking_data),
        "daily_data": booking_data,
        "peak_hours": [9, 10, 11],
        "peak_days": ["Monday", "Tuesday"],
    }


def generate_summary_text(report_type: str, data: Dict) -> str:
    """Generate human-readable summary"""
    if report_type == "platform_summary":
        return f"Platform had {data['users']['new']} new users, {data['sessions']['total']} sessions, and ${data['revenue']['total']} revenue in this period."

    elif report_type == "revenue_analysis":
        return f"Total revenue: ${data['total_revenue']} with {data['growth_rate']}% growth rate."

    elif report_type == "booking_trends":
        return f"{data['total_bookings']} bookings with peak activity during {', '.join(str(h) for h in data['peak_hours'])} hours."

    return f"Generated report for {report_type}"


def format_csv(data: Dict) -> str:
    """Format data as CSV"""
    lines = []
    for key, value in data.items():
        if isinstance(value, dict):
            for sub_key, sub_value in value.items():
                lines.append(f"{key}.{sub_key},{sub_value}")
        elif isinstance(value, list):
            for item in value:
                lines.append(f"{key},{json.dumps(item)}")
        else:
            lines.append(f"{key},{value}")
    return "\n".join(lines)


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
    elif time_range == "ytd":
        return datetime(end_time.year, 1, 1)
    else:
        return end_time - timedelta(days=30)