# Brain Architecture - Intelligent Memory System

> **Document Version:** 1.0
> **Last Updated:** 2026-04-13
> **Owner:** Solution Architect
> **Related:** [CLAUDE.md](../CLAUDE.md) - Master Index

---

## 1. Overview

The Brain Architecture is a self-organizing, infinitely expanding knowledge system designed to power all AI features of the platform. It mimics human cognitive processes while enabling machine-scale processing.

---

## 2. Brain Layers Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    INTELLIGENT BRAIN ARCHITECTURE                               │
│                  (Self-Organizing, Infinite Knowledge Expansion)                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                        COGNITIVE LAYER (The "Mind")                       │  │
│  │                                                                           │  │
│  │   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                  │  │
│  │   │  REASONING   │   │   LEARNING   │   │   CREATING   │                  │  │
│  │   │   ENGINE     │   │   ENGINE     │   │   ENGINE     │                  │  │
│  │   ├──────────────┤   ├──────────────┤   ├──────────────┤                  │  │
│  │   │ • Deductive  │   │ • Continual  │   │ • Knowledge  │                  │  │
│  │   │ • Inductive  │   │   Learning   │   │   Synthesis  │                  │  │
│  │   │ • Abductive  │   │ • Transfer   │   │ • Insight    │                  │  │
│  │   │ • Analogical │   │   Learning   │   │   Generation │                  │  │
│  │   │ • Causal     │   │ • Meta-      │   │ • Pattern    │                  │  │
│  │   │   Reasoning  │   │   Learning   │   │   Discovery  │                  │  │
│  │   └──────────────┘   └──────────────┘   └──────────────┘                  │  │
│  │                                                                           │  │
│  │   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                  │  │
│  │   │  ATTENTION   │   │    FOCUS     │   │  INTUITION   │                  │  │
│  │   │   MECHANISM  │   │   MANAGER    │   │   ENGINE     │                  │  │
│  │   ├──────────────┤   ├──────────────┤   ├──────────────┤                  │  │
│  │   │ • Relevance  │   │ • Priority   │   │ • Heuristics │                  │  │
│  │   │   Scoring    │   │   Queueing   │   │ • Gut-feel   │                  │  │
│  │   │ • Context    │   │ • Resource   │   │   Matching   │                  │  │
│  │   │   Weighting  │   │   Allocation │   │ • Rapid      │                  │  │
│  │   │ • Noise      │   │ • Cognitive  │   │   Decision  │                  │  │
│  │   │   Filtering  │   │   Load Mgmt  │   │ • Predictive │                  │  │
│  │   └──────────────┘   └──────────────┘   └──────────────┘                  │  │
│  │                                                                           │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                        │
│                                        ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                    KNOWLEDGE LAYER (The "Brain Tissue")                   │  │
│  │              Infinite Self-Expanding Knowledge Graph                      │  │
│  │                                                                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │   CONCEPTS   │  │   ENTITIES   │  │ RELATIONS   │  │  HIERARCHIES │    │  │
│  │  │   STORE     │  │   STORE      │  │   STORE     │  │    STORE     │    │  │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤    │  │
│  │  │ Abstract     │  │ People       │  │ Semantic    │  │ Taxonomies   │    │  │
│  │  │ Concepts     │  │ Places       │  │ Relations   │  │ Ontologies   │    │  │
│  │  │ Patterns     │  │ Things       │  │ Causal      │  │ Categories   │    │  │
│  │  │ Principles   │  │ Events       │  │ Temporal    │  │ Classifications│   │  │
│  │  │ Theories     │  │ Documents    │  │ Spatial     │  │ Groupings   │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  │                                                                           │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                        │
│                                        ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                     MEMORY LAYER (The "Hippocampus")                      │  │
│  │                  Memory Consolidation & Retrieval                         │  │
│  │                                                                           │  │
│  │   ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐       │  │
│  │   │  SENSORY   │   │  SHORT-    │   │  LONG-     │   │  PROCEDURAL│       │  │
│  │   │  MEMORY    │   │  TERM      │   │  TERM      │   │  MEMORY    │       │  │
│  │   │            │   │  MEMORY    │   │  MEMORY    │   │            │       │  │
│  │   ├────────────┤   ├────────────┤   ├────────────┤   ├────────────┤       │  │
│  │   │ • Visual   │   │ • Working  │   │ • Declarative   │ • Skills   │       │  │
│  │   │   Input    │   │   Buffer   │   │   (Facts)  │   │ • Habits   │       │  │
│  │   │ • Audio    │   │ • Episodic │   │ • Semantic │   │ • Routines │       │  │
│  │   │   Input    │   │   Buffer   │   │   Memory   │   │ • Priming │       │  │
│  │   │ • Text     │   │ • Active   │   │ • Autobio- │   │ • Muscle   │       │  │
│  │   │   Input    │   │   Context  │   │   graphical│   │   Memory   │       │  │
│  │   │ • Sensor   │   │ • Recency  │   │ • Flashbulb│   │ • Condition│       │  │
│  │   │   Data     │   │   Effect   │   │   Memory   │   │   Response │       │  │
│  │   └────────────┘   └────────────┘   └────────────┘   └────────────┘       │  │
│  │                                                                           │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                        │
│                                        ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                    INFRASTRUCTURE LAYER (The "Nervous System")            │  │
│  │                    Scalable Storage & Processing                          │  │
│  │                                                                           │  │
│  │   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐      │  │
│  │   │   VECTOR BRAIN  │   │  GRAPH BRAIN     │   │   TIME BRAIN     │      │  │
│  │   │   (Pinecone)    │   │   (Neo4j)        │   │   (TimescaleDB)  │      │  │
│  │   ├──────────────────┤   ├──────────────────┤   ├──────────────────┤      │  │
│  │   │ • Embeddings    │   │ • Knowledge      │   │ • Event Timeline │      │  │
│  │   │   Storage       │   │   Graph          │   │ • Temporal       │      │  │
│  │   │ • Semantic      │   │ • Relationships  │   │   Patterns       │      │  │
│  │   │   Search        │   │ • Context        │   │ • Evolution      │      │  │
│  │   │ • Similarity    │   │   Navigation     │   │   Tracking       │      │  │
│  │   │ • Clustering    │   │ • Path Finding   │   │ • Behavioral     │      │  │
│  │   └──────────────────┘   └──────────────────┘   └──────────────────┘      │  │
│  │                                                                           │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Cognitive Layer Details

