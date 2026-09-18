# Service Architecture - Microservices Specifications

> **Document Version:** 1.0
> **Last Updated:** 2026-04-13
> **Owner:** Solution Architect
> **Related:** [CLAUDE.md](../CLAUDE.md) - Master Index

---

## 1. Service Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MICROSERVICES ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│   │ USER SERVICE    │ │ CONSULTANT      │ │ BOOKING SERVICE │              │
│   │                 │ │ SERVICE         │ │                 │              │
│   │ Node.js/Fastify │ │ Node.js/Fastify │ │ Node.js/Fastify │              │
│   └─────────────────┘ └─────────────────┘ └─────────────────┘              │
│                                                                             │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│   │ COMMUNICATION   │ │ BILLING SERVICE │ │ CONTENT SERVICE │              │
│   │ SERVICE         │ │                 │ │                 │              │
│   │ Go              │ │ Go              │ │ Node.js/Fastify │              │
│   └─────────────────┘ └─────────────────┘ └─────────────────┘              │
│                                                                             │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│   │ AI ORCHESTRATOR │ │ SEARCH SERVICE  │ │ NOTIFICATION    │              │
│   │ SERVICE         │ │                 │ │ SERVICE         │              │
│   │ Python          │ │ Go              │ │ Node.js/Fastify │              │
│   └─────────────────┘ └─────────────────┘ └─────────────────┘              │
│                                                                             │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│   │ ANALYTICS       │ │ MEMORY SERVICE  │ │ COMPLIANCE      │              │
│   │ SERVICE         │ │                 │ │ SERVICE         │              │
│   │ Python          │ │ Python          │ │ Node.js/Fastify │              │
│   └─────────────────┘ └─────────────────┘ └─────────────────┘              │
│                                                                             │
│   ┌─────────────────┐ ┌─────────────────┐                                  │
│   │ INTEGRATION     │ │ VERTICAL        │                                  │
│   │ SERVICE         │ │ SERVICE         │                                  │
│   │ Node.js/Fastify │ │ Node.js/Fastify │                                  │
│   └─────────────────┘ └─────────────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Service Specifications

### 2.1 User Service

```yaml
UserService:
  name: user-service
  language: Node.js (Fastify)
  port: 3001
  
  responsibilities:
    - User registration
    - Authentication (login, OTP, social)
    - Profile management
    - Session management
    - Password reset
    - Email/phone verification
    - User preferences
  
  databases:
    primary: PostgreSQL
    cache: Redis
  
  events_produced:
    - user.created
    - user.updated
    - user.deleted
    - user.logged_in
    - user.logged_out
    - user.email_verified
    - user.phone_verified
  
  events_consumed:
    - payment.completed (for subscription updates)
    - session.completed (for activity updates)
  
  endpoints:
    POST   /register
    POST   /login
    POST   /logout
    POST   /verify-email
    POST   /verify-phone
    POST   /forgot-password
    POST   /reset-password
    GET    /me
    PUT    /me
    DELETE /me
    GET    /me/preferences
    PUT    /me/preferences
    POST   /social-login/:provider
  
  dependencies:
    - notification-service (for OTP, verification emails)
    - memory-service (for user memory)
    - compliance-service (for GDPR compliance)
```

---

### 2.2 Consultant Service

```yaml
ConsultantService:
  name: consultant-service
  language: Node.js (Fastify)
  port: 3002
  
  responsibilities:
    - Consultant registration
    - Profile management
    - Verification workflow
    - Availability management
    - Rating aggregation
    - Earnings tracking
    - AI copilot configuration
  
  databases:
    primary: PostgreSQL
    document: MongoDB (extended profile)
    graph: Neo4j (expertise relationships)
  
  events_produced:
    - consultant.created
    - consultant.updated
    - consultant.verified
    - consultant.suspended
    - consultant.availability_updated
    - consultant.rating_updated
  
  events_consumed:
    - session.completed (for metrics)
    - payment.completed (for earnings)
    - review.created (for ratings)
  
  endpoints:
    POST   /register
    GET    /
    GET    /:id
    PUT    /:id
    DELETE /:id
    GET    /:id/availability
    PUT    /:id/availability
    POST   /:id/verification
    GET    /:id/reviews
    GET    /:id/metrics
    GET    /:id/earnings
    PUT    /:id/ai-config
  
  dependencies:
    - user-service
    - memory-service
    - ai-orchestrator-service
    - search-service (for indexing)
```

