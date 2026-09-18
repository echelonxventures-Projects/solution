import { Kafka, Producer, Consumer, Admin } from 'kafkajs';
import { logger } from '../utils/logger';
import { PlatformEvent, EventPayload } from '../types';

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  groupId?: string;
}

const defaultConfig: KafkaConfig = {
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  clientId: process.env.KAFKA_CLIENT_ID || 'consultancy-platform',
  groupId: process.env.KAFKA_GROUP_ID || 'consultancy-group',
};

export class EventBus {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();
  private admin: Admin | null = null;
  private static instance: EventBus;

  private constructor(config: KafkaConfig = defaultConfig) {
    this.kafka = new Kafka({
      brokers: config.brokers,
      clientId: config.clientId,
    });
  }

  public static getInstance(config?: KafkaConfig): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus(config);
    }
    return EventBus.instance;
  }

  /**
   * Initialize producer
   */
  public async initProducer(): Promise<void> {
    if (!this.producer) {
      this.producer = this.kafka.producer({
        maxInFlightRequests: 5,
        idempotent: true,
      });
      await this.producer.connect();
      logger.info('Kafka producer connected');
    }
  }

  /**
   * Publish event
   */
  public async publish<T = unknown>(
    topic: string,
    payload: EventPayload<T>
  ): Promise<void> {
    if (!this.producer) {
      await this.initProducer();
    }

    const data = payload.data as { id?: string | number } | null | undefined;

    await this.producer!.send({
      topic,
      messages: [
        {
          key: (data && data.id != null ? String(data.id) : undefined) || `${payload.timestamp}`,
          value: JSON.stringify(payload),
          headers: {
            eventType: payload.eventType,
            source: payload.source,
          },
        },
      ],
    });

    logger.debug('Event published', { topic, eventType: payload.eventType });
  }

  /**
   * Create consumer for topic
   */
  public async createConsumer(
    topic: string,
    groupId: string = defaultConfig.groupId!,
    fromBeginning: boolean = false
  ): Promise<Consumer> {
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning });
    this.consumers.set(topic, consumer);
    logger.info('Kafka consumer created', { topic, groupId });
    return consumer;
  }

  /**
   * Subscribe to events
   */
  public async subscribe<T = unknown>(
    topic: string,
    handler: (payload: EventPayload<T>) => Promise<void>,
    groupId?: string
  ): Promise<void> {
    const consumer = await this.createConsumer(
      topic,
      groupId || `${defaultConfig.groupId}-${topic}`
    );

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const payload = JSON.parse(message.value?.toString() || '') as EventPayload<T>;
          await handler(payload);
          logger.debug('Event processed', { topic, eventType: payload.eventType });
        } catch (error) {
          logger.error('Event processing error', error, { topic });
        }
      },
    });
  }

  /**
   * Initialize admin client
   */
  public async initAdmin(): Promise<void> {
    if (!this.admin) {
      this.admin = this.kafka.admin();
      await this.admin.connect();
      logger.info('Kafka admin connected');
    }
  }

  /**
   * Create topics
   */
  public async createTopics(
    topics: { topic: string; partitions?: number; replicas?: number }[]
  ): Promise<void> {
    if (!this.admin) {
      await this.initAdmin();
    }

    await this.admin!.createTopics({
      topics: topics.map((t) => ({
        topic: t.topic,
        numPartitions: t.partitions || 3,
        replicationFactor: t.replicas || 1,
      })),
      waitForLeaders: true,
    });

    logger.info('Topics created', { topics: topics.map((t) => t.topic) });
  }

  /**
   * List existing topics
   */
  public async listTopics(): Promise<string[]> {
    if (!this.admin) {
      await this.initAdmin();
    }
    return this.admin!.listTopics();
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.admin) {
        await this.initAdmin();
      }
      await this.admin!.listTopics();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Disconnect all connections
   */
  public async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
    }
    for (const consumer of this.consumers.values()) {
      await consumer.disconnect();
    }
    if (this.admin) {
      await this.admin.disconnect();
    }
    logger.info('Event bus disconnected');
  }
}

// Event topic mapping
export const EventTopics: Record<string, string> = {
  USER: 'user-events',
  CONSULTANT: 'consultant-events',
  BOOKING: 'booking-events',
  SESSION: 'session-events',
  PAYMENT: 'payment-events',
  AI: 'ai-events',
  NOTIFICATION: 'notification-events',
  MEMORY: 'memory-events',
};

// Helper functions (best-effort: event failures are logged, never break request flows)

export async function publishUserEvent<T>(
  eventType: PlatformEvent,
  data: T,
  source: string
): Promise<void> {
  const bus = EventBus.getInstance();
  try {
    await bus.publish(EventTopics.USER, {
      eventType,
      timestamp: new Date(),
      source,
      data,
    });
  } catch (error) {
    logger.warn('Failed to publish user event (non-fatal)', { eventType, source, error });
  }
}

export async function publishConsultantEvent<T>(
  eventType: PlatformEvent,
  data: T,
  source: string
): Promise<void> {
  const bus = EventBus.getInstance();
  try {
    await bus.publish(EventTopics.CONSULTANT, {
      eventType,
      timestamp: new Date(),
      source,
      data,
    });
  } catch (error) {
    logger.warn('Failed to publish consultant event (non-fatal)', { eventType, source, error });
  }
}

export async function publishBookingEvent<T>(
  eventType: PlatformEvent,
  data: T,
  source: string
): Promise<void> {
  const bus = EventBus.getInstance();
  try {
    await bus.publish(EventTopics.BOOKING, {
      eventType,
      timestamp: new Date(),
      source,
      data,
    });
  } catch (error) {
    logger.warn('Failed to publish booking event (non-fatal)', { eventType, source, error });
  }
}

export async function publishSessionEvent<T>(
  eventType: PlatformEvent,
  data: T,
  source: string
): Promise<void> {
  const bus = EventBus.getInstance();
  try {
    await bus.publish(EventTopics.SESSION, {
      eventType,
      timestamp: new Date(),
      source,
      data,
    });
  } catch (error) {
    logger.warn('Failed to publish session event (non-fatal)', { eventType, source, error });
  }
}

export async function publishPaymentEvent<T>(
  eventType: PlatformEvent,
  data: T,
  source: string
): Promise<void> {
  const bus = EventBus.getInstance();
  try {
    await bus.publish(EventTopics.PAYMENT, {
      eventType,
      timestamp: new Date(),
      source,
      data,
    });
  } catch (error) {
    logger.warn('Failed to publish payment event (non-fatal)', { eventType, source, error });
  }
}

export default EventBus;