# AI Agent System - Hierarchical Agentic Architecture

> **Document Version:** 1.0
> **Last Updated:** 2026-04-13
> **Owner:** Solution Architect
> **Related:** [CLAUDE.md](../CLAUDE.md) - Master Index

---

## 1. Agent Hierarchy Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    AGENTIC AI HIERARCHY                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                           ┌─────────────────┐                                   │
│                           │  MASTER BRAIN   │                                   │
│                           │  ORCHESTRATOR   │                                   │
│                           │                 │                                   │
│                           │ • Global Context│                                   │
│                           │ • Agent Spawning│                                   │
│                           │ • Conflict Resol│                                   │
│                           │ • Goal Setting  │                                   │
│                           └────────┬────────┘                                   │
│                                    │                                            │
│            ┌───────────────────────┼───────────────────────┐                   │
│            │                       │                       │                   │
│            ▼                       ▼                       ▼                   │
│   ┌────────────────┐    ┌────────────────┐    ┌────────────────┐              │
│   │ USER JOURNEY   │    │ CONSULTATION   │    │ KNOWLEDGE      │              │
│   │ ORCHESTRATOR   │    │ ORCHESTRATOR   │    │ ORCHESTRATOR   │              │
│   ├────────────────┤    ├────────────────┤    ├────────────────┤              │
│   │                │    │                │    │                │              │
│   │ • Onboarding   │    │ • Session Mgmt │    │ • Learning     │              │
│   │ • Engagement   │    │ • Quality Ctrl │    │ • Knowledge    │              │
│   │ • Retention    │    │ • Follow-up    │    │   Expansion    │              │
│   │ • Satisfaction │    │ • Escalation   │    │ • Insight Gen  │              │
│   └────────────────┘    └────────────────┘    └────────────────┘              │
│            │                       │                       │                   │
│            ▼                       ▼                       ▼                   │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                      SPECIALIST AGENTS                                     │ │
│  ├───────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                           │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │ │
│  │  │ MATCHING     │ │ SCHEDULING   │ │ COMMUNICATION│ │ BILLING     │     │ │
│  │  │ AGENT        │ │ AGENT        │ │ AGENT        │ │ AGENT       │     │ │
│  │  ├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤     │ │
│  │  │              │ │              │ │              │ │              │     │ │
│  │  │ • Consultant │ │ • Calendar   │ │ • Chat       │ │ • Pricing    │     │ │
│  │  │   Search     │ │   Management │ │   Routing    │ │   Calculation│     │ │
│  │  │ • Similarity │ │ • Slot       │ │ • WhatsApp   │ │ • Invoice    │     │ │
│  │  │   Scoring    │ │   Finding    │ │   Integration│ │   Generation │     │ │
│  │  │ • Ranking    │ │ • Conflict   │ │ • Translation│ │ • Payment    │     │ │
│  │  │   Algorithms │ │   Resolution │ │   Agent      │ │   Processing │     │ │
│  │  │ • Preference │ │ • Reminder   │ │              │ │              │     │ │
│  │  │   Learning   │ │   Agent      │ │              │ │              │     │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘     │ │
│  │                                                                           │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │ │
│  │  │ CONTENT      │ │ ANALYTICS    │ │ COMPLIANCE   │ │ SUPPORT     │     │ │
│  │  │ AGENT        │ │ AGENT        │ │ AGENT        │ │ AGENT       │     │ │
│  │  ├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤     │ │
│  │  │              │ │              │ │              │ │              │     │ │
│  │  │ • Class      │ │ • Metrics    │ │ • GDPR       │ │ • Triage     │     │ │
│  │  │   Recording  │ │ • Insights   │ │   Compliance │ │   Agent      │     │ │
│  │  │ • Video      │ │ • Predictions│ │ • HIPAA      │ │ • FAQ        │     │ │
│  │  │   Processing │ │ • Anomaly    │ │   Checks     │ │   Handler    │     │ │
│  │  │ • Transcript  │ │   Detection  │ │ • Audit      │ │ • Escalation │     │ │
│  │  │   Generation │ │ • Reporting  │ │   Logs       │ │   Manager    │     │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘     │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│            │                       │                       │                   │
│            ▼                       ▼                       ▼                   │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                      EXECUTOR AGENTS                                       │ │
│  ├───────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                           │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │ │
│  │  │ SEARCH       │ │ NLP          │ │ TRANSLATION  │ │ NOTIFICATION │     │ │
│  │  │ EXECUTOR     │ │ EXECUTOR     │ │ EXECUTOR     │ │ EXECUTOR    │     │ │
│  │  ├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤     │ │
│  │  │              │ │              │ │              │ │              │     │ │
│  │  │ • Elastic    │ │ • Intent     │ │ • Real-time  │ │ • Email      │     │ │
│  │  │   Queries    │ │   Detection  │ │   Language   │ │   Sending    │     │ │
│  │  │ • Vector     │ │ • Entity     │ │   Detection  │ │ • SMS        │     │ │
│  │  │   Search     │ │   Extraction │ │ • Machine    │ │   Push       │     │ │
│  │  │ • Graph      │ │ • Sentiment  │ │   Translation│ │   Notifications│    │ │
│  │  │   Traversal  │ │   Analysis   │ │ • Context    │ │ • WhatsApp   │     │ │
│  │  │              │ │              │ │   Preservation│ │   Messages  │     │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘     │ │
│  │                                                                           │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │ │
│  │  │ MEDIA        │ │ BILLING      │ │ DATA         │ │ SECURITY     │     │ │
│  │  │ PROCESSING   │ │ EXECUTOR     │ │ AGGREGATOR   │ │ EXECUTOR    │     │ │
│  │  │ EXECUTOR     │ ├──────────────┤ ├──────────────┤ ├──────────────┤     │ │
│  │  ├──────────────┤ │              │ │              │ │              │     │ │
│  │  │              │ │ • Payment    │ │ • Statistics │ │ • Fraud      │     │ │
│  │  │ • Video      │ │   Gateway    │ │   Collection │ │   Detection  │     │ │
│  │  │   Encoding   │ │ • Refund     │ │ • Aggregation│ │ • Access     │     │ │
│  │  │ • Audio      │ │   Processing │ │ • Caching    │ │   Control    │     │ │
│  │  │   Processing │ │ • Invoice    │ │ • Sync       │ │ • Encryption │     │ │
│  │  │ • Thumbnail   │ │   Generation │ │              │ │ • Monitoring │     │ │
│  │  │   Generation │ │              │ │              │ │              │     │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘     │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Agent Specifications