### 3.1 Reasoning Engine

See full specification in [ai-features.md](../specifications/ai-features.md)

| Module | Input | Output | Use Cases |
|--------|-------|--------|-----------|
| **Deductive** | Rules + Cases | Conclusions | Policy application, compliance checks |
| **Inductive** | Observations | Patterns | User behavior analysis, trend detection |
| **Abductive** | Observations | Explanations | Problem diagnosis, issue resolution |
| **Analogical** | Source + Target | Mapped Solutions | Case-based recommendations |
| **Causal** | Variables | Predictions | Outcome forecasting, impact analysis |

### 3.2 Learning Engine

| Module | Purpose | Implementation |
|--------|---------|----------------|
| **Continual Learning** | Learn from every interaction | Online learning, incremental updates |
| **Transfer Learning** | Apply knowledge across domains | Domain adaptation, fine-tuning |
| **Meta-Learning** | Learn how to learn better | MAML, hyperparameter optimization |

### 3.3 Attention Mechanism

Multi-head attention architecture:

```
Input Context → Attention Heads (Parallel)
├── Head 1: User Focus (preferences, history)
├── Head 2: Topic Focus (conversation subject)
├── Head 3: Time Focus (recent context)
├── Head 4: Emotion Focus (sentiment)
├── Head 5: Intent Focus (objectives)
→ Attention Fusion → Weighted Output
```

