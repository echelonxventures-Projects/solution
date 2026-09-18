"""
API Routes for Predictive Analytics
"""

import json
import numpy as np
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from fastapi import APIRouter, HTTPException
from structlog import get_logger

from app.models import PredictionRequest, PredictionResult
from app.database import query_metrics
from app.config import settings

logger = get_logger()
router = APIRouter()


@router.post("/", response_model=PredictionResult)
async def generate_prediction(request: PredictionRequest):
    """
    Generate predictions for a metric

    Uses time series forecasting to predict future values
    """
    if not settings.ANALYTICS_PREDICTION_ENABLED:
        raise HTTPException(status_code=503, detail="Predictions disabled")

    try:
        # Get historical data
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=90)  # 90 days of history

        historical = await query_metrics(
            metric_name=request.metric_name,
            start_time=start_time,
            end_time=end_time,
            granularity="day",
            aggregation="avg",
        )

        if len(historical) < settings.PREDICTION_MIN_DATA_POINTS:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough data points ({len(historical)}). Need at least {settings.PREDICTION_MIN_DATA_POINTS}"
            )

        # Extract values
        values = [d.get("value", 0) for d in historical]
        dates = [d.get("bucket", end_time) for d in historical]

        # Generate forecast using simple methods
        forecast = await generate_forecast(
            values=values,
            dates=dates,
            forecast_days=request.forecast_days,
            confidence_level=request.confidence_level,
        )

        # Analyze trend
        trend = analyze_trend(values)

        return PredictionResult(
            metric_name=request.metric_name,
            forecast=forecast,
            confidence_level=request.confidence_level,
            trend=trend,
            model_type="linear_regression",
            accuracy_score=None,
            generated_at=datetime.utcnow(),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/demand")
async def predict_demand(vertical: Optional[str] = None, forecast_days: int = 30):
    """
    Predict demand for consultations
    """
    try:
        # Get booking data
        metric_name = "bookings.total"
        if vertical:
            # Would need vertical-specific metrics
            pass

        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=90)

        historical = await query_metrics(
            metric_name=metric_name,
            start_time=start_time,
            end_time=end_time,
            granularity="day",
            aggregation="sum",
        )

        values = [d.get("value", 0) for d in historical]

        # Generate forecast
        forecast = await generate_forecast(values, [], forecast_days, 0.95)

        # Peak predictions
        peak_days = predict_peak_days(forecast)

        return {
            "vertical": vertical,
            "forecast_days": forecast_days,
            "forecast": forecast,
            "peak_days": peak_days,
            "total_predicted": sum(f["value"] for f in forecast),
        }

    except Exception as e:
        logger.error(f"Demand prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/revenue")
async def predict_revenue(forecast_days: int = 30):
    """
    Predict future revenue
    """
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=90)

        historical = await query_metrics(
            metric_name="revenue.daily",
            start_time=start_time,
            end_time=end_time,
            granularity="day",
            aggregation="sum",
        )

        values = [d.get("value", 0) for d in historical]

        forecast = await generate_forecast(values, [], forecast_days, 0.95)

        total_predicted = sum(f["value"] for f in forecast)

        return {
            "forecast_days": forecast_days,
            "forecast": forecast,
            "total_predicted_revenue": total_predicted,
            "confidence_level": 0.95,
        }

    except Exception as e:
        logger.error(f"Revenue prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/consultant-performance/{consultant_id}")
async def predict_consultant_performance(consultant_id: str, forecast_days: int = 30):
    """
    Predict consultant performance
    """
    try:
        # Would query consultant-specific metrics
        # For now, return placeholder
        return {
            "consultant_id": consultant_id,
            "predictions": {
                "sessions": 15,
                "earnings": 1500,
                "rating": 4.8,
            },
            "trend": "up",
            "recommendations": [
                "Consider increasing rates",
                "Expand to new verticals",
            ],
        }

    except Exception as e:
        logger.error(f"Consultant prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/anomalies")
async def detect_anomalies(metric_name: str = "revenue.daily", threshold: float = 2.0):
    """
    Detect anomalies in metric data
    """
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=30)

        historical = await query_metrics(
            metric_name=metric_name,
            start_time=start_time,
            end_time=end_time,
            granularity="day",
            aggregation="avg",
        )

        values = [d.get("value", 0) for d in historical]
        dates = [d.get("bucket", end_time) for d in historical]

        # Calculate statistics
        mean = np.mean(values)
        std = np.std(values)

        # Find anomalies
        anomalies = []
        for i, (date, value) in enumerate(zip(dates, values)):
            deviation = abs(value - mean) / std if std > 0 else 0

            if deviation > threshold:
                anomalies.append({
                    "date": date.isoformat() if hasattr(date, 'isoformat') else str(date),
                    "value": value,
                    "deviation": deviation,
                    "expected_range": {
                        "lower": mean - threshold * std,
                        "upper": mean + threshold * std,
                    },
                })

        return {
            "metric_name": metric_name,
            "threshold": threshold,
            "anomalies": anomalies,
            "stats": {
                "mean": mean,
                "std": std,
                "min": min(values),
                "max": max(values),
            },
        }

    except Exception as e:
        logger.error(f"Anomaly detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Helper functions
async def generate_forecast(
    values: List[float],
    dates: List,
    forecast_days: int,
    confidence_level: float,
) -> List[Dict]:
    """Generate forecast using simple linear regression"""
    if not values:
        return []

    # Simple linear regression
    n = len(values)
    x = np.arange(n)
    y = np.array(values)

    # Calculate regression coefficients
    if n > 1:
        slope, intercept = np.polyfit(x, y, 1)
    else:
        slope, intercept = 0, values[0]

    # Generate forecast
    forecast = []
    last_date = dates[-1] if dates else datetime.utcnow()

    for i in range(forecast_days):
        forecast_date = last_date + timedelta(days=i+1)
        predicted_value = intercept + slope * (n + i)

        # Calculate confidence bounds
        residuals = y - (slope * x + intercept)
        std_error = np.std(residuals) if len(residuals) > 1 else 0

        z = 1.96 if confidence_level >= 0.95 else 1.645  # z-score for confidence level

        lower_bound = predicted_value - z * std_error
        upper_bound = predicted_value + z * std_error

        forecast.append({
            "date": forecast_date.isoformat() if hasattr(forecast_date, 'isoformat') else str(forecast_date),
            "value": round(predicted_value, 2),
            "lower_bound": round(lower_bound, 2),
            "upper_bound": round(upper_bound, 2),
        })

    return forecast


def analyze_trend(values: List[float]) -> str:
    """Analyze trend direction"""
    if len(values) < 2:
        return "stable"

    recent = values[-7:] if len(values) >= 7 else values[-3:]
    older = values[:-7] if len(values) >= 14 else values[:-3]

    if not older:
        return "stable"

    recent_avg = np.mean(recent)
    older_avg = np.mean(older)

    change = (recent_avg - older_avg) / older_avg if older_avg != 0 else 0

    if change > 0.1:
        return "up"
    elif change < -0.1:
        return "down"
    else:
        return "stable"


def predict_peak_days(forecast: List[Dict]) -> List[str]:
    """Predict peak demand days"""
    if not forecast:
        return []

    # Find days with highest predicted values
    sorted_forecast = sorted(forecast, key=lambda x: x["value"], reverse=True)
    peak_days = sorted_forecast[:5]

    return [d["date"] for d in peak_days]