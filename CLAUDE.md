# Online Consultancy Platform - Master Architecture Index

> **Last Updated:** 2026-04-13
> **Status:** Architecture Design Phase
> **Version:** 1.0

---

## Quick Navigation

| Section | Document | Description |
|---------|----------|-------------|
| 1. Executive Summary | [executive-summary.md](architecture/executive-summary.md) | Vision, goals, stakeholders |
| 2. System Architecture | [system-architecture.md](architecture/system-architecture.md) | High-level tech stack, microservices |
| 3. Brain Architecture | [brain-architecture.md](architecture/brain-architecture.md) | Intelligent brain, memory systems |
| 4. AI Agent System | [ai-agent-system.md](architecture/ai-agent-system.md) | Agent hierarchy, specifications |
| 5. Domain Models | [domain-models.md](architecture/domain-models.md) | Core business entities |
| 6. Service Architecture | [service-architecture.md](architecture/service-architecture.md) | Microservices specifications |
| 7. Database Schema | [database-schema.md](database/database-schema.md) | Polyglot persistence design |
| 8. API Specification | [api-specification.md](api/api-specification.md) | REST/GraphQL endpoints |
| 9. Billing Module | [billing-module.md](modules/billing-module.md) | Complex billing configurations |
| 10. Communication Module | [communication-module.md](modules/communication-module.md) | Video, audio, chat, WhatsApp |
| 11. Security & Privacy | [security-privacy.md](specifications/security-privacy.md) | Authentication, compliance |
| 12. Multi-Region Config | [multi-region.md](specifications/multi-region.md) | Languages, currencies, regions |
| 13. Infrastructure | [infrastructure.md](architecture/infrastructure.md) | Deployment, scaling, DevOps |
| 14. AI Features Deep Dive | [ai-features.md](specifications/ai-features.md) | NLP, LLM, Agentic AI details |
| 15. Verticals Expansion | [verticals-expansion.md](modules/verticals-expansion.md) | Infinite consultancy types |

---

## Architecture Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ONLINE CONSULTANCY PLATFORM                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   CLIENTS          APPLICATION LAYER           AI/BRAIN LAYER               │
│   ┌──────┐         ┌────────────────┐         ┌────────────────┐            │
│   │ Web  │────────►│ API Gateway    │────────►│ Cognitive      │            │
│   │ App  │         │                │         │ Engine         │            │
│   └──────┘         │  ┌─────────┐   │         │                │            │
│   ┌──────┐         │  │Services │   │         │  ┌─────────┐   │            │
│   │Mobile│────────►│  │ Mesh    │   │────────►│  │Memory   │   │            │
│   │ Apps │         │  └─────────┘   │         │  │Systems │   │            │
│   └──────┘         │                │         │                │            │
│   ┌──────┐         │  Event Bus     │         │  ┌─────────┐   │            │
│   │WhatsApp────────►│  (Kafka)      │────────►│  │Knowledge│   │            │
│   │  API │         │                │         │  │Graph   │   │            │
│   └──────┘         └────────────────┘         └────────────────┘            │
│                                                                             │
│                     DATA LAYER                INFRASTRUCTURE                │
│                    ┌──────────────┐          ┌──────────────┐               │
│                    │ PostgreSQL   │          │ Kubernetes   │               │
│                    │ MongoDB      │          │ Istio Mesh   │               │
│                    │ Redis        │          │ Monitoring   │               │
│                    │ ElasticSearch│          │ CI/CD        │               │
│                    │ Vector DB    │          │ Multi-Region │               │
│                    │ Graph DB     │          └──────────────┘               │
│                    └──────────────┘                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Architecture Decisions

| Decision | Choice | Rationale | Document |
|----------|--------|-----------|----------|
| Architecture Pattern | Event-Driven Microservices | Infinite scalability, independent deployment | [system-architecture.md](architecture/system-architecture.md) |
| AI Framework | Custom Brain + Claude/GPT APIs | Self-organizing, infinitely expanding knowledge | [brain-architecture.md](architecture/brain-architecture.md) |
| Agent System | Hierarchical Agentic AI | Multi-level collaboration, persistent memory | [ai-agent-system.md](architecture/ai-agent-system.md) |
| Database | Polyglot Persistence | Right DB for each domain | [database-schema.md](database/database-schema.md) |
| Communication | WebRTC + WhatsApp Business | Real-time + messaging integration | [communication-module.md](modules/communication-module.md) |
| Billing | Multi-model subscription engine | All billing combinations supported | [billing-module.md](modules/billing-module.md) |
| Deployment | Kubernetes + Multi-region | Global availability, auto-scaling | [infrastructure.md](architecture/infrastructure.md) |