### 3.4 Intuition Engine

Rapid pattern-based decision making:
- Response time: <100ms
- Heuristic database: 500+ pattern → action rules
- Use cases: Quick routing, emergency triage, instant suggestions

---

## 4. Memory Types Specification

### 4.1 User Memory Schema

```yaml
UserMemory:
  user_id: UUID
  memory_type: enum[episodic, semantic, procedural, working]

  CoreIdentity:
    demographics: {age, location, language, timezone}
    preferences: {communication_style, expertise_areas}
    behavioral_patterns: {booking_frequency, peak_times}
    subscription: {tier, usage_patterns}

  InteractionHistory:
    consultation_summaries: [{date, consultant, topic, outcome}]
    chat_transcripts: [{session_id, summary_embedding}]
    feedback_ratings: [{consultation_id, rating, sentiment}]
    support_tickets: [{ticket_id, resolution, outcome}]

  AIContext:
    conversation_state: {active_dialogues, pending_actions}
    personalization_embeddings: [1536-dimensional vectors]
    intent_history: [what_user_typically_seeks]
    recommended_actions: [cached_recommendations]

  Embeddings:
    profile_embedding: [1536]  # OpenAI embeddings
    preference_embedding: [1536]
    behavior_embedding: [1536]
    interaction_summary_embedding: [1536]

  Metadata:
    created_at: timestamp
    updated_at: timestamp
    last_accessed: timestamp
    access_count: integer
    ttl_policy: enum[session, 30_days, 1_year, forever]
    privacy_flags: {gdpr_export_ready, anonymized}
```

### 4.2 Conversation Memory Schema

```yaml
ConversationMemory:
  conversation_id: UUID
  session_id: UUID
  participant_ids: [UUID]

  MessageStore:
    messages: [
      {
        message_id: UUID
        timestamp: datetime
        sender_id: UUID
        content: {text, attachments, media_urls}
        embedding: [1536]
        intent_detected: string
        entities_extracted: [string]
        sentiment_score: float
        language_detected: string
        response_to: UUID  # threading
      }
    ]

  ContextWindow:
    current_topic: string
    open_questions: [string]
    mentioned_entities: [{entity, type, relevance}]
    emotional_arc: [{timestamp, sentiment}]
    key_decisions: [string]

  AISummary:
    auto_summary: string  # Generated after each turn
    key_insights: [string]
    followup_recommendations: [string]
    compliance_flags: [string]

  RetentionPolicy: enum[session_only, 30_days, 1_year, forever]
  EncryptionStatus: boolean
  AnonymizedFlag: boolean
```

### 4.3 Consultant Memory Schema

```yaml
ConsultantMemory:
  consultant_id: UUID

  ExpertiseKnowledgeBase:
    domains: [{vertical, specialization, level}]
    knowledge_graph: {concepts, relationships}
    case_studies: [{anonymized_case, approach, outcome}]
    methodologies: [string]
    published_content: [{content_id, type, metrics}]

  ConsultationPatterns:
    common_client_issues: [{issue, frequency}]
    typical_session_flow: [steps]
    success_metrics: {rating_avg, repeat_rate, resolution_rate}
    client_feedback_themes: [{theme, sentiment}]
    recommended_followups: [{type, timing}]

  AIAssistantConfig:
    custom_prompts: [string]
    suggested_responses_cache: [string]
    autocomplete_models: {model_id, fine_tuned_on}
    realtime_coaching_triggers: [{trigger, action}]
    rag_pipeline_config: {sources, retrieval_strategy}

  PerformanceMetrics:
    response_time_avg: float
    client_satisfaction_scores: [{date, score}]
    repeat_booking_rate: float
    revenue_metrics: {total, per_session, monthly}
    availability_patterns: {peak_hours, blackout_periods}
```

### 4.4 AI Agent Memory Schema

