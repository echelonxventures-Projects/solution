# System Architecture

> **Document Version:** 1.0
> **Last Updated:** 2026-04-13
> **Owner:** Solution Architect
> **Related:** [CLAUDE.md](../CLAUDE.md) - Master Index

---

## 1. Architecture Overview

### 1.1 Architecture Pattern

**Event-Driven Microservices with AI Mesh**

This architecture enables:
- ✅ Infinite vertical scalability (add new consultancy types without refactoring)
- ✅ Independent deployment and scaling of services
- ✅ Real-time event processing for AI features
- ✅ Global multi-region deployment
- ✅ Self-healing and fault tolerance

---

## 2. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                       │
├───────────────┬───────────────┬───────────────┬───────────────┬─────────────┤
│  Web App      │  Mobile Apps  │  WhatsApp     │  API Partners │  White Label│
│  (Next.js)    │  (React Native)│  Business API │  (REST/GraphQL)│  Portals   │
└───────┬───────┴───────┬───────┴───────┬───────┴───────┬───────┴──────┬──────┘
        │               │               │               │              │
        └───────────────┴───────────────┴───────────────┴──────────────┘
                                        │
                          ┌─────────────▼─────────────┐
                          │     API GATEWAY          │
                          │  (Kong/Ambassador)       │
                          │  - Rate Limiting         │
                          │  - Auth (JWT/OAuth2)     │
                          │  - Request Routing      │
                          │  - Load Balancing        │
                          └─────────────┬─────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        │  ┌─────────────┐    ┌─────────▼─────────┐    ┌─────────────┐  │
        │  │   SERVICE   │    │   EVENT BUS       │    │    AI/ML    │  │
        │  │   MESH      │◄───│   (Kafka/EventHub)│───►│   PLATFORM  │  │
        │  │  (Istio)    │    └─────────┬─────────┘    └──────┬──────┘  │
        │  └─────────────┘              │                     │         │
        │                               │                     │         │
        └───────────────────────────────┴─────────────────────┴─────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │           CORE MICROSERVICES  │                               │
        ├───────────────┬───────────────┼───────────────┬───────────────┤
        │ User Service  │ Booking       │ Communication │ Billing       │
        │               │ Service       │ Service       │ Service       │
        ├───────────────┼───────────────┼───────────────┼───────────────┤
        │ Consultant    │ Content       │ AI Orchestr.  │ Notification  │
        │ Service       │ Service       │ Service       │ Service       │
        ├───────────────┼───────────────┼───────────────┼───────────────┤
        │ Analytics     │ Search        │ Compliance    │ Integration   │
        │ Service       │ Service       │ Service       │ Service       │
        └───────────────┴───────────────┴───────────────┴───────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                    DATA LAYER │                               │
        ├───────────────┬───────────────┼───────────────┬───────────────┤
        │ PostgreSQL    │ MongoDB       │ Redis         │ ElasticSearch │
        │ (Transactional)│ (Documents) │ (Cache/Queue) │ (Search)      │
        ├───────────────┼───────────────┼───────────────┼───────────────┤
        │ TimescaleDB   │ Object Store  │ Vector DB     │ Graph DB      │
        │ (Time-series) │ (S3/MinIO)    │ (Pinecone)    │ (Neo4j)       │
        └───────────────┴───────────────┴───────────────┴───────────────┘