---

### 2.3 Booking Service

```yaml
BookingService:
  name: booking-service
  language: Node.js (Fastify)
  port: 3003
  
  responsibilities:
    - Booking creation
    - Availability checking
    - Slot management
    - Booking confirmation
    - Rescheduling
    - Cancellation
    - Reminder scheduling
    - Recurring bookings
  
  databases:
    primary: PostgreSQL
    cache: Redis (availability cache)
  
  events_produced:
    - booking.created
    - booking.confirmed
    - booking.cancelled
    - booking.rescheduled
    - booking.reminder_sent
  
  events_consumed:
    - session.started
    - session.completed
    - payment.completed
    - payment.failed
  
  endpoints:
    POST   /
    GET    /:id
    GET    /user/:userId
    GET    /consultant/:consultantId
    PUT    /:id/cancel
    PUT    /:id/reschedule
    GET    /availability/:consultantId
    POST   /recurring
    GET    /:id/recurring
  
  dependencies:
    - user-service
    - consultant-service
    - billing-service
    - notification-service
    - communication-service
```

---

### 2.4 Communication Service

```yaml
CommunicationService:
  name: communication-service
  language: Go
  port: 3004
  
  responsibilities:
    - WebRTC session management
    - Chat message routing
    - WhatsApp integration
    - Recording management
    - Transcription coordination
    - Translation coordination
    - Session quality monitoring
  
  databases:
    primary: PostgreSQL (session metadata)
    document: MongoDB (messages)
    cache: Redis (active sessions, chat state)
  
  events_produced:
    - session.created
    - session.started
    - session.ended
    - message.sent
    - message.delivered
    - message.read
    - transcription.completed
    - translation.completed
  
  events_consumed:
    - booking.confirmed
    - user.logged_in
    - user.logged_out
  
  endpoints:
    POST   /session/create
    POST   /session/:id/start
    POST   /session/:id/end
    GET    /session/:id
    POST   /session/:id/chat
    GET    /session/:id/chat
    POST   /session/:id/recording/start
    POST   /session/:id/recording/stop
    GET    /session/:id/transcript
    POST   /session/:id/translate
  
  websocket_endpoints:
    /ws/session/:id
    /ws/chat/:conversationId
  
  dependencies:
    - ai-orchestrator-service
    - memory-service
    - notification-service
    - billing-service (for per-minute billing)
```

---

### 2.5 Billing Service

```yaml
BillingService:
  name: billing-service
  language: Go
  port: 3005
  
  responsibilities:
    - Pricing calculation
    - Payment processing
    - Subscription management
    - Invoice generation
    - Payout processing
    - Discount management
    - Refund handling
    - Fraud detection coordination
  
  databases:
    primary: PostgreSQL
    timeseries: TimescaleDB (usage tracking)
    cache: Redis (billing state)
  
  events_produced:
    - payment.created
    - payment.completed
    - payment.failed
    - payment.refunded
    - subscription.created
    - subscription.updated
    - subscription.expired
    - payout.processed
  
  events_consumed:
    - session.started
    - session.ended
    - booking.created
    - booking.cancelled
  
  endpoints:
    POST   /calculate-price
    POST   /charge
    GET    /payment/:id
    GET    /invoice/:id
    POST   /subscription
    GET    /subscription/:userId
    PUT    /subscription/:id/cancel
    GET    /payouts/:consultantId
    POST   /refund
    GET    /usage/:userId
  
  dependencies:
    - user-service
    - consultant-service
    - notification-service
    - compliance-service
```

