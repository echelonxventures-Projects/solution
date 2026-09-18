"""
Pydantic Models for Analytics Service
"""

from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class MetricType(str, Enum):
    """Types of metrics"""
    COUNTER = "counter"       # Counting events (registrations, bookings)
    GAUGE = "gauge"           # Current value (active sessions)
    HISTOGRAM = "histogram"   # Distribution (session durations)
    TIMER = "timer"           # Time measurements


class TimeGranularity(str, Enum):
    """Time granularity for aggregation"""
    MINUTE = "minute"
    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"


class MetricRecord(BaseModel):
    """Single metric record"""
    metric_name: str
    metric_type: MetricType
    value: float
    timestamp: datetime
    dimensions: Optional[Dict[str, str]] = None
    metadata: Optional[Dict[str, Any]] = None


class MetricQuery(BaseModel):
    """Query for metrics"""
    metric_name: str = Field(..., description="Metric to query")
    start_time: datetime = Field(..., description="Start time")
    end_time: datetime = Field(..., description="End time")
    granularity: TimeGranularity = Field(default=TimeGranularity.HOUR)
    dimensions: Optional[Dict[str, str]] = None
    aggregation: str = Field(default="avg", description="sum, avg, min, max, count")


class MetricResponse(BaseModel):
    """Response for metric query"""
    metric_name: str
    granularity: str
    data_points: List[Dict[str, Any]]
    total_points: int
    aggregated_value: Optional[float] = None


class DashboardWidget(BaseModel):
    """Dashboard widget definition"""
    id: str
    title: str
    widget_type: str  # chart, table, metric, gauge
    metrics: List[str]
    dimensions: Optional[Dict[str, str]] = None
    time_range: str = "24h"
    refresh_interval: int = 30
    config: Optional[Dict[str, Any]] = None


class Dashboard(BaseModel):
    """Dashboard definition"""
    id: str
    name: str
    description: Optional[str] = None
    widgets: List[DashboardWidget]
    layout: Dict[str, Any]
    filters: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class DashboardData(BaseModel):
    """Dashboard data response"""
    dashboard_id: str
    widget_data: Dict[str, Any]
    timestamp: datetime


class ReportRequest(BaseModel):
    """Request to generate report"""
    report_type: str = Field(..., description="Type of report")
    time_range: str = Field(..., description="Time range")
    filters: Optional[Dict[str, Any]] = None
    format: str = Field(default="pdf", description="Output format")
    include_charts: bool = Field(default=True)


class Report(BaseModel):
    """Generated report"""
    id: str
    report_type: str
    time_range: str
    generated_at: datetime
    format: str
    file_path: Optional[str] = None
    download_url: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None


class PredictionRequest(BaseModel):
    """Request for prediction"""
    metric_name: str
    forecast_days: int = Field(default=30)
    confidence_level: float = Field(default=0.95)
    historical_data: Optional[List[float]] = None


class PredictionResult(BaseModel):
    """Prediction result"""
    metric_name: str
    forecast: List[Dict[str, Any]]  # [{date, value, lower_bound, upper_bound}]
    confidence_level: float
    trend: str
    model_type: str
    accuracy_score: Optional[float] = None
    generated_at: datetime


class AggregatedMetric(BaseModel):
    """Pre-aggregated metric"""
    metric_name: str
    granularity: str
    time_bucket: datetime
    value: float
    dimensions: Dict[str, str]
    count: int


class KPI(BaseModel):
    """Key Performance Indicator"""
    name: str
    current_value: float
    previous_value: Optional[float] = None
    change_percent: Optional[float] = None
    trend: str  # up, down, stable
    target: Optional[float] = None
    status: str  # good, warning, critical
    unit: str


class PlatformStats(BaseModel):
    """Overall platform statistics"""
    total_users: int
    total_consultants: int
    total_bookings: int
    total_sessions: int
    total_revenue: float
    active_sessions: int
    avg_session_duration: float
    avg_rating: float
    platform_growth_rate: float
    timestamp: datetime