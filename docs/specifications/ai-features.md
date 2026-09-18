# AI Features Deep Dive - NLP, LLM, Agentic AI

> **Document Version:** 1.0
> **Last Updated:** 2026-04-13
> **Owner:** Solution Architect
> **Related:** [CLAUDE.md](../CLAUDE.md) - Master Index

---

## 1. AI Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI FEATURES ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐      │
│   │ LLM PROVIDERS   │────►│ AI ORCHESTRATOR│────►│ AGENTIC SYSTEM  │      │
│   │                 │     │                 │     │                 │      │
│   │ • Claude API   │     │ • Request routing│     │ • Agents       │      │
│   │ • OpenAI GPT   │     │ • Prompt management│     │ • Memory      │      │
│   │ • Custom Models│     │ • Response processing│   │ • Collaboration│    │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘      │
│                                   │                                         │
│                                   ▼                                         │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                      NLP SERVICES                                     │ │
│   │                                                                       │ │
│   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │ │
│   │  │ Intent       │ │ Entity       │ │ Sentiment    │ │ Translation │ │ │
│   │  │ Detection    │ │ Extraction   │ │ Analysis     │ │              │ │ │
│   │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │ │
│   │                                                                       │ │
│   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │ │
│   │  │ Embedding    │ │ Speech       │ │ Content      │ │ Knowledge   │ │ │
│   │  │ Generation   │ │ Processing   │ │ Generation   │ │ Retrieval   │ │ │
│   │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │ │
│   │                                                                       │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. LLM Integration

### 2.1 Primary LLM Providers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LLM PROVIDER CONFIGURATION                                │
├───────────────────────┬─────────────────────────────────────────────────────┤
│ Provider              │ Configuration & Use Cases                            │
├───────────────────────┼─────────────────────────────────────────────────────┤
│                       │                                                      │
│ CLAUDE API            │                                                      │
│ (Anthropic)           │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ Models:               │                                                      │
│ • Claude Opus 4.6     │ Complex reasoning, multi-step tasks                 │
│ • Claude Sonnet 4.6   │ Balanced performance, cost                           │
│ • Claude Haiku 4.5    │ Fast responses, simple tasks                        │
│                       │                                                      │
│ Use Cases:            │                                                      │
│ • Consultant Copilot  │ Real-time suggestions, knowledge retrieval          │
│ • Complex matching    │ Multi-factor decision making                        │
│ • Session summarization│ Insight generation                                 │
│ • Knowledge synthesis │                                                      │
│                       │                                                      │
│ OPENAI                │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ Models:               │                                                      │
│ • GPT-4o              │ General tasks                                        │
│ • GPT-4 Turbo         │ High-performance                                     │
│ • GPT-3.5 Turbo       │ Cost-effective                                       │
│                       │                                                      │
│ Use Cases:            │                                                      │
│ • Chatbot responses   │                                                      │
│ • Translation         │                                                      │
│ • Embeddings          │                                                      │
│ • Content generation  │                                                      │
│                       │                                                      │
│ CUSTOM/FINE-TUNED     │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ Domain-specific models│                                                      │
│ • Astrology model     │ Trained on astrological data                        │
│ • Career coaching model│ Trained on career data                              │
│ • Legal guidance model│ Trained on legal concepts                           │
│                       │                                                      │
│ Use Cases:            │                                                      │
│ • Vertical-specific AI│                                                      │
│ • Lower cost          │                                                      │
│ • Custom behavior     │                                                      │
│                       │                                                      │
└───────────────────────┴─────────────────────────────────────────────────────┘
```

### 2.2 LLM Request Flow

```yaml
LLMRequestFlow:
  
  Step_1_Route_Request:
    analyze_request:
      - complexity: [simple, moderate, complex]
      - latency_requirement: [real-time, standard, background]
      - cost_sensitivity: [low, medium, high]
    
    select_model:
      IF complexity=complex AND latency=standard:
        → Claude Opus 4.6
      IF complexity=moderate AND latency=real_time:
        → Claude Sonnet 4.6
      IF complexity=simple AND latency=real_time:
        → Claude Haiku 4.5 OR GPT-3.5
      IF domain_specific=True:
        → Custom fine-tuned model
  
  Step_2_Construct_Prompt:
    system_prompt: |
      You are an AI assistant for [vertical_name] consultancy.
      Follow these guidelines:
      - Provide accurate, helpful responses
      - Maintain professional tone
      - Consider user context from memory
      - Flag compliance issues if detected
    
    user_context: |
      User: {user_profile_summary}
      Previous interactions: {recent_history}
      Current session: {session_context}
      Query: {user_query}
    
    retrieval_context:
      - Query knowledge graph for relevant concepts
      - Search vector DB for similar cases
      - Retrieve domain-specific templates
    
    full_prompt: |
      {system_prompt}
      
      Context:
      {user_context}
      
      Relevant Knowledge:
      {retrieval_context}
      
      Task: {specific_task}
  
  Step_3_Execute_Request:
    - Send to selected LLM API
    - Apply rate limiting
    - Monitor response time
    - Cache frequent responses
  
  Step_4_Process_Response:
    - Validate response format
    - Apply safety filters
    - Extract key insights
    - Store in memory
    - Return to caller
  
  Step_5_Post_Process:
    - Log request/response for analytics
    - Update user context
    - Trigger follow-up actions if needed