---

## Module Status Tracker

| Module | Status | Completion | Document Path |
|--------|--------|------------|---------------|
| Executive Summary | ✅ Complete | 100% | [docs/architecture/executive-summary.md](docs/architecture/executive-summary.md) |
| System Architecture | ✅ Complete | 100% | [docs/architecture/system-architecture.md](docs/architecture/system-architecture.md) |
| Brain Architecture | ✅ Complete | 100% | [docs/architecture/brain-architecture.md](docs/architecture/brain-architecture.md) |
| AI Agent System | ✅ Complete | 100% | [docs/architecture/ai-agent-system.md](docs/architecture/ai-agent-system.md) |
| Domain Models | ✅ Complete | 100% | [docs/architecture/domain-models.md](docs/architecture/domain-models.md) |
| Service Architecture | ✅ Complete | 100% | [docs/architecture/service-architecture.md](docs/architecture/service-architecture.md) |
| Database Schema | ✅ Complete | 100% | [docs/database/database-schema.md](docs/database/database-schema.md) |
| API Specification | ✅ Complete | 100% | [docs/api/api-specification.md](docs/api/api-specification.md) |
| Billing Module | ✅ Complete | 100% | [docs/modules/billing-module.md](docs/modules/billing-module.md) |
| Communication Module | ✅ Complete | 100% | [docs/modules/communication-module.md](docs/modules/communication-module.md) |
| Security & Privacy | ✅ Complete | 100% | [docs/specifications/security-privacy.md](docs/specifications/security-privacy.md) |
| Multi-Region Config | ✅ Complete | 100% | [docs/specifications/multi-region.md](docs/specifications/multi-region.md) |
| Infrastructure | ✅ Complete | 100% | [docs/architecture/infrastructure.md](docs/architecture/infrastructure.md) |
| AI Features Deep Dive | ✅ Complete | 100% | [docs/specifications/ai-features.md](docs/specifications/ai-features.md) |
| Verticals Expansion | ✅ Complete | 100% | [docs/modules/verticals-expansion.md](docs/modules/verticals-expansion.md) |

**Architecture Complete: 15 documents covering full platform design**

---

## Technology Stack Summary

### Frontend
- **Web:** Next.js 14, React 18, TypeScript
- **Mobile:** React Native, Expo
- **Admin:** React Admin Dashboard

### Backend
- **API Gateway:** Kong / Ambassador
- **Services:** Node.js (Fastify), Go (high-performance), Python (AI)
- **Service Mesh:** Istio
- **Event Bus:** Apache Kafka

### Data
- **Primary:** PostgreSQL 15 (sharded)
- **Documents:** MongoDB 7
- **Cache:** Redis 7 (clustered)
- **Search:** ElasticSearch 8
- **Vectors:** Pinecone / Weaviate
- **Graph:** Neo4j / Memgraph
- **Time-series:** TimescaleDB

### AI/ML
- **LLM:** Claude API, OpenAI GPT-4
- **NLP:** Custom models + spaCy + HuggingFace
- **Embeddings:** OpenAI Embeddings, Cohere
- **Translation:** DeepL + Google Translate API
- **Speech:** Whisper (transcription), ElevenLabs (TTS)

### Infrastructure
- **Container:** Docker, Kubernetes
- **Cloud:** AWS/GCP/Azure (multi-cloud capable)
- **CDN:** Cloudflare
- **Monitoring:** Prometheus, Grafana, DataDog
- **CI/CD:** GitHub Actions, ArgoCD

### Communication
- **Video/Audio:** WebRTC (Mediasoup/TokBox)
- **Chat:** Socket.io, WebSocket
- **WhatsApp:** WhatsApp Business API
- **Email:** SendGrid / Amazon SES
- **SMS:** Twilio

---

## Reading Order (Recommended)

**For Quick Overview:**
1. Executive Summary → System Architecture → Brain Architecture

**For Implementation Planning:**
1. Domain Models → Service Architecture → Database Schema → API Specification

**For AI Integration:**
1. Brain Architecture → AI Agent System → AI Features Deep Dive

**For Infrastructure:**
1. System Architecture → Infrastructure → Multi-Region Config

---

## Contributing Guidelines

When updating this architecture:
1. Update the specific module document first
2. Update the status tracker in this CLAUDE.md
3. Add any new decisions to the Key Architecture Decisions table
4. Keep diagrams synchronized across documents

---

## Contact & Ownership

- **Product Director:** [User]
- **Solution Architect:** Claude (AI Assistant)
- **Last Architecture Review:** 2026-04-13