```yaml
AIAgentMemory:
  agent_id: UUID
  agent_type: enum[matcher, assistant, analyzer, orchestrator]

  AgenticState:
    current_goals: [string]
    active_tasks: [{task_id, status, priority}]
    tool_capabilities: [{tool, permissions}]
    decision_history: [{decision, reasoning, outcome}]
    learned_behaviors: [{behavior, confidence}]

  ReasoningChain:
    steps: [
      {
        step_id: UUID
        timestamp: datetime
        action_taken: string
        observation: string
        thought_process: string
        tools_used: [string]
        result: string
        confidence_score: float
        fallback_triggered: boolean
      }
    ]

  LearnedPatterns:
    successful_sequences: [{pattern, success_rate}]
    failure_modes: [{failure, recovery_strategy}]
    user_adaptations: [{user_type, adaptation}]
    domain_heuristics: [{domain, heuristic}]
    cross_session_learning: [{source_session, target_session}]

  CollaborativeMemory:
    multi_agent_communications: [{agent_from, agent_to, message}]
    task_delegations: [{delegated_to, task, outcome}]
    consensus_decisions: [{decision, participants}]
    shared_knowledge: {knowledge_id, contributors}
```

---

## 5. Knowledge Expansion Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  INFINITE KNOWLEDGE EXPANSION PIPELINE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   INPUT SOURCES                PROCESSING               STORAGE             │
│   ─────────────                ──────────               ───────             │
│                                                                             │
│  ┌───────────────┐         ┌─────────────────┐       ┌─────────────────┐   │
│  │ Consultations │────────►│                 │       │                 │   │
│  └───────────────┘         │                 │       │  KNOWLEDGE      │   │
│                            │                 │       │  GRAPH         │   │
│  ┌───────────────┐         │   EXTRACTION    │──────►│  (Neo4j)       │   │
│  │ Chat Messages │────────►│   ENGINE        │       │                 │   │
│  └───────────────┘         │                 │       │  • Entities     │   │
│                            │  • NER          │       │  • Relations    │   │
│  ┌───────────────┐         │  • Relation     │       │  • Concepts     │   │
│  │ Documents     │────────►│    Extraction   │       │  • Hierarchies  │   │
│  └───────────────┘         │  • Concept      │       │                 │   │
│                            │    Mapping      │       └─────────────────┘   │
│  ┌───────────────┐         │  • Entity       │              │              │
│  │ Videos/Audio  │────────►│    Linking     │              │              │
│  └───────────────┘         │  • Knowledge    │              │              │
│                            │    Construction │       ┌──────▼─────────────┐ │
│  ┌───────────────┐         │                 │       │                    │ │
│  │ External APIs │────────►│                 │       │  VECTOR STORE     │ │
│  └───────────────┘         └────────┬────────┘       │  (Pinecone)        │ │
│                                     │                │                    │ │
│  ┌───────────────┐                  │                │  • Embeddings      │ │
│  │ User Feedback │──────────────────┤                │  • Semantic Search │ │
│  └───────────────┘                  │                │  • Clusters        │ │
│                                     │                │                    │ │
│  ┌───────────────┐                  │                └────────────────────┘ │
│  │ Recorded      │──────────────────┤                        │              │
│  │ Classes       │                  │                        │              │
│  └───────────────┘                  │                        │              │
│                                     │                ┌───────▼─────────────┐│
│                                     └───────────────►│  VALIDATION         ││
│                                                      │  ENGINE             ││
│                                                      │                     ││
│                                                      │  • Fact Checking    ││
│                                                      │  • Conflict Resol.  ││
│                                                      │  • Quality Scoring  ││
│                                                      │  • Duplicate Detect ││
│                                                      │                     ││
│                                                      └─────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Memory Retention Matrix