### 2.1 Master Brain Orchestrator

| Property | Value |
|----------|-------|
| **Agent ID** | `master-orchestrator-v1` |
| **Type** | Meta-Agent |
| **Brain Integration** | Full Brain Access |
| **Spawn Authority** | Can create any specialist/executor agent |

**Capabilities:**
- Global context management across all agents
- Agent spawning and lifecycle management
- Cross-agent conflict resolution
- Platform-wide goal setting and monitoring
- Resource allocation optimization
- Emergency escalation handling

---

### 2.2 Matching Agent (Specialist)

| Property | Value |
|----------|-------|
| **Agent ID** | `matching-agent-v1` |
| **Type** | Specialist Agent |
| **Brain Integration** | Semantic Memory + Knowledge Graph |

**Capabilities:**

| Capability | Brain Access | Description |
|------------|--------------|-------------|
| Intent Analysis | Working Memory | Understand user's real need |
| Expert Search | Knowledge Graph | Find consultants by expertise |
| Similarity Match | Vector Store | Match user profile to consultants |
| Availability Check | Temporal Memory | Check real-time availability |
| Preference Learning | Procedural Memory | Learn user preferences over time |
| Ranking | Reasoning Engine | Apply scoring algorithms |
| Recommendation | Intuition Engine | Quick heuristic suggestions |

**Execution Workflow:**

```
Step 1: PERCEPTION
──────────────────
Input: User query + context
Action: Parse, extract entities, detect intent
Brain Query: "What is this user's typical consultation pattern?"

Step 2: BRAIN QUERY
───────────────────
Query Types:
• Semantic: "Find consultants matching [user_profile_embedding]"
• Graph: "Traverse expertise → consultant → availability paths"
• Temporal: "Get user's historical booking success rates"
• Procedural: "Retrieve learned preferences for this user type"

Step 3: REASONING
─────────────────
Algorithms:
• Deductive: "Premium user → Priority consultants"
• Analogical: "Similar user chose Dr. X → Recommend similar"
• Causal: "Past good outcome with skill Y → Prioritize skill Y"

Step 4: ACTION
─────────────
Output: Ranked consultant list with match scores
Brain Update: Store this recommendation for future learning

Step 5: REFLECTION
──────────────────
Metrics: Match accuracy, conversion rate, satisfaction
Learning: Adjust scoring weights based on outcomes
```

---

### 2.3 Consultant Copilot Agent (Specialist)

| Property | Value |
|----------|-------|
| **Agent ID** | `consultant-copilot-v1` |
| **Type** | Specialist Agent |
| **Brain Integration** | Full Brain Access (Consultant Memory + KB) |

**Real-Time Capabilities:**

