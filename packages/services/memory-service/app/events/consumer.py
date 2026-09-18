"""
Kafka Consumer for memory updates
"""

import asyncio
import json
from typing import Optional
from structlog import get_logger

from aiokafka import AIOKafkaConsumer

from app.config import settings
from app.routes.memory import create_memory, MemoryCreate, MemoryType, MemoryPriority

logger = get_logger()


class KafkaConsumer:
    """Kafka consumer for memory service"""

    def __init__(self, brokers: str, topic_prefix: str):
        self.brokers = brokers.split(",")
        self.topic_prefix = topic_prefix
        self.consumer: Optional[AIOKafkaConsumer] = None

    async def start(self):
        """Start the consumer"""
        topics = [
            f"{self.topic_prefix}-session-events",
            f"{self.topic_prefix}-user-events",
            f"{self.topic_prefix}-booking-events",
        ]

        self.consumer = AIOKafkaConsumer(
            *topics,
            bootstrap_servers=self.brokers,
            group_id="memory-service",
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

            logger.info(f"Processing event for memory: {event_type}")

            # Route to appropriate handler
            handler = self.get_handler(event_type)
            if handler:
                await handler(event)

        except Exception as e:
            logger.error(f"Error processing message: {e}")

    def get_handler(self, event_type: str):
        """Get handler for event type"""
        handlers = {
            "session.started": self.handle_session_started,
            "session.ended": self.handle_session_ended,
            "session.message.sent": self.handle_message,
            "user.registered": self.handle_user_registered,
            "booking.created": self.handle_booking_created,
        }
        return handlers.get(event_type)

    async def handle_session_started(self, event: dict):
        """Handle session started - create episodic memory"""
        data = event.get("data", {})

        await create_memory(MemoryCreate(
            user_id=data.get("seekerId", ""),
            memory_type=MemoryType.EPISODIC,
            content=f"Started consultation session with consultant {data.get('consultantId')}",
            priority=MemoryPriority.MEDIUM,
            source="session",
            context=data,
        ))

    async def handle_session_ended(self, event: dict):
        """Handle session ended - store session summary"""
        data = event.get("data", {})

        await create_memory(MemoryCreate(
            user_id=data.get("seekerId", ""),
            memory_type=MemoryType.EPISODIC,
            content=f"Completed consultation session. Duration: {data.get('durationMinutes')} minutes",
            priority=MemoryPriority.HIGH,
            source="session",
            context=data,
        ))

    async def handle_message(self, event: dict):
        """Handle message - store conversation memory"""
        data = event.get("data", {})

        await create_memory(MemoryCreate(
            user_id=data.get("senderId", ""),
            memory_type=MemoryType.CONVERSATION,
            content=data.get("content", ""),
            priority=MemoryPriority.LOW,
            source="chat",
            context=data,
        ))

    async def handle_user_registered(self, event: dict):
        """Handle user registration - create profile memory"""
        data = event.get("data", {})

        await create_memory(MemoryCreate(
            user_id=data.get("userId", ""),
            memory_type=MemoryType.USER_PROFILE,
            content=f"User registered: {json.dumps(data)}",
            priority=MemoryPriority.HIGH,
            source="registration",
            context=data,
        ))

    async def handle_booking_created(self, event: dict):
        """Handle booking - create episodic memory"""
        data = event.get("data", {})

        await create_memory(MemoryCreate(
            user_id=data.get("seekerId", ""),
            memory_type=MemoryType.EPISODIC,
            content=f"Booked session with consultant {data.get('consultantId')} for {data.get('scheduledStart')}",
            priority=MemoryPriority.MEDIUM,
            source="booking",
            context=data,
        ))