---

### 2.6 Content Service

```yaml
ContentService:
  name: content-service
  language: Node.js (Fastify)
  port: 3006
  
  responsibilities:
    - Content upload
    - Content processing (encoding, thumbnails)
    - Content storage management
    - Content streaming
    - Content search indexing
    - Content AI processing (transcription, summary)
    - Content purchases
    - Content access control
  
  databases:
    primary: PostgreSQL (metadata)
    document: MongoDB (transcripts, AI data)
    object: S3 (files)
  
  events_produced:
    - content.created
    - content.published
    - content.deleted
    - content.purchased
    - content.viewed
  
  events_consumed:
    - user.logged_in (for access control)
    - payment.completed (for purchases)
  
  endpoints:
    POST   /
    GET    /
    GET    /:id
    PUT    /:id
    DELETE /:id
    POST   /upload
    GET    /stream/:id
    POST   /purchase/:id
    GET    /transcript/:id
    GET    /chapters/:id
  
  dependencies:
    - search-service
    - ai-orchestrator-service
    - billing-service
```

---

### 2.7 AI Orchestrator Service

```yaml
AIOrchestratorService:
  name: ai-orchestrator-service
  language: Python
  port: 3007
  
  responsibilities:
    - LLM request routing
    - Prompt management
    - Response processing
    - AI agent coordination
    - Matching engine
    - Chatbot responses
    - Copilot suggestions
    - Summary generation
    - Sentiment analysis
  
  databases:
    document: MongoDB (prompts, responses)
    vector: Pinecone
    cache: Redis (response cache)
  
  events_produced:
    - ai.matching_completed
    - ai.summary_generated
    - ai.insight_generated
    - ai.suggestion_provided
  
  events_consumed:
    - message.sent
    - session.started
    - session.ended
    - user.query
  
  endpoints:
    POST   /match
    POST   /chat
    POST   /summarize
    POST   /insights
    POST   /suggest
    POST   /sentiment
    POST   /intent
    POST   /entities
    POST   /translate
  
  dependencies:
    - memory-service
    - search-service
    - vertical-service
```

---

### 2.8 Memory Service

```yaml
MemoryService:
  name: memory-service
  language: Python
  port: 3008
  
  responsibilities:
    - Memory storage
    - Memory retrieval
    - Memory consolidation
    - Knowledge graph management
    - Vector operations
    - Memory lifecycle
    - Agent memory coordination
  
  databases:
    vector: Pinecone (embeddings)
    graph: Neo4j (knowledge graph)
    document: MongoDB (memory documents)
    cache: Redis (working memory)
    timeseries: TimescaleDB (memory timeline)
  
  events_produced:
    - memory.stored
    - memory.retrieved
    - memory.consolidated
    - memory.forgotten
  
  events_consumed:
    - session.completed
    - message.sent
    - user.updated
    - ai.summary_generated
  
  endpoints:
    POST   /store
    GET    /retrieve/:userId
    POST   /search
    POST   /consolidate
    POST   /forget
    GET    /agent/:agentId/context
    POST   /agent/:agentId/learn
  
  dependencies:
    - ai-orchestrator-service (for embeddings)
```

---

### 2.9 Search Service

```yaml
SearchService:
  name: search-service
  language: Go
  port: 3009
  
  responsibilities:
    - Consultant search
    - Content search
    - User search
    - Faceted search
    - Geo-search
    - Search suggestions
    - Search analytics
  
  databases:
    search: ElasticSearch
    vector: Pinecone (semantic search)
    cache: Redis (search cache)
  
  events_produced:
    - search.query_executed
  
  events_consumed:
    - consultant.updated
    - content.published
    - user.updated
  
  endpoints:
    GET    /consultants
    GET    /content
    GET    /suggest
    GET    /facets
    POST   /index/:type/:id
    DELETE /index/:type/:id
  
  dependencies:
    - consultant-service
    - content-service
    - ai-orchestrator-service
```