| Memory Type | Retention Period | Privacy Controls | Auto-Action |
|-------------|------------------|------------------|-------------|
| Working Memory | Session TTL | Auto-expire, no backup | Delete on session end |
| Episodic (Chat) | User choice | Encryption, GDPR export | Archive/anonymize |
| Episodic (Video) | 30 days | Auto-delete, no PII | Delete automatically |
| Semantic (Profile) | Until user delete | User-controlled, portable | Export on request |
| Procedural (Habits) | 1 year | Anonymized after 90 days | Aggregate anonymize |
| Agent Reasoning | 90 days | Audit logs, no PII | Archive for audit |
| Consultant Knowledge | Forever | Consultant owns, portable | Export anytime |

---

## 7. Memory Access API

```yaml
MemoryOrchestrationAPI:
  # Episodic Memory
  POST   /memory/episodic/store
  GET    /memory/episodic/retrieve/{user_id}
  POST   /memory/episodic/search
  DELETE /memory/episodic/{memory_id}

  # Semantic Memory
  POST   /memory/semantic/embed
  GET    /memory/semantic/query
  POST   /memory/semantic/associate
  GET    /memory/semantic/similar/{entity_id}

  # Working Memory
  POST   /memory/working/session/{session_id}/push
  GET    /memory/working/session/{session_id}/context
  POST   /memory/working/session/{session_id}/consolidate
  DELETE /memory/working/session/{session_id}

  # Procedural Memory
  POST   /memory/procedural/learn
  GET    /memory/procedural/apply/{user_id}/{task_type}
  PUT    /memory/procedural/update/{pattern_id}

  # Memory Lifecycle
  POST   /memory/consolidate      # Short-term → Long-term
  POST   /memory/forget           # Apply forgetting curves
  GET    /memory/health           # System health check
  POST   /memory/backup           # Backup user memories
  POST   /memory/restore          # Restore from backup

AgentMemoryAPI:
  POST   /agent/{agent_id}/memory/push
  GET    /agent/{agent_id}/memory/context
  POST   /agent/{agent_id}/memory/reflect
  GET    /agent/{agent_id}/memory/trace
  POST   /agent/{agent_id}/memory/learn
```

---

## 8. Self-Improvement Loop

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CONTINUOUS LEARNING CYCLE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         ┌───────────────────┐                               │
│                         │  PERFORMANCE     │                               │
│                         │  MONITORING      │                               │
│                         └────────┬──────────┘                               │
│                                  │                                          │
│                                  ▼                                          │
│    ┌──────────────────────────────────────────────────────────────┐        │
│    │                                                              │        │
│    │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │        │
│    │   │   MEASURE   │──►│   ANALYZE   │──►│   IMPROVE   │       │        │
│    │   │             │   │             │   │             │       │        │
│    │   │ • Accuracy  │   │ • Errors    │   │ • Retrain   │       │        │
│    │   │ • Speed     │   │ • Patterns  │   │ • Fine-tune │       │        │
│    │   │ • Relevance │   │ • Feedback  │   │ • Expand    │       │        │
│    │   │ • UX Score  │   │ • Trends    │   │ • Prune     │       │        │
│    │   └─────────────┘   └─────────────┘   └─────────────┘       │        │
│    │                                                              │        │
│    └──────────────────────────────┬───────────────────────────────┘        │
│                                  │                                          │
│                                  ▼                                          │
│                         ┌───────────────────┐                               │
│                         │  KNOWLEDGE       │                               │
│                         │  UPDATE          │                               │
│                         │                  │                               │
│                         │  • Add New       │                               │
│                         │  • Correct Old   │                               │
│                         │  • Strengthen    │                               │
│                         │  • Weaken        │                               │
│                         └───────────────────┘                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. Review [AI Agent System](ai-agent-system.md) for agent integration
2. Deep dive [AI Features](../specifications/ai-features.md) for NLP/LLM details
3. See [Service Architecture](service-architecture.md) for Memory Service spec

---

**Return to:** [CLAUDE.md](../CLAUDE.md) - Master Architecture Index