| Feature | Brain Component | Function |
|---------|-----------------|----------|
| Session Context | Working Memory | Maintain live session context |
| Knowledge Retrieval | Knowledge Graph | Retrieve domain expertise instantly |
| Smart Suggestions | Intuition Engine | Real-time response hints |
| Client History | Episodic Memory | Recall past client interactions |
| Insight Generation | Reasoning Engine | Generate insights from live data |
| Follow-up Recommendations | Procedural Memory | Recommend actions based on patterns |
| Transcription & Translation | Learning Engine | Real-time speech processing |
| Compliance Monitoring | Reasoning Engine | Flag compliance issues live |

**UI Integration:**

```
┌───────────────────────────────────────────────────────────────────┐
│                    CONSULTANT DASHBOARD - COPILOT PANEL            │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  💡 AI Suggestions:                                               │
│  • Based on client history, suggest topic X                       │
│  • Similar cases resolved with approach Y                         │
│  • Recommended follow-up: Schedule Z                              │
│                                                                   │
│  📊 Live Insights:                                                │
│  • Client sentiment: Positive (↑)                                 │
│  • Engagement level: High                                         │
│  • Key topics detected: [Topic1, Topic2]                         │
│                                                                   │
│  📚 Knowledge Base:                                               │
│  • Relevant concept: [Definition from KB]                        │
│  • Related articles: [Link 1] [Link 2]                           │
│  • Past cases: [Case A] [Case B]                                  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

### 2.4 User Chatbot Agent (Specialist)

| Property | Value |
|----------|-------|
| **Agent ID** | `user-chatbot-v1` |
| **Type** | Specialist Agent |
| **Brain Integration** | Full User Memory + Semantic Knowledge |

**Capabilities:**

| Capability | Brain Component | Description |
|------------|-----------------|-------------|
| 24/7 Availability | Working Memory | Always available for queries |
| Intent Understanding | Reasoning Engine | Understand what user needs |
| Personalized Responses | User Memory | Tailor to user profile |
| Triage & Routing | Intuition Engine | Quick categorization |
| Knowledge Q&A | Knowledge Graph | Answer domain questions |
| Booking Assistance | Procedural Memory | Handle booking workflows |
| Multi-language Support | Translation Module | Communicate in user's language |
| Emotional Intelligence | Attention Mechanism | Detect and respond to emotions |

**Conversation Flow Example:**

```
User: "I need help with my career"
│
▼
Brain Query: [User Profile] + [Intent Analysis]
│
▼
Chatbot Response:
"Hi [Name]! I see you're interested in career guidance.
 Based on your previous consultations about [Topic],
 I can help you:
 1. Book a session with our career specialists
 2. Explore recorded classes on career development
 3. Take a quick assessment to understand your needs
 What would you prefer?"
│
▼
User: "I want to book with someone good at tech careers"
│
▼
Brain Query: [Semantic Search: Tech Career Consultants]
           + [User Preferences: Morning slots, Video preferred]
│
▼
Chatbot Response:
"I found 3 excellent tech career consultants:
 🌟 Dr. [Name] - 4.9★, 500+ sessions, Available tomorrow 10 AM
 🌟 [Name] - 4.8★, Tech industry specialist, Available today 3 PM
 🌟 [Name] - New but highly rated, Budget-friendly
 Should I book one of these?"