```

---

## 3. Component Specifications

### 3.1 Client Layer

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   WEB APPLICATION (Next.js 14)                                              │
│   ─────────────────────────────                                             │
│   • Framework: Next.js 14 with App Router                                   │
│   • State: React Query + Zustand                                            │
│   • UI: TailwindCSS + Radix UI components                                   │
│   • Real-time: WebSocket client for live updates                            │
│   • Video: WebRTC native implementation                                     │
│   • Routes:                                                                 │
│     - / (Home)                                                              │
│     - /search (Find Consultants)                                            │
│     - /consultant/:id (Profile)                                             │
│     - /book/:id (Booking Flow)                                              │
│     - /session/:id (Live Session)                                           │
│     - /classes (Recorded Content)                                           │
│     - /dashboard (User/Consultant Dashboard)                                │
│     - /settings (Profile, Billing, Preferences)                             │
│                                                                             │
│   MOBILE APPLICATIONS (React Native)                                        │
│   ─────────────────────────────────────                                     │
│   • Framework: React Native + Expo                                          │
│   • Platforms: iOS, Android                                                 │
│   • Features: Push notifications, offline support                           │
│   • Video: react-native-webrtc                                              │
│   • Deep linking for session access                                         │
│                                                                             │
│   ADMIN DASHBOARD                                                           │
│   ─────────────                                                             │
│   • Framework: React Admin                                                  │
│   • Features: User management, analytics, moderation                        │
│   • Role-based access control                                               │
│                                                                             │
│   WHATSAPP INTEGRATION                                                      │
│   ───────────────────                                                       │
│   • WhatsApp Business API integration                                       │
│   • Chatbot via webhook                                                     │
│   • Booking notifications                                                   │
│   • Session reminders                                                       │
│                                                                             │
│   WHITE-LABEL PORTALS                                                       │
│   ─────────────────                                                         │
│   • Customizable UI themes                                                  │
│   • Branded experiences                                                     │
│   • API-driven content                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 API Gateway Layer

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY CONFIGURATION                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   GATEWAY: Kong (Primary) / Ambassador (Alternative)                        │
│   ─────────────────────────────────────────────                             │
│                                                                             │
│   ┌─────────────────┬─────────────────┬───────────────────────────────────┐│
│   │ Feature         │ Configuration    │ Implementation                   ││
│   ├─────────────────┼─────────────────┼───────────────────────────────────┤│
│   │                 │                 │                                   ││
│   │ Authentication  │ JWT + OAuth2    │ Validate tokens, refresh flows   ││
│   │                 │                 │                                   ││
│   │ Rate Limiting   │ 100 req/min/user│ Prevent abuse, fair usage        ││
│   │                 │                 │                                   ││
│   │ Request Routing │ Path-based      │ /api/v1/users → user-service     ││
│   │                 │                 │ /api/v1/booking → booking-service ││
│   │                 │                 │                                   ││
│   │ Load Balancing  │ Round-robin     │ Distribute across instances      ││
│   │                 │ + health checks │                                   ││
│   │                 │                 │                                   ││
│   │ SSL/TLS         │ Auto-certificate│ Let's Encrypt integration        ││
│   │                 │                 │                                   ││
│   │ CORS            │ Whitelist domains│ Allow approved origins          ││
│   │                 │                 │                                   ││
│   │ Compression     │ gzip/brotli     │ Reduce payload size              ││
│   │                 │                 │                                   ││
│   │ Circuit Breaker │ 5 failures/30s  │ Prevent cascade failures         ││
│   │                 │                 │                                   ││
│   │ Logging         │ Structured logs │ Request/response logging         ││
│   │                 │                 │                                   ││
│   │ Caching         │ 5 min TTL       │ Cache frequent responses         ││
│   │                 │                 │                                   ││
│   └─────────────────┴─────────────────┴───────────────────────────────────┘│
│                                                                             │
│   API ENDPOINTS STRUCTURE                                                   │
│   ──────────────────────                                                    │
│                                                                             │
│   /api/v1/                                                                  │
│   ├── /users                    → User Service                             │
│   │   ├── POST   /register                                                  │
│   │   ├── POST   /login                                                     │
│   │   ├── GET    /:id                                                       │
│   │   ├── PUT    /:id                                                       │
│   │   └── DELETE /:id                                                       │
│   │                                                                         │
│   ├── /consultants              → Consultant Service                        │
│   │   ├── GET    /                                                            │
│   │   ├── GET    /:id                                                       │
│   │   ├── POST   / (register consultant)                                    │
│   │   ├── GET    /:id/availability                                          │
│   │   └── GET    /:id/reviews                                               │
│   │                                                                         │
│   ├── /bookings                 → Booking Service                          │
│   │   ├── POST   /                                                            │
│   │   ├── GET    /:id                                                       │
│   │   ├── PUT    /:id/cancel                                                │
│   │   └── GET    /user/:userId                                              │
│   │                                                                         │
│   ├── /sessions                 → Communication Service                     │
│   │   ├── POST   /start                                                     │
│   │   ├── POST   /:id/end                                                   │
│   │   ├── GET    /:id/recording                                             │
│   │   └── POST   /:id/chat                                                  │
│   │                                                                         │
│   ├── /billing                  → Billing Service                          │
│   │   ├── POST   /charge                                                    │
│   │   ├── GET    /invoices                                                  │
│   │   ├── POST   /subscribe                                                 │
│   │   └── GET    /subscriptions                                             │
│   │                                                                         │
│   ├── /content                  → Content Service                          │
│   │   ├── GET    /classes                                                   │
│   │   ├── GET    /classes/:id                                               │
│   │   ├── POST   /classes (upload)                                          │
│   │   └── GET    /classes/:id/stream                                        │
│   │                                                                         │
│   ├── /ai                       → AI Orchestrator Service                   │
│   │   ├── POST   /chat                                                      │
│   │   ├── POST   /match                                                     │
│   │   ├── POST   /translate                                                 │
│   │   └── GET    /analytics                                                 │
│   │                                                                         │
│   └── /webhooks                 → Integration Service                       │
│       ├── POST   /whatsapp                                                  │
│       ├── POST   /payment                                                   │
│       └── POST   /notifications                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Service Mesh Layer

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ISTIO SERVICE MESH                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   CONTROL PLANE (Istiod)                                                    │
│   ───────────────────                                                       │
│   • Pilot: Service discovery, traffic management                            │
│   • Citadel: Certificate management, mTLS                                   │
│   • Galley: Configuration validation                                        │
│                                                                             │
│   DATA PLANE (Envoy Sidecars)                                               │
│   ─────────────────────────────                                             │
│   Each microservice has Envoy sidecar providing:                            │
│                                                                             │
│   ┌─────────────────┬─────────────────┬───────────────────────────────────┐│
│   │ Feature         │ Benefit         │ Configuration                     ││
│   ├─────────────────┼─────────────────┼───────────────────────────────────┤│
│   │                 │                 │                                   ││
│   │ mTLS            │ Zero-trust      │ Automatic encryption between      ││
│   │                 │ security        │ services                          ││
│   │                 │                 │                                   ││
│   │ Load Balancing  │ High availability│ Distribute requests evenly       ││
│   │                 │                 │                                   ││
│   │ Retry & Timeout │ Resilience      │ Automatic retry on failures       ││
│   │                 │                 │                                   ││
│   │ Circuit Breaking│ Fault isolation │ Prevent cascade failures         ││
│   │                 │                 │                                   ││
│   │ Traffic Splitting│ Canary deployments│ Gradual rollouts              ││
│   │                 │                 │                                   ││
│   │ Observability   │ Full visibility │ Metrics, logs, traces            ││
│   │                 │                 │                                   ││
│   │ Rate Limiting   │ Service-level   │ Protect individual services       ││
│   │                 │ protection      │                                   ││
│   └─────────────────┴─────────────────┴───────────────────────────────────┘│
│                                                                             │
│   TRAFFIC MANAGEMENT                                                        │
│   ─────────────────                                                         │
│                                                                             │
│   VirtualService: Routing rules                                             │
│   DestinationRule: Load balancing policies                                  │
│   Gateway: Ingress/Egress configuration                                     │
│   ServiceEntry: External service integration                                │
│                                                                             │
│   SECURITY POLICIES                                                         │
│   ─────────────────                                                         │
│                                                                             │
│   AuthorizationPolicy: Service-to-service access control                    │
│   PeerAuthentication: mTLS enforcement                                      │
│   RequestAuthentication: JWT validation                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Event Bus Layer

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        APACHE KAFKA EVENT BUS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   CLUSTER CONFIGURATION                                                     │
│   ─────────────────────                                                     │
│   • Brokers: 3+ (replicated across regions)                                 │
│   • Partitions: Based on throughput needs                                   │
│   • Replication Factor: 3 (for durability)                                  │
│   • Retention: 7 days (configurable per topic)                              │
│                                                                             │
│   EVENT TOPICS                                                              │
│   ─────────────                                                             │
│                                                                             │
│   ┌─────────────────┬─────────────────┬───────────────────────────────────┐│
│   │ Topic           │ Partition Count │ Consumers                         ││
│   ├─────────────────┼─────────────────┼───────────────────────────────────┤│
│   │                 │                 │                                   ││
│   │ user-events     │ 12              │ AI Service, Analytics, Email      ││
│   │                 │                 │                                   ││
│   │ booking-events  │ 24              │ Billing, Notification, AI         ││
│   │                 │                 │                                   ││
│   │ session-events  │ 48              │ Billing, Analytics, Recording     ││
│   │                 │                 │                                   ││
│   │ payment-events  │ 12              │ Billing, Notification, Analytics  ││
│   │                 │                 │                                   ││
│   │ ai-events       │ 24              │ Memory Service, Learning Engine   ││
│   │                 │                 │                                   ││
│   │ content-events  │ 12              │ Search, Analytics, Notification   ││
│   │                 │                 │                                   ││
│   │ notification-queue│ 24            │ Notification Service              ││
│   │                 │                 │                                   ││
│   │ whatsapp-queue  │ 12              │ WhatsApp Integration Service      ││
│   │                 │                 │                                   ││
│   │ analytics-events │ 48             │ Analytics Aggregator              ││
│   │                 │                 │                                   ││
│   └─────────────────┴─────────────────┴───────────────────────────────────┘│
│                                                                             │
│   EVENT SCHEMA (Avro)                                                       │
│   ──────────────────                                                        │
│                                                                             │
│   {                                                                         │
│     "type": "record",                                                       │
│     "name": "PlatformEvent",                                                │
│     "fields": [                                                             │
│       {"name": "eventId", "type": "string"},                                │
│       {"name": "eventType", "type": "string"},                              │
│       {"name": "timestamp", "type": "long"},                                │
│       {"name": "version", "type": "string"},                                │
│       {"name": "source", "type": "string"},                                 │
│       {"name": "payload", "type": "bytes"},                                 │
│       {"name": "metadata", "type": "map"},                                  │
│       {"name": "correlationId", "type": "string"}                           │
│     ]                                                                       │
│   }                                                                         │
│                                                                             │
│   EVENT SOURCING                                                            │
│   ─────────────                                                             │
│   • All state changes emitted as events                                     │
│   • Event replay for debugging/audit                                        │
│   • CQRS pattern: Commands → Events → Read models                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Technology Stack Decisions

### 4.1 Backend Services

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SERVICE IMPLEMENTATION STACK                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │ LANGUAGE SELECTION BY SERVICE                                         │ │
│   ├───────────────────────────────────────────────────────────────────────┤ │
│   │                                                                       │ │
│   │   NODE.JS (Fastify) - Business Logic Services                         │ │
│   │   ───────────────────────────────────────────                         │ │
│   │   • User Service                                                       │ │
│   │   • Booking Service                                                    │ │
│   │   • Content Service                                                    │ │
│   │   • Notification Service                                               │ │
│   │   • Integration Service                                                │ │
│   │                                                                       │ │
│   │   Reasoning: Fast development, rich ecosystem, JSON-native            │ │
│   │                                                                       │ │
│   │   GO - High Performance Services                                       │ │
│   │   ─────────────────────────────────────                                │ │
│   │   • Communication Service (WebRTC signaling)                          │ │
│   │   • Billing Service (payment processing)                              │ │
│   │   • Search Service (high throughput queries)                          │ │
│   │                                                                       │ │
│   │   Reasoning: Performance, concurrency, low latency                    │ │
│   │                                                                       │ │
│   │   PYTHON - AI/ML Services                                              │ │
│   │   ─────────────────────────────────                                     │ │
│   │   • AI Orchestrator Service                                            │ │
│   │   • Memory Service                                                     │ │
│   │   • Analytics Service                                                  │ │
│   │   • Matching Engine                                                    │ │
│   │                                                                       │ │
│   │   Reasoning: AI libraries, ML frameworks, rapid prototyping           │ │
│   │                                                                       │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   SERVICE COMMUNICATION                                                     │
│   ─────────────────────                                                     │
│                                                                             │
│   • Internal: gRPC (performance)                                            │
│   • External: REST + GraphQL (flexibility)                                  │
│   • Events: Kafka (async)                                                   │
│   • Real-time: WebSocket (live updates)                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Layer Selection

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        POLYGLOT PERSISTENCE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┬─────────────────┬───────────────────────────────────┐│
│   │ Database        │ Use Case        │ Services Using                    ││
│   ├─────────────────┼─────────────────┼───────────────────────────────────┤│
│   │                 │                 │                                   ││
│   │ PostgreSQL 15   │ Transactional   │ User, Booking, Billing            ││
│   │ (Sharded)       │ data            │ Consultant                        ││
│   │                 │ ACID compliance │                                   ││
│   │                 │                 │                                   ││
│   │ MongoDB 7       │ Document storage│ Content, AI Orchestrator          ││
│   │                 │ Flexible schema │ Chat transcripts                  ││
│   │                 │                 │                                   ││
│   │ Redis 7         │ Caching         │ All services (session cache)      ││
│   │ (Clustered)     │ Rate limiting   │ Real-time presence                ││
│   │                 │ Pub/Sub         │                                   ││
│   │                 │                 │                                   ││
│   │ ElasticSearch 8 │ Search          │ Consultant search                 ││
│   │                 │ Analytics       │ Content search                    ││
│   │                 │ Logging         │ Full-text queries                 ││
│   │                 │                 │                                   ││
│   │ Pinecone/       │ Vector storage  │ AI Orchestrator                   ││
│   │ Weaviate        │ Embeddings      │ Matching Engine                   ││
│   │                 │ Semantic search │ Memory Service                    ││
│   │                 │                 │                                   ││
│   │ Neo4j/          │ Knowledge graph │ Memory Service                    ││
│   │ Memgraph        │ Relationships   │ AI Orchestrator                   ││
│   │                 │ Path queries    │ Recommendation engine             ││
│   │                 │                 │                                   ││
│   │ TimescaleDB     │ Time-series     │ Analytics Service                 ││
│   │                 │ Metrics         │ Billing (usage tracking)          ││
│   │                 │ Event history   │                                   ││
│   │                 │                 │                                   ││
│   │ S3/MinIO        │ Object storage  │ Content Service                   ││
│   │                 │ Files           │ Communication Service             ││
│   │                 │ Media           │ (recordings)                      ││
│   │                 │                 │                                   ││
│   └─────────────────┴─────────────────┴───────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Scaling Strategy

### 5.1 Horizontal Scaling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SCALING CONFIGURATION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   KUBERNETES HPA (Horizontal Pod Autoscaler)                                │
│   ───────────────────────────────────────────                                │
│                                                                             │
│   ┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐│
│   │ Service         │ Min Replicas    │ Max Replicas    │ Scale Trigger   ││
│   ├─────────────────┼─────────────────┼─────────────────┼─────────────────┤│
│   │                 │                 │                 │                 ││
│   │ User Service    │ 3               │ 20              │ CPU > 70%       ││
│   │                 │                 │                 │                 ││
│   │ Booking Service │ 5               │ 50              │ CPU > 60%       ││
│   │                 │                 │                 │ RPS > 500       ││
│   │                 │                 │                 │                 ││
│   │ Communication   │ 10              │ 100             │ Concurrent      ││
│   │ Service         │                 │                 │ sessions > 1000 ││
│   │                 │                 │                 │                 ││
│   │ Billing Service │ 5               │ 30              │ CPU > 50%       ││
│   │                 │                 │                 │                 ││
│   │ AI Orchestrator │ 5               │ 50              │ GPU > 80%       ││
│   │                 │                 │                 │ Request queue   ││
│   │                 │                 │                 │                 ││
│   │ Content Service │ 3               │ 20              │ Bandwidth       ││
│   │                 │                 │                 │                 ││
│   │ Search Service  │ 3               │ 30              │ Query latency   ││
│   │                 │                 │                 │ > 100ms         ││
│   │                 │                 │                 │                 ││
│   └─────────────────┴─────────────────┴─────────────────┴─────────────────┘│
│                                                                             │
│   DATABASE SCALING                                                          │
│   ─────────────                                                             │
│                                                                             │
│   PostgreSQL:                                                               │
│   • Read replicas (3 per region)                                            │
│   • Write master with failover                                              │
│   • Sharding by user_id/region                                              │
│                                                                             │
│   MongoDB:                                                                  │
│   • Replica sets across regions                                             │
│   • Sharded collections for large data                                      │
│                                                                             │
│   Redis:                                                                    │
│   • Cluster mode (6 nodes minimum)                                          │
│   • Sentinel for HA                                                         │
│                                                                             │
│   ElasticSearch:                                                            │
│   • 3 master nodes                                                          │
│   • Multiple data nodes per region                                          │
│                                                                             │
│   Kafka:                                                                    │
│   • 3+ brokers per region                                                   │
│   • MirrorMaker for cross-region replication                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Multi-Region Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GLOBAL DEPLOYMENT                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │   │
│   │    │ US-WEST     │    │ US-EAST     │    │ EU-WEST     │           │   │
│   │    │ (AWS)       │    │ (AWS)       │    │ (GCP)       │           │   │
│   │    ├─────────────┤    ├─────────────┤    ├─────────────┤           │   │
│   │    │ • Primary   │    │ • Failover  │    │ • Primary   │           │   │
│   │    │   Master DB │    │   for US-W  │    │   for EU    │           │   │
│   │    │ • Kafka     │    │ • Kafka     │    │ • Kafka     │           │   │
│   │    │   Cluster   │    │   Mirror    │    │   Cluster   │           │   │
│   │    │ • CDN Edge  │    │ • CDN Edge  │    │ • CDN Edge  │           │   │
│   │    │ • Media     │    │ • Media     │    │ • Media     │           │   │
│   │    │   Servers   │    │   Servers   │    │   Servers   │           │   │
│   │    └─────────────┘    └─────────────┘    └─────────────┘           │   │
│   │                                                                     │   │
│   │    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │   │
│   │    │ APAC-EAST   │    │ APAC-SOUTH  │    │ MEA         │           │   │
│   │    │ (Tokyo)     │    │ (Singapore) │    │ (Dubai)     │           │   │
│   │    ├─────────────┤    ├─────────────┤    ├─────────────┤           │   │
│   │    │ • Primary   │    │ • Primary   │    │ • Emerging  │           │   │
│   │    │   for APAC  │    │   for APAC-S│    │   Market    │           │   │
│   │    │ • Kafka     │    │ • Kafka     │    │ • CloudFlare│           │   │
│   │    │   Cluster   │    │   Cluster   │    │   CDN Only  │           │   │
│   │    │ • CDN Edge  │    │ • CDN Edge  │    │             │           │   │
│   │    └─────────────┘    └─────────────┘    └─────────────┘           │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   GLOBAL DNS (CloudFlare)                                                   │
│   ─────────────────────                                                     │
│   • GeoDNS routing to nearest region                                        │
│   • Failover routing on region outage                                       │
│   • Latency-based routing                                                   │
│                                                                             │
│   DATA SYNC                                                                 │
│   ──────────                                                                │
│   • Kafka MirrorMaker: Cross-region event replication                       │
│   • PostgreSQL: Logical replication for read replicas                       │
│   • MongoDB: Change streams for global sync                                 │
│   • Vector DB: Periodic embedding sync                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. Review [Brain Architecture](brain-architecture.md) for AI/memory systems
2. Understand [AI Agent System](ai-agent-system.md) for agent specifications
3. Deep dive into [Service Architecture](service-architecture.md)

---

**Return to:** [CLAUDE.md](../CLAUDE.md) - Master Architecture Index