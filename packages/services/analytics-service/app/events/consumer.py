"""
Kafka Consumer for metrics events
"""

import asyncio
import json
from typing import Optional
from datetime import datetime
from structlog import get_logger

from aiokafka import AIOKafkaConsumer

from app.config import settings
from app.database import insert_metric

logger = get_logger()


class KafkaConsumer:
    """Kafka consumer for analytics metrics"""

    def __init__(self, brokers: str, topic_prefix: str):
        self.brokers = brokers.split(",")
        self.topic_prefix = topic_prefix
        self.consumer: Optional[AIOKafkaConsumer] = None

    async def start(self):
        """Start the consumer"""
        topics = [
            f"{self.topic_prefix}-user-events",
            f"{self.topic_prefix}-booking-events",
            f"{self.topic_prefix}-session-events",
            f"{self.topic_prefix}-payment-events",
            f"{self.topic_prefix}-feedback-events",
        ]

        self.consumer = AIOKafkaConsumer(
            *topics,
            bootstrap_servers=self.brokers,
            group_id="analytics-service",
            auto_offset_reset="latest",
        )

        await self.consumer.start()
        logger.info(f"Kafka consumer started for topics: {topics}")

        try:
            async for msg in self.consumer:
                await self.process_message(msg)
        finally:
            await self.consumer.stop()

    async def stop(self):
        """Stop the consumer"""
        if self.consumer:
            await self.consumer.stop()

    async def process_message(self, msg):
        """Process incoming message"""
        try:
            event = json.loads(msg.value)
            event_type = event.get("eventType", "")
            data = event.get("data", {})

            logger.info(f"Processing metric event: {event_type}")

            # Extract and record metrics
            await self.record_metric_from_event(event_type, data)

        except Exception as e:
            logger.error(f"Error processing message: {e}")

    async def record_metric_from_event(self, event_type: str, data: dict):
        """Record metrics from event"""

        # User events
        if event_type == "user.registered":
            await insert_metric("users.total", "counter", 1, datetime.utcnow())
            await insert_metric("users.new", "counter", 1, datetime.utcnow())

        elif event_type == "user.login":
            await insert_metric("users.login", "counter", 1, datetime.utcnow(),
                dimensions={"user_id": data.get("userId")})

        # Booking events
        elif event_type == "booking.created":
            await insert_metric("bookings.total", "counter", 1, datetime.utcnow())
            await insert_metric("bookings.new", "counter", 1, datetime.utcnow(),
                dimensions={"consultant_id": data.get("consultantId")})

        elif event_type == "booking.cancelled":
            await insert_metric("bookings.cancelled", "counter", 1, datetime.utcnow())

        # Session events
        elif event_type == "session.started":
            await insert_metric("sessions.active", "gauge", 1, datetime.utcnow())
            await insert_metric("sessions.total", "counter", 1, datetime.utcnow())

        elif event_type == "session.ended":
            await insert_metric("sessions.active", "gauge", -1, datetime.utcnow())
            await insert_metric("sessions.completed", "counter", 1, datetime.utcnow())
            duration = data.get("durationMinutes", 0)
            await insert_metric("sessions.duration", "timer", duration, datetime.utcnow())

        # Payment events
        elif event_type == "payment.completed":
            amount = data.get("amount", 0)
            await insert_metric("revenue.session", "counter", amount, datetime.utcnow())
            await insert_metric("revenue.daily", "counter", amount, datetime.utcnow())
            await insert_metric("payments.completed", "counter", 1, datetime.utcnow())

        elif event_type == "payment.failed":
            await insert_metric("payments.failed", "counter", 1, datetime.utcnow())

        elif event_type == "payment.refunded":
            await insert_metric("payments.refunded", "counter", 1, datetime.utcnow())
            amount = data.get("refundAmount", 0)
            await insert_metric("revenue.refunded", "counter", amount, datetime.utcnow())

        # Feedback events
        elif event_type == "feedback.submitted":
            rating = data.get("rating", 0)
            await insert_metric("rating.session", "gauge", rating, datetime.utcnow())
            await insert_metric("feedback.count", "counter", 1, datetime.utcnow())

        # Consultant events
        elif event_type == "consultant.registered":
            await insert_metric("consultants.total", "counter", 1, datetime.utcnow())
            await insert_metric("consultants.new", "counter", 1, datetime.utcnow())

        elif event_type == "consultant.activated":
            await insert_metric("consultants.active", "gauge", 1, datetime.utcnow())

        # Subscription events
        elif event_type == "subscription.created":
            await insert_metric("subscriptions.total", "counter", 1, datetime.utcnow())
            await insert_metric("subscriptions.new", "counter", 1, datetime.utcnow())

        elif event_type == "subscription.cancelled":
            await insert_metric("subscriptions.cancelled", "counter", 1, datetime.utcnow())