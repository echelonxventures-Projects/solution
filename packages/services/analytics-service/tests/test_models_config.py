"""
Tests for Analytics service models and configuration.
"""
from datetime import datetime

import pytest
from pydantic import ValidationError

from app.config import Settings, get_settings
from app.models import (
    AggregatedMetric,
    Dashboard,
    DashboardWidget,
    MetricQuery,
    MetricRecord,
    MetricResponse,
    MetricType,
    PredictionRequest,
    PredictionResult,
    Report,
    ReportRequest,
    TimeGranularity,
)


class TestEnums:
    def test_metric_type_values(self):
        assert MetricType.COUNTER.value == "counter"
        assert MetricType.GAUGE.value == "gauge"
        assert MetricType.HISTOGRAM.value == "histogram"
        assert MetricType.TIMER.value == "timer"

    def test_time_granularity_values(self):
        assert TimeGranularity.MINUTE.value == "minute"
        assert TimeGranularity.HOUR.value == "hour"
        assert TimeGranularity.DAY.value == "day"
        assert TimeGranularity.WEEK.value == "week"
        assert TimeGranularity.MONTH.value == "month"

    def test_enums_are_str(self):
        assert isinstance(MetricType.COUNTER, str)
        assert TimeGranularity.HOUR == "hour"


class TestMetricRecord:
    def test_valid_record(self):
        rec = MetricRecord(
            metric_name="bookings",
            metric_type=MetricType.COUNTER,
            value=42.0,
            timestamp=datetime.now(),
        )
        assert rec.metric_name == "bookings"
        assert rec.metric_type == MetricType.COUNTER
        assert rec.value == 42.0
        assert rec.dimensions is None
        assert rec.metadata is None

    def test_with_dimensions(self):
        rec = MetricRecord(
            metric_name="revenue",
            metric_type=MetricType.GAUGE,
            value=1000.0,
            timestamp=datetime.now(),
            dimensions={"vertical": "legal"},
            metadata={"source": "stripe"},
        )
        assert rec.dimensions == {"vertical": "legal"}
        assert rec.metadata == {"source": "stripe"}

    def test_missing_required_fields(self):
        with pytest.raises(ValidationError):
            MetricRecord(metric_name="x")


class TestMetricQuery:
    def test_valid_query(self):
        q = MetricQuery(
            metric_name="bookings",
            start_time=datetime.now(),
            end_time=datetime.now(),
        )
        assert q.granularity == TimeGranularity.HOUR
        assert q.aggregation == "avg"
        assert q.dimensions is None

    def test_custom_aggregation(self):
        q = MetricQuery(
            metric_name="revenue",
            start_time=datetime.now(),
            end_time=datetime.now(),
            granularity=TimeGranularity.DAY,
            aggregation="sum",
        )
        assert q.granularity == TimeGranularity.DAY
        assert q.aggregation == "sum"

    def test_missing_time_range(self):
        with pytest.raises(ValidationError):
            MetricQuery(metric_name="bookings")


class TestMetricResponse:
    def test_response(self):
        resp = MetricResponse(
            metric_name="bookings",
            granularity="hour",
            data_points=[{"t": "2026-01-01", "v": 5}],
            total_points=1,
            aggregated_value=5.0,
        )
        assert resp.metric_name == "bookings"
        assert resp.aggregated_value == 5.0
        assert len(resp.data_points) == 1


class TestDashboardModels:
    def test_widget_defaults(self):
        w = DashboardWidget(
            id="w1", title="Revenue", widget_type="chart", metrics=["revenue"]
        )
        assert w.time_range == "24h"
        assert w.refresh_interval == 30
        assert w.dimensions is None

    def test_dashboard(self):
        d = Dashboard(
            id="d1",
            name="Overview",
            widgets=[DashboardWidget(id="w1", title="X", widget_type="metric", metrics=["m"])],
            layout={},
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        assert d.name == "Overview"
        assert d.description is None
        assert len(d.widgets) == 1


class TestReportModels:
    def test_report_request_defaults(self):
        r = ReportRequest(report_type="monthly", time_range="30d")
        assert r.format == "pdf"
        assert r.include_charts is True
        assert r.filters is None

    def test_report(self):
        r = Report(
            id="r1",
            report_type="monthly",
            time_range="30d",
            generated_at=datetime.now(),
            format="csv",
        )
        assert r.file_path is None
        assert r.download_url is None
        assert r.data is None


class TestPredictionModels:
    def test_prediction_request_defaults(self):
        r = PredictionRequest(metric_name="revenue")
        assert r.forecast_days == 30
        assert r.confidence_level == 0.95
        assert r.historical_data is None

    def test_prediction_result(self):
        r = PredictionResult(
            metric_name="revenue",
            forecast=[{"date": "2026-01-01", "value": 100.0}],
            confidence_level=0.95,
            trend="up",
            model_type="prophet",
            generated_at=datetime.now(),
        )
        assert r.trend == "up"
        assert r.accuracy_score is None
        assert len(r.forecast) == 1


class TestAggregatedMetric:
    def test_record(self):
        m = AggregatedMetric(
            metric_name="revenue",
            granularity="day",
            time_bucket=datetime.now(),
            value=500.0,
            dimensions={"vertical": "tech"},
            count=10,
        )
        assert m.value == 500.0
        assert m.count == 10


class TestSettings:
    def test_defaults(self):
        settings = Settings()
        assert settings.SERVER_PORT == 3011
        assert settings.REDIS_DB == 1
        assert settings.ANALYTICS_RETENTION_DAYS == 365
        assert settings.ANALYTICS_PREDICTION_ENABLED is True
        assert settings.DASHBOARD_MAX_DATA_POINTS == 1000
        assert settings.PREDICTION_FORECAST_DAYS == 30
        assert settings.REPORT_FORMATS == "pdf,csv,json"

    def test_env_override(self, monkeypatch):
        monkeypatch.setenv("SERVER_PORT", "4011")
        monkeypatch.setenv("ANALYTICS_RETENTION_DAYS", "90")
        monkeypatch.setenv("DASHBOARD_MAX_DATA_POINTS", "500")

        settings = Settings()
        assert settings.SERVER_PORT == 4011
        assert settings.ANALYTICS_RETENTION_DAYS == 90
        assert settings.DASHBOARD_MAX_DATA_POINTS == 500

    def test_get_settings_is_cached(self):
        assert get_settings() is get_settings()