---

### 2.10 Notification Service

```yaml
NotificationService:
  name: notification-service
  language: Node.js (Fastify)
  port: 3010
  
  responsibilities:
    - Email notifications
    - SMS notifications
    - Push notifications
    - WhatsApp notifications
    - In-app notifications
    - Notification preferences
    - Notification scheduling
    - Notification templates
  
  databases:
    document: MongoDB (templates)
    cache: Redis (notification state)
  
  events_produced:
    - notification.sent
    - notification.delivered
    - notification.failed
  
  events_consumed:
    - user.created
    - booking.confirmed
    - session.started
    - payment.completed
    - review.created
  
  endpoints:
    POST   /send
    POST   /email
    POST   /sms
    POST   /push
    POST   /whatsapp
    GET    /templates
    POST   /templates
  
  dependencies:
    - user-service
    - integration-service (WhatsApp)
```

---

### 2.11 Analytics Service

```yaml
AnalyticsService:
  name: analytics-service
  language: Python
  port: 3011
  
  responsibilities:
    - Metrics collection
    - Data aggregation
    - Report generation
    - Dashboard data
    - Trend analysis
    - Predictive analytics
    - Anomaly detection
    - User behavior analysis
  
  databases:
    timeseries: TimescaleDB
    document: MongoDB (reports)
    cache: Redis (dashboard cache)
  
  events_consumed:
    - All platform events
  
  endpoints:
    GET    /metrics/:type
    GET    /dashboard/:userId
    GET    /report/:type
    POST   /report/generate
    GET    /trends/:metric
    GET    /predictions/:type
  
  dependencies:
    - All services (event consumption)
```

---

### 2.12 Compliance Service

```yaml
ComplianceService:
  name: compliance-service
  language: Node.js (Fastify)
  port: 3012
  
  responsibilities:
    - GDPR compliance
    - Data export
    - Data deletion
    - Consent management
    - Audit logging
    - Policy enforcement
    - Regional compliance
  
  databases:
    primary: PostgreSQL
    document: MongoDB (audit logs)
  
  events_produced:
    - compliance.export_completed
    - compliance.deletion_completed
    - compliance.audit_logged
  
  events_consumed:
    - All data modification events
  
  endpoints:
    POST   /export/:userId
    POST   /delete/:userId
    GET    /consent/:userId
    PUT    /consent/:userId
    GET    /audit/:userId
    GET    /policies
  
  dependencies:
    - All services (data access)
```

---

### 2.13 Integration Service

```yaml
IntegrationService:
  name: integration-service
  language: Node.js (Fastify)
  port: 3013
  
  responsibilities:
    - WhatsApp Business API
    - Payment gateway integration
    - Calendar integration (Google, Outlook)
    - Social login providers
    - External API management
    - Webhook handling
  
  databases:
    primary: PostgreSQL
    cache: Redis
  
  endpoints:
    POST   /webhook/whatsapp
    POST   /webhook/payment
    POST   /calendar/sync/:userId
    GET    /providers
  
  dependencies:
    - notification-service
    - booking-service
```

---

### 2.14 Vertical Service

```yaml
VerticalService:
  name: vertical-service
  language: Node.js (Fastify)
  port: 3014
  
  responsibilities:
    - Vertical management
    - Sub-vertical hierarchy
    - Vertical configuration
    - Vertical analytics
    - New vertical registration
  
  databases:
    primary: PostgreSQL
    graph: Neo4j (hierarchy)
  
  endpoints:
    GET    /
    GET    /:id
    GET    /:id/sub-verticals
    POST   /
    PUT    /:id
    GET    /:id/analytics
```

---

## Next Steps

1. See [API Specification](../api/api-specification.md) for service endpoints
2. Review [Database Schema](../database/database-schema.md) for data storage
3. Check [Infrastructure](../architecture/infrastructure.md) for deployment

---

**Return to:** [CLAUDE.md](../CLAUDE.md) - Master Architecture Index