```

---

### 2.5 Scheduling Agent (Specialist)

| Property | Value |
|----------|-------|
| **Agent ID** | `scheduling-agent-v1` |
| **Type** | Specialist Agent |
| **Brain Integration** | Temporal Memory + Procedural Memory |

**Capabilities:**
- Calendar management (multiple calendar integration)
- Slot finding with preference optimization
- Conflict resolution across time zones
- Reminder orchestration (email, SMS, WhatsApp, push)
- Rescheduling handling
- Availability prediction

---

### 2.6 Analytics Agent (Specialist)

| Property | Value |
|----------|-------|
| **Agent ID** | `analytics-agent-v1` |
| **Type** | Specialist Agent |
| **Brain Integration** | TimescaleDB + Knowledge Graph |

**Capabilities:**
- Metrics collection and aggregation
- Insight generation from patterns
- Predictive analytics (demand forecasting, churn prediction)
- Anomaly detection (fraud, quality issues)
- Report generation
- Trend analysis

---

## 3. Agent Communication Protocol

### 3.1 Message Types

| Type | Direction | Purpose |
|------|-----------|---------|
| QUERY | Agent → Brain | Request knowledge/context |
| RESPONSE | Brain → Agent | Provide retrieved information |
| STORE | Agent → Brain | Store new knowledge/memory |
| UPDATE | Agent → Brain | Modify existing knowledge |
| LEARN | Agent → Brain | Trigger learning process |
| REFLECT | Agent → Brain | Request self-assessment |
| FORGET | Brain → Agent | Notification of memory expiry |
| COLLABORATE | Agent ↔ Agent | Multi-agent coordination |

### 3.2 Agent Execution Cycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AGENT EXECUTION CYCLE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Input ───────►                                                            │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  ┌───────────┐                                                     │   │
│   │  │ PERCEPTION │                                                     │   │
│   │  │            │                                                     │   │
│   │  │ • Observe  │                                                     │   │
│   │  │ • Parse    │                                                     │   │
│   │  │ • Classify │                                                     │   │
│   │  └──────┬────┘                                                     │   │
│   │         │                                                          │   │
│   │         ▼                                                          │   │
│   │  ┌───────────┐                                                     │   │
│   │  │  BRAIN    │◄─── Memory Query                                    │   │
│   │  │  QUERY    │                                                     │   │
│   │  │           │───► Context Retrieve                                 │   │
│   │  └──────┬────┘                                                     │   │
│   │         │                                                          │   │
│   │         ▼                                                          │   │
│   │  ┌───────────┐                                                     │   │
│   │  │ REASONING │                                                     │   │
│   │  │           │                                                     │   │
│   │  │ • Analyze │                                                     │   │
│   │  │ • Plan    │                                                     │   │
│   │  │ • Decide  │                                                     │   │
│   │  └──────┬────┘                                                     │   │
│   │         │                                                          │   │
│   │         ▼                                                          │   │
│   │  ┌───────────┐                                                     │   │
│   │  │  ACTION   │                                                     │   │
│   │  │           │                                                     │   │
│   │  │ • Execute │                                                     │   │
│   │  │ • Respond │                                                     │   │
│   │  │ • Delegate│                                                     │   │
│   │  └──────┬────┘                                                     │   │
│   │         │                                                          │   │
│   │         ▼                                                          │   │
│   │  ┌───────────┐                                                     │   │
│   │  │  BRAIN    │◄─── Store Result                                    │   │
│   │  │  UPDATE   │                                                     │   │
│   │  │           │───► Knowledge Store                                 │   │
│   │  └──────┬────┘                                                     │   │
│   │         │                                                          │   │
│   │         ▼                                                          │   │
│   │  ┌───────────┐                                                     │   │
│   │  │ REFLECTION│                                                     │   │
│   │  │           │                                                     │   │
│   │  │ • Evaluate│                                                     │   │
│   │  │ • Learn   │                                                     │   │
│   │  │ • Improve │                                                     │   │
│   │  └──────┬────┘                                                     │   │
│   │         │                                                          │   │
│   │         ▼                                                          │   │
│   │  Output ───────►                                                    │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Multi-Agent Collaboration

### 4.1 Collaboration Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Sequential** | Step-by-step workflow | Chatbot → Matching → Scheduling → Billing |
| **Parallel** | Independent tasks | Analytics + Compliance both analyze session |
| **Hierarchical** | Authority delegation | Orchestrator → Specialist → Executor |
| **Peer-to-Peer** | Equal agents share | Matching ↔ Scheduling negotiate slot |
| **Competitive** | Best solution wins | Multiple matching strategies compete |

### 4.2 Collaboration Protocol

```yaml
CollaborationMessage:
  collaboration_id: UUID
  initiator_agent: agent_id
  target_agent: agent_id
  collaboration_type: enum[sequential, parallel, hierarchical, peer, competitive]
  task_description: string
  expected_output: schema
  deadline: timestamp
  priority: enum[low, medium, high, critical]
  context: {shared_memory_keys, previous_results}
  status: enum[requested, accepted, in_progress, completed, failed]
```

---

## 5. Agent Memory Integration

Each agent maintains its own memory within the Brain:

```yaml
AgentMemory:
  agent_id: UUID
  
  # What the agent knows
  knowledge: {
    domain_expertise: [string],
    learned_patterns: [{pattern, confidence}],
    successful_strategies: [{strategy, success_rate}]
  }
  
  # What the agent is doing
  current_state: {
    active_tasks: [{task_id, status}],
    pending_decisions: [{decision, options}],
    resource_allocation: {allocated, available}
  }
  
  # What the agent learned
  learning_log: [
    {
      timestamp: datetime,
      experience: string,
      outcome: string,
      lesson_learned: string,
      confidence_update: float
    }
  ]
  
  # How the agent performs
  performance_metrics: {
    success_rate: float,
    average_response_time: float,
    user_satisfaction: float,
    error_rate: float
  }
```

---

## Next Steps

1. See [Brain Architecture](brain-architecture.md) for memory system details
2. Review [AI Features](../specifications/ai-features.md) for NLP/LLM specifications
3. Check [Service Architecture](service-architecture.md) for AI Orchestrator Service

---

**Return to:** [CLAUDE.md](../CLAUDE.md) - Master Architecture Index