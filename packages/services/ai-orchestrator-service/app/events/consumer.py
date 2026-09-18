"""
Kafka Consumer for processing events
"""

import asyncio
import json
from typing import Optional
from structlog import get_logger

from aiokafka import AIOKafkaConsumer

from app.config import settings
from app.llm.clients import get_llm_client

logger = get_logger()


class KafkaConsumer:
    """Kafka consumer for AI orchestrator"""

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
            f"{self.topic_prefix}-feedback-events",
        ]

        self.consumer = AIOKafkaConsumer(
            *topics,
            bootstrap_servers=self.brokers,
            group_id="ai-orchestrator-service",
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

            logger.info(f"Processing event: {event_type}")

            # Route to appropriate handler
            handler = self.get_handler(event_type)
            if handler:
                await handler(event)

        except Exception as e:
            logger.error(f"Error processing message: {e}")

    def get_handler(self, event_type: str):
        """Get handler for event type"""
        handlers = {
            "user.registered": self.handle_user_registered,
            "booking.created": self.handle_booking_created,
            "session.started": self.handle_session_started,
            "session.ended": self.handle_session_ended,
            "feedback.submitted": self.handle_feedback,
        }
        return handlers.get(event_type)

    async def handle_user_registered(self, event: dict):
        """Handle user registration event"""
        data = event.get("data", {})
        user_id = data.get("userId")

        logger.info(f"User registered: {user_id}")

        # Could trigger welcome message generation or profile analysis
        # For now, just log

    async def handle_booking_created(self, event: dict):
        """Handle booking created event"""
        data = event.get("data", {})
        booking_id = data.get("bookingId")
        consultant_id = data.get("consultantId")
        seeker_id = data.get("seekerId")

        logger.info(f"Booking created: {booking_id}")

        # Generate preparation suggestions for consultant
        # This would integrate with the copilot agent

    async def handle_session_started(self, event: dict):
        """Handle session started event"""
        data = event.get("data", {})
        session_id = data.get("sessionId")

        logger.info(f"Session started: {session_id}")

        # Initialize session context
        # Could preload relevant information

    async def handle_session_ended(self, event: dict):
        """Handle session ended event"""
        data = event.get("data", {})
        session_id = data.get("sessionId")

        logger.info(f"Session ended: {session_id}")

        # Trigger summarization
        # This would integrate with the summarization service

    async def handle_feedback(self, event: dict):
        """Handle feedback event"""
        data = event.get("data", {})
        feedback_id = data.get("feedbackId")
        rating = data.get("rating")
        comment = data.get("comment")

        logger.info(f"Feedback received: {feedback_id}")

        # Analyze feedback sentiment
        if comment:
            from app.agents import AnalyzerAgent

            analyzer = AnalyzerAgent()
            sentiment_result = await analyzer.analyze_sentiment(comment)

            logger.info(f"Feedback sentiment: {sentiment_result}")