```

---

## 3. NLP Services

### 3.1 Intent Detection

```yaml
IntentDetection:
  
  Supported_Intent_Categories:
    booking_intents:
      - book_session
      - check_availability
      - cancel_booking
      - reschedule_booking
      - extend_session
    
    search_intents:
      - find_consultant
      - search_by_vertical
      - search_by_price
      - search_by_rating
      - search_by_language
    
    query_intents:
      - ask_question
      - request_advice
      - get_recommendation
      - check_status
    
    payment_intents:
      - make_payment
      - check_balance
      - request_refund
      - view_invoice
    
    account_intents:
      - register_account
      - update_profile
      - check_subscription
      - manage_settings
    
  Detection_Config:
    model: fine-tuned transformer
    confidence_threshold: 0.7
    fallback_intent: general_query
    
  Output:
    primary_intent: String
    confidence: Decimal
    secondary_intents: [{intent, confidence}]
    entities: JSON
```

### 3.2 Entity Extraction

```yaml
EntityExtraction:
  
  Entity_Types:
    temporal_entities:
      - date
      - time
      - duration
      - timezone
      - recurring_pattern
    
    monetary_entities:
      - amount
      - currency
      - price_range
    
    person_entities:
      - consultant_name
      - user_reference
    
    location_entities:
      - region
      - country
      - timezone
    
    vertical_entities:
      - vertical_name
      - sub_vertical
      - expertise_area
    
    service_entities:
      - session_type
      - pricing_model
      - feature_name
    
  Domain_Specific_Entities:
    astrology:
      - zodiac_sign
      - planet
      - birth_chart_element
      - query_type (career, marriage, health)
    
    career:
      - industry
      - job_role
      - skill
      - company
      - experience_level
    
    legal:
      - legal_area
      - jurisdiction
      - document_type
      - case_type
  
  Extraction_Output:
    entities: [{type, value, confidence, position}]
    normalized_values: JSON
    relationships: [{entity1, entity2, relation}]
```

### 3.3 Sentiment Analysis

```yaml
SentimentAnalysis:
  
  Analysis_Dimensions:
    overall_sentiment:
      scale: -1.0 to 1.0
      labels: [negative, neutral, positive]
    
    emotional_categories:
      - anger
      - frustration
      - satisfaction
      - excitement
      - anxiety
      - gratitude
      - confusion
    
    urgency_level:
      scale: 0-3
      labels: [normal, elevated, urgent, emergency]
    
    engagement_level:
      scale: 0-3
      labels: [disengaged, passive, active, highly_engaged]
  
  Use_Cases:
    session_monitoring:
      - Track sentiment arc during session
      - Alert if sentiment drops sharply
      - Identify key moment timestamps
    
    review_analysis:
      - Auto-detect fake reviews
      - Extract improvement themes
      - Generate rating justification
    
    chat_triage:
      - Route urgent queries faster
      - Adjust response tone
      - Flag support needs
  
  Real_Time_Processing:
    update_interval: every_message
    historical_tracking: sentiment_arc
    threshold_alerts:
      negative_below: -0.5
      urgency_above: 2
