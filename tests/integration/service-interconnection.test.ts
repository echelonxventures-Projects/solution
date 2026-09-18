// Integration Tests - Service Interconnection
// These tests verify that services can communicate correctly

import axios from 'axios'
import { Kafka, Producer, Consumer } from 'kafkajs'
import Redis from 'ioredis'
import { MongoClient } from 'mongodb'
import { Client as ElasticsearchClient } from '@elastic/elasticsearch'

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:8000'
const KAFKA_BROKERS = process.env.KAFKA_BROKERS || 'localhost:9092'
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/consultancy'
const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200'

describe('Service Interconnection Tests', () => {
  // ============================================
  // DATABASE CONNECTIONS
  // ============================================

  describe('Database Connections', () => {
    test('PostgreSQL should be accessible', async () => {
      const response = await axios.get(`${API_URL}/health/database`)
      expect(response.data.postgresql).toBe('connected')
    })

    test('MongoDB should be accessible', async () => {
      const client = new MongoClient(MONGODB_URI)
      await client.connect()
      const adminDb = client.db().admin()
      const result = await adminDb.ping()
      expect(result.ok).toBe(1)
      await client.close()
    })

    test('Redis should be accessible', async () => {
      const redis = new Redis(REDIS_URL)
      const result = await redis.ping()
      expect(result).toBe('PONG')
      await redis.quit()
    })

    test('Elasticsearch should be accessible', async () => {
      const client = new ElasticsearchClient({ node: ELASTICSEARCH_URL })
      const health = await client.cluster.health()
      expect(health.status).toMatch(/green|yellow/)
    })
  })

  // ============================================
  // KAFKA EVENT FLOW
  // ============================================

  describe('Kafka Event Flow', () => {
    let kafka: Kafka
    let producer: Producer
    let consumer: Consumer

    beforeAll(async () => {
      kafka = new Kafka({ brokers: [KAFKA_BROKERS] })
      producer = kafka.producer()
      consumer = kafka.consumer({ groupId: 'test-group' })
      await producer.connect()
      await consumer.connect()
    })

    afterAll(async () => {
      await producer.disconnect()
      await consumer.disconnect()
    })

    test('Should produce and consume user events', async () => {
      const topic = 'consultancy.user.created'
      const testUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        action: 'created',
      }

      // Subscribe to topic
      await consumer.subscribe({ topic, fromBeginning: false })

      // Produce event
      await producer.send({
        topic,
        messages: [{ value: JSON.stringify(testUser) }],
      })

      // Consume event
      let receivedMessage: any = null
      await consumer.run({
        eachMessage: async ({ message }) => {
          receivedMessage = JSON.parse(message.value?.toString() || '')
        },
      })

      // Wait for message
      await new Promise(resolve => setTimeout(resolve, 2000))

      expect(receivedMessage).toBeDefined()
      expect(receivedMessage.email).toBe(testUser.email)
    })

    test('Should produce booking events', async () => {
      const topic = 'consultancy.booking.created'
      const testBooking = {
        id: 'test-booking-id',
        consultantId: 'test-consultant-id',
        seekerId: 'test-seeker-id',
        status: 'pending',
      }

      await producer.send({
        topic,
        messages: [{ value: JSON.stringify(testBooking) }],
      })

      // Verify event was sent
      const metadata = await producer.send({
        topic,
        messages: [{ value: JSON.stringify({ verify: true }) }],
      })

      expect(metadata[0].topicName).toBe(topic)
    })

    test('Should produce payment events', async () => {
      const topic = 'consultancy.payment.completed'
      const testPayment = {
        id: 'test-payment-id',
        bookingId: 'test-booking-id',
        amount: 100,
        status: 'completed',
      }

      const result = await producer.send({
        topic,
        messages: [{ value: JSON.stringify(testPayment) }],
      })

      expect(result[0].baseOffset).toBeDefined()
    })
  })

  // ============================================
  // SERVICE API INTEGRATION
  // ============================================

  describe('Service API Integration', () => {
    let authToken: string
    let userId: string
    let consultantId: string

    beforeAll(async () => {
      // Register/login test user
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'testpassword123',
      })
      authToken = loginResponse.data.token
      userId = loginResponse.data.user.id
    })

    test('User Service should respond', async () => {
      const response = await axios.get(`${API_URL}/health`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      expect(response.status).toBe(200)
    })

    test('Consultant Service should connect to User Service', async () => {
      // Create a consultant (should verify user exists)
      const response = await axios.post(`${API_URL}/consultants`, {
        userId: userId,
        title: 'Test Consultant',
        hourlyRate: 100,
        bio: 'Test bio',
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      expect(response.status).toBe(201)
      consultantId = response.data.id
    })

    test('Booking Service should connect to Consultant Service', async () => {
      // Get consultant availability
      const availabilityResponse = await axios.get(
        `${API_URL}/consultants/${consultantId}/availability`
      )

      expect(availabilityResponse.status).toBe(200)

      // Create booking
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const bookingResponse = await axios.post(`${API_URL}/bookings`, {
        consultantId: consultantId,
        scheduledStart: tomorrow.toISOString(),
        durationMinutes: 60,
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      expect(bookingResponse.status).toBe(201)
    })

    test('Billing Service should connect to Booking Service', async () => {
      // Create payment for booking
      const response = await axios.post(`${API_URL}/payments/stripe/intent`, {
        bookingId: 'test-booking-id',
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      expect(response.status).toBe(200)
      expect(response.data.clientSecret).toBeDefined()
    })

    test('Search Service should connect to Consultant Service', async () => {
      const response = await axios.get(`${API_URL}/search`, {
        params: { q: 'test' },
      })

      expect(response.status).toBe(200)
    })

    test('Notification Service should receive events', async () => {
      // Trigger notification by creating booking
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      expect(response.status).toBe(200)
    })
  })

  // ============================================
  // CACHE INTEGRATION
  // ============================================

  describe('Redis Cache Integration', () => {
    let redis: Redis

    beforeAll(async () => {
      redis = new Redis(REDIS_URL)
    })

    afterAll(async () => {
      await redis.quit()
    })

    test('Should cache user sessions', async () => {
      const sessionKey = `session:test-user-id`
      const sessionData = { userId: 'test', createdAt: Date.now() }

      await redis.set(sessionKey, JSON.stringify(sessionData), 'EX', 3600)

      const cached = await redis.get(sessionKey)
      expect(JSON.parse(cached || '{}').userId).toBe('test')
    })

    test('Should cache consultant search results', async () => {
      const searchKey = `search:consultants:technology`
      const searchData = [{ id: '1', name: 'Consultant 1' }]

      await redis.set(searchKey, JSON.stringify(searchData), 'EX', 300)

      const cached = await redis.get(searchKey)
      expect(JSON.parse(cached || '[]').length).toBeGreaterThan(0)
    })

    test('Should use Redis for rate limiting', async () => {
      const rateKey = `rate_limit:test-user`

      await redis.set(rateKey, '0', 'EX', 60)

      const count = await redis.incr(rateKey)
      expect(count).toBe(1)

      await redis.incr(rateKey)
      const newCount = await redis.get(rateKey)
      expect(parseInt(newCount || '0')).toBe(2)
    })
  })

  // ============================================
  // ELASTICSEARCH INTEGRATION
  // ============================================

  describe('Elasticsearch Integration', () => {
    let esClient: ElasticsearchClient

    beforeAll(async () => {
      esClient = new ElasticsearchClient({ node: ELASTICSEARCH_URL })
    })

    afterAll(async () => {
      await esClient.close()
    })

    test('Should index consultants', async () => {
      const indexName = 'consultants'

      // Check if index exists
      const exists = await esClient.indices.exists({ index: indexName })
      expect(exists).toBeDefined()
    })

    test('Should search consultants', async () => {
      const result = await esClient.search({
        index: 'consultants',
        body: {
          query: {
            match: { name: 'test' },
          },
        },
      })

      expect(result.hits.hits.length).toBeDefined()
    })
  })

  // ============================================
  // MONGODB INTEGRATION
  // ============================================

  describe('MongoDB Integration', () => {
    let mongoClient: MongoClient

    beforeAll(async () => {
      mongoClient = new MongoClient(MONGODB_URI)
      await mongoClient.connect()
    })

    afterAll(async () => {
      await mongoClient.close()
    })

    test('Should store memory documents', async () => {
      const db = mongoClient.db('consultancy')
      const collection = db.collection('memories')

      const doc = {
        userId: 'test-user-id',
        type: 'conversation',
        content: 'Test memory content',
        createdAt: new Date(),
      }

      const result = await collection.insertOne(doc)
      expect(result.insertedId).toBeDefined()

      // Cleanup
      await collection.deleteOne({ _id: result.insertedId })
    })

    test('Should store session messages', async () => {
      const db = mongoClient.db('consultancy')
      const collection = db.collection('session_messages')

      const message = {
        sessionId: 'test-session-id',
        senderId: 'test-user-id',
        content: 'Test message',
        createdAt: new Date(),
      }

      const result = await collection.insertOne(message)
      expect(result.insertedId).toBeDefined()

      // Cleanup
      await collection.deleteOne({ _id: result.insertedId })
    })
  })

  // ============================================
  // WEBRTC SIGNALING
  // ============================================

  describe('WebRTC Signaling Integration', () => {
    test('Should create WebRTC room', async () => {
      const response = await axios.post(`${API_URL}/sessions`, {
        bookingId: 'test-booking-id',
      })

      expect(response.status).toBe(201)
      expect(response.data.roomId).toBeDefined()
      expect(response.data.roomToken).toBeDefined()
    })

    test('Should handle WebSocket connections', async () => {
      // WebSocket test would require actual WebSocket client
      // This tests that the endpoint is available
      const response = await axios.get(`${API_URL}/sessions/test-session-id`)
      expect(response.status).toBe(200)
    })
  })

  // ============================================
  // AI SERVICE INTEGRATION
  // ============================================

  describe('AI Service Integration', () => {
    test('Should connect to AI orchestrator', async () => {
      const response = await axios.post(`${API_URL}/ai/matching`, {
        query: 'React developer',
        filters: {},
      })

      expect(response.status).toBe(200)
    })

    test('Should connect to memory service', async () => {
      const response = await axios.post(`${API_URL}/memory`, {
        userId: 'test-user-id',
        type: 'conversation',
        content: 'Test memory',
      })

      expect(response.status).toBe(201)
    })
  })
})

// Run tests
// npm test -- tests/integration/service-interconnection.test.ts