```

---

## 4. Embedding & Vector Operations

### 4.1 Embedding Configuration

```yaml
EmbeddingConfiguration:
  
  Models:
    primary: OpenAI text-embedding-3-large
      dimensions: 1536
      cost_per_1k_tokens: $0.00013
    
    alternative: Cohere embed-multilingual
      dimensions: 1024
      supports: 100+ languages
    
    custom: Fine-tuned for platform
      dimensions: 768
      optimized_for: consultancy_domain
  
  Embedding_Types:
    user_profile:
      content: [demographics, preferences, history]
      update_frequency: on_profile_change
    
    consultant_profile:
      content: [expertise, bio, reviews, sessions]
      update_frequency: on_profile_change
    
    session_summary:
      content: [topics, insights, outcome]
      update_frequency: post_session
    
    message:
      content: [text content]
      update_frequency: real_time
    
    knowledge_item:
      content: [concept definition, examples]
      update_frequency: on_creation
  
  Vector_Operations:
    similarity_search:
      metric: cosine_similarity
      threshold: 0.75
      top_k: 10
    
    clustering:
      algorithm: k-means
      use_case: user_segmentation
    
    classification:
      use_case: intent_classification
```

### 4.2 Vector Database Operations

```yaml
VectorDatabaseOperations:
  
  Pinecone_Configuration:
    index_name: consultancy-vectors
    dimension: 1536
    metric: cosine
    pods: 6
    replicas: 2
    
    namespaces:
      - user_profiles
      - consultant_profiles
      - session_summaries
      - knowledge_base
      - messages
  
  Operations:
    upsert:
      - Generate embedding
      - Store with metadata
      - Link to source entity
    
    query:
      - Generate query embedding
      - Search by similarity
      - Filter by metadata
      - Return top matches
    
    update:
      - Fetch existing vector
      - Merge with new data
      - Re-embedding if significant change
    
    delete:
      - Remove vector on entity deletion
      - Update indexes
```

---

## 5. Speech Processing

### 5.1 Speech-to-Text (Transcription)

```yaml
SpeechToText:
  
  Provider: Whisper (OpenAI)
  
  Models:
    whisper-large-v3:
      accuracy: highest
      speed: ~30 seconds audio per second processing
      supports: 99 languages
    
    whisper-medium:
      accuracy: high
      speed: faster
      supports: 80 languages
  
  Configuration:
    language_detection: automatic
    timestamp_granularity: word_level
    punctuation: true
    speaker_diarization: true (identify speakers)
  
  Real_Time_Transcription:
    chunk_size: 5 seconds
    streaming: WebSocket
    display: live subtitles
    
  Post_Session:
    full_transcription: generate after session
    speaker_identification: consultant vs seeker
    entity_extraction: on transcript
    summary_generation: from transcript
```

### 5.2 Text-to-Speech

```yaml
TextToSpeech:
  
  Provider: ElevenLabs
  
  Voices:
    - professional_male
    - professional_female
    - warm_male
    - warm_female
    - custom_consultant_voice (voice cloning)
  
  Use_Cases:
    ai_chatbot_voice:
      - Voice responses for chatbot
      - Language matching
    
    notification_voice:
      - WhatsApp voice messages
      - Session reminders
    
    content_narration:
      - Class audio versions
      - Podcast-style summaries
  
  Configuration:
    quality: high_definition
    speed: 1.0 (adjustable)
    language: match_user_language
```

---

## 6. Knowledge Retrieval (RAG)

### 6.1 RAG Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RAG (Retrieval-Augmented Generation) PIPELINE             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Query Input                                                                │
│  │                                                                          │
│  ▼                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Step 1: Query Understanding                                            ││
│  │                                                                         ││
│  │ • Intent detection                                                      ││
│  │ • Entity extraction                                                      ││
│  │ • Query expansion                                                       ││
│  │ • Generate query embedding                                               ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  │                                                                          │
│  ▼                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Step 2: Multi-Source Retrieval                                         ││
│  │                                                                         ││
│  │ Sources:                                                                ││
│  │ • Vector DB (semantic similarity)                                       ││
│  │ • Knowledge Graph (entity relationships)                                ││
│  │ • Document DB (structured content)                                      ││
│  │ • User Memory (personalization)                                         ││
│  │                                                                         ││
│  │ Top-K retrieval from each source                                        ││
│  │ Re-rank by relevance                                                     ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  │                                                                          │
│  ▼                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Step 3: Context Construction                                            ││
│  │                                                                         ││
│  │ • Combine retrieved items                                                ││
│  │ • Deduplicate overlapping content                                       ││
│  │ • Limit to token budget                                                 ││
│  │ • Add metadata (source, confidence)                                      ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  │                                                                          │
│  ▼                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Step 4: Prompt Augmentation                                             ││
│  │                                                                         ││
│  │ System Prompt + User Query + Retrieved Context → Full Prompt            ││
│  │                                                                         ││
│  │ Example:                                                                 ││
│  │ "Based on the following relevant information:                           ││
│  │  [Retrieved Knowledge]                                                   ││
│  │  And considering the user's context:                                     ││
│  │  [User Memory]                                                           ││
│  │  Answer the query: [User Query]"                                        ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  │                                                                          │
│  ▼                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Step 5: LLM Generation                                                  ││
│  │                                                                         ││
│  │ • Send augmented prompt to LLM                                          ││
│  │ • Generate response                                                      ││
│  │ • Apply safety filters                                                   ││
│  │ • Format for output                                                      ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  │                                                                          │
│  ▼                                                                          │
│  Response Output                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Agentic AI System

### 7.1 Agent Prompt Templates

```yaml
AgentPromptTemplates:
  
  MasterOrchestrator:
    system_prompt: |
      You are the Master Brain Orchestrator, responsible for:
      - Managing global context
      - Spawning and coordinating specialist agents
      - Resolving conflicts between agents
      - Setting platform-wide goals
      
      Available specialist agents:
      {agent_list}
      
      Current platform state:
      {platform_state}
      
      Task: {task_description}
  
  MatchingAgent:
    system_prompt: |
      You are the Consultant Matching Agent.
      
      Your goal: Find the best consultant for a user query.
      
      Matching criteria to consider:
      1. User intent and needs
      2. Consultant expertise alignment
      3. User preferences and history
      4. Consultant ratings and reviews
      5. Availability and pricing
      6. Language compatibility
      
      Retrieved context:
      {retrieved_context}
      
      User profile:
      {user_profile}
      
      User query:
      {user_query}
      
      Output format: Ranked consultant list with match scores and reasons.
  
  ConsultantCopilot:
    system_prompt: |
      You are the Consultant Copilot AI, assisting {consultant_name}.
      
      Domain: {vertical_name}
      
      Available knowledge:
      {domain_knowledge}
      
      Client context:
      {client_context}
      
      Session so far:
      {session_transcript}
      
      Provide:
      1. Real-time suggestions
      2. Knowledge retrieval
      3. Question prompts
      4. Follow-up recommendations
      
      Constraints:
      - Never make medical/legal diagnoses
      - Suggest, don't replace consultant decisions
      - Flag compliance issues
  
  UserChatbot:
    system_prompt: |
      You are the User Assistant Chatbot.
      
      Your role:
      - Understand user needs
      - Guide to appropriate consultants
      - Answer platform questions
      - Help with bookings
      
      User profile:
      {user_profile}
      
      Conversation history:
      {conversation_history}
      
      Available consultants:
      {matching_results}
      
      Response tone: Friendly, helpful, professional
      Language: {user_language}
```

---

## Next Steps

1. See [Brain Architecture](../architecture/brain-architecture.md) for memory integration
2. Review [AI Agent System](../architecture/ai-agent-system.md) for agent hierarchy
3. Check [Verticals Expansion](../modules/verticals-expansion.md) for domain-specific AI

---

**Return to:** [CLAUDE.md](../CLAUDE.md) - Master Architecture Index