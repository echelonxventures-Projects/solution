# Database Schema - Polyglot Persistence Design

> **Document Version:** 1.0
> **Last Updated:** 2026-04-13
> **Owner:** Solution Architect
> **Related:** [CLAUDE.md](../CLAUDE.md) - Master Index

---

## 1. Database Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    POLYGLOT PERSISTENCE ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│   │ PostgreSQL      │ │ MongoDB         │ │ Redis           │              │
│   │ (Transactional) │ │ (Documents)     │ │ (Cache/Queue)   │              │
│   └─────────────────┘ └─────────────────┘ └─────────────────┘              │
│                                                                             │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│   │ ElasticSearch   │ │ TimescaleDB     │ │ Pinecone        │              │
│   │ (Search)        │ │ (Time-series)   │ │ (Vectors)       │              │
│   └─────────────────┘ └─────────────────┘ └─────────────────┘              │
│                                                                             │
│   ┌─────────────────┐ ┌─────────────────┐                                  │
│   │ Neo4j           │ │ S3/MinIO        │                                  │
│   │ (Graph)         │ │ (Object Store)  │                                  │
│   └─────────────────┘ └─────────────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. PostgreSQL Schema (Primary)

### 2.1 Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'seeker',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  verified BOOLEAN DEFAULT FALSE,
  verification_level VARCHAR(50) DEFAULT 'none',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_method VARCHAR(50),
  
  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  date_of_birth DATE,
  gender VARCHAR(50),
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  currency_preference VARCHAR(10) DEFAULT 'USD',
  region VARCHAR(10),
  
  -- Settings (JSON)
  notification_settings JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  communication_prefs JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_region ON users(region);
```

### 2.2 Consultants Table

```sql
CREATE TABLE consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  verification_status VARCHAR(50) DEFAULT 'unverified',
  verification_documents JSONB DEFAULT '{}',
  
  -- Professional Info
  title VARCHAR(100),
  professional_bio TEXT,
  years_of_experience INTEGER DEFAULT 0,
  education JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  languages_spoken JSONB DEFAULT '[]',
  specializations JSONB DEFAULT '[]',
  
  -- Service Config
  service_types JSONB DEFAULT '["video","audio","chat"]',
  pricing_model VARCHAR(50) DEFAULT 'per_session',
  base_rate DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  session_duration_options JSONB DEFAULT '[30,45,60,90]',
  max_concurrent_sessions INTEGER DEFAULT 1,
  buffer_time INTEGER DEFAULT 15,
  
  -- Availability
  availability_type VARCHAR(50) DEFAULT 'fixed',
  weekly_schedule JSONB DEFAULT '{}',
  blackout_dates JSONB DEFAULT '[]',
  instant_booking_enabled BOOLEAN DEFAULT FALSE,
  advance_booking_limit INTEGER DEFAULT 30,
  cancellation_policy JSONB DEFAULT '{}',
  
  -- Metrics
  total_sessions INTEGER DEFAULT 0,
  total_hours DECIMAL(10,2) DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  repeat_client_rate DECIMAL(5,2) DEFAULT 0,
  response_time_avg INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  earnings_total DECIMAL(12,2) DEFAULT 0,
  earnings_this_month DECIMAL(12,2) DEFAULT 0,
  
  -- AI Config
  ai_copilot_enabled BOOLEAN DEFAULT TRUE,
  ai_copilot_config JSONB DEFAULT '{}',
  custom_prompts JSONB DEFAULT '{}',
  knowledge_base_enabled BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_consultants_user_id ON consultants(user_id);
CREATE INDEX idx_consultants_status ON consultants(status);
CREATE INDEX idx_consultants_verification_status ON consultants(verification_status);
CREATE INDEX idx_consultants_average_rating ON consultants(average_rating DESC);
CREATE INDEX idx_consultants_total_sessions ON consultants(total_sessions DESC);
```

### 2.3 Verticals Table

```sql
CREATE TABLE verticals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  name_translations JSONB DEFAULT '{}',
  description TEXT,
  description_translations JSONB DEFAULT '{}',
  parent_id UUID REFERENCES verticals(id),
  level INTEGER DEFAULT 0,
  icon_url TEXT,
  banner_url TEXT,
  color_code VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  
  -- Configuration
  requires_verification BOOLEAN DEFAULT FALSE,
  verification_level_req VARCHAR(50) DEFAULT 'none',
  min_experience_years INTEGER DEFAULT 0,
  required_certifications JSONB DEFAULT '[]',
  session_types_allowed JSONB DEFAULT '["video","audio","chat"]',
  pricing_models_allowed JSONB DEFAULT '["per_minute","per_hour","per_session","package"]',
  default_pricing JSONB DEFAULT '{}',
  compliance_requirements JSONB DEFAULT '{}',
  
  -- AI Config
  ai_matching_config JSONB DEFAULT '{}',
  domain_knowledge_base BOOLEAN DEFAULT FALSE,
  ai_prompt_templates JSONB DEFAULT '{}',
  specialized_entities JSONB DEFAULT '[]',
  
  -- Metrics
  total_consultants INTEGER DEFAULT 0,
  active_consultants INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  popularity_score DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verticals_code ON verticals(code);
CREATE INDEX idx_verticals_parent_id ON verticals(parent_id);
CREATE INDEX idx_verticals_is_active ON verticals(is_active);
CREATE INDEX idx_verticals_is_featured ON verticals(is_featured);
```

### 2.4 Consultant Verticals (Many-to-Many)

```sql
CREATE TABLE consultant_verticals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  vertical_id UUID NOT NULL REFERENCES verticals(id) ON DELETE CASCADE,
  expertise_level VARCHAR(50) DEFAULT 'intermediate',
  years_in_vertical INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(consultant_id, vertical_id)
);

CREATE INDEX idx_consultant_verticals_consultant_id ON consultant_verticals(consultant_id);
CREATE INDEX idx_consultant_verticals_vertical_id ON consultant_verticals(vertical_id);
```

### 2.5 Bookings Table

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id UUID NOT NULL REFERENCES users(id),
  consultant_id UUID NOT NULL REFERENCES consultants(id),
  vertical_id UUID NOT NULL REFERENCES verticals(id),
  slot_id UUID,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  
  -- Schedule
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone VARCHAR(50) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  session_type VARCHAR(50) NOT NULL DEFAULT 'video',
  location_type VARCHAR(50) DEFAULT 'online',
  location_address TEXT,
  
  -- Pricing
  pricing_model VARCHAR(50) NOT NULL,
  base_amount DECIMAL(10,2) NOT NULL,
  duration_charge DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  consultant_earnings DECIMAL(10,2),
  currency VARCHAR(10) NOT NULL,
  discount_applied DECIMAL(10,2) DEFAULT 0,
  discount_code VARCHAR(50),
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  
  -- Context
  topic VARCHAR(255),
  description TEXT,
  urgency_level VARCHAR(50) DEFAULT 'normal',
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  first_time_client BOOLEAN DEFAULT FALSE,
  recurring_booking_id UUID REFERENCES bookings(id),
  
  -- AI
  ai_match_score DECIMAL(5,2),
  ai_match_reason TEXT,
  ai_suggested_questions JSONB DEFAULT '[]',
  ai_session_summary TEXT,
  ai_insights JSONB DEFAULT '{}',
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_1h_sent BOOLEAN DEFAULT FALSE,
  reminder_15m_sent BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES users(id)
);

CREATE INDEX idx_bookings_seeker_id ON bookings(seeker_id);
CREATE INDEX idx_bookings_consultant_id ON bookings(consultant_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled_start ON bookings(scheduled_start);
CREATE INDEX idx_bookings_vertical_id ON bookings(vertical_id);
```

### 2.6 Sessions Table

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  status VARCHAR(50) NOT NULL DEFAULT 'initializing',
  session_type VARCHAR(50) NOT NULL DEFAULT 'video',
  
  -- Participants
  consultant_id UUID NOT NULL REFERENCES users(id),
  seeker_id UUID NOT NULL REFERENCES users(id),
  consultant_joined_at TIMESTAMP WITH TIME ZONE,
  seeker_joined_at TIMESTAMP WITH TIME ZONE,
  consultant_left_at TIMESTAMP WITH TIME ZONE,
  seeker_left_at TIMESTAMP WITH TIME ZONE,
  
  -- WebRTC
  room_id VARCHAR(100) UNIQUE NOT NULL,
  server_region VARCHAR(50),
  video_enabled BOOLEAN DEFAULT TRUE,
  audio_enabled BOOLEAN DEFAULT TRUE,
  chat_enabled BOOLEAN DEFAULT TRUE,
  screen_share_enabled BOOLEAN DEFAULT FALSE,
  recording_enabled BOOLEAN DEFAULT FALSE,
  recording_url TEXT,
  recording_duration INTEGER DEFAULT 0,
  
  -- Quality
  video_quality_avg VARCHAR(50),
  audio_quality_avg DECIMAL(3,2),
  connection_stability DECIMAL(5,2),
  packet_loss_avg DECIMAL(5,2),
  latency_avg INTEGER,
  jitter_avg INTEGER,
  
  -- AI Processing
  transcription_status VARCHAR(50) DEFAULT 'none',
  transcription_url TEXT,
  translation_enabled BOOLEAN DEFAULT FALSE,
  translation_languages JSONB DEFAULT '[]',
  ai_copilot_active BOOLEAN DEFAULT FALSE,
  ai_suggestions_count INTEGER DEFAULT 0,
  ai_insights_generated BOOLEAN DEFAULT FALSE,
  sentiment_analysis JSONB DEFAULT '{}',
  
  -- Billing
  billing_model VARCHAR(50),
  billing_start TIMESTAMP WITH TIME ZONE,
  billing_end TIMESTAMP WITH TIME ZONE,
  billable_duration INTEGER DEFAULT 0,
  billed_amount DECIMAL(10,2),
  currency VARCHAR(10),
  
  -- Post-session
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_scheduled BOOLEAN DEFAULT FALSE,
  notes_shared BOOLEAN DEFAULT FALSE,
  resources_shared JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  actual_duration INTEGER DEFAULT 0
);

CREATE INDEX idx_sessions_booking_id ON sessions(booking_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_room_id ON sessions(room_id);
CREATE INDEX idx_sessions_consultant_id ON sessions(consultant_id);
CREATE INDEX idx_sessions_seeker_id ON sessions(seeker_id);
```

### 2.7 Payments Table

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  payment_type VARCHAR(50) NOT NULL,
  reference_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  
  -- Amount
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  platform_fee DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(12,2) NOT NULL,
  exchange_rate DECIMAL(10,6),
  
  -- Payment Method
  payment_method VARCHAR(50),
  payment_provider VARCHAR(50),
  provider_transaction_id VARCHAR(255),
  card_last_four VARCHAR(10),
  card_brand VARCHAR(50),
  
  -- Receiver
  receiver_id UUID REFERENCES users(id),
  receiver_amount DECIMAL(12,2),
  payout_status VARCHAR(50) DEFAULT 'pending',
  payout_id UUID,
  
  -- Refund
  refund_amount DECIMAL(12,2),
  refund_reason TEXT,
  refund_type VARCHAR(50),
  refund_provider_id VARCHAR(255),
  
  -- Fraud
  fraud_score DECIMAL(5,2),
  fraud_checks JSONB DEFAULT '{}',
  verified_by_3ds BOOLEAN DEFAULT FALSE,
  risk_level VARCHAR(50) DEFAULT 'low',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_type ON payments(payment_type);
CREATE INDEX idx_payments_reference_id ON payments(reference_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);
```

### 2.8 Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  plan_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  subscription_type VARCHAR(50) NOT NULL,
  
  -- Billing
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  billing_cycle VARCHAR(50) NOT NULL,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  last_billing_date TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT TRUE,
  
  -- Usage
  sessions_used INTEGER DEFAULT 0,
  sessions_limit INTEGER DEFAULT -1,
  minutes_used INTEGER DEFAULT 0,
  minutes_limit INTEGER DEFAULT -1,
  content_accessed INTEGER DEFAULT 0,
  content_limit INTEGER DEFAULT -1,
  
  -- Features
  features_enabled JSONB DEFAULT '{}',
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  priority_support BOOLEAN DEFAULT FALSE,
  ai_features_enabled BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);
```

### 2.9 Reviews Table

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  review_type VARCHAR(50) NOT NULL,
  reference_id UUID NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Detailed Ratings
  detailed_ratings JSONB DEFAULT '{}',
  
  -- AI Analysis
  ai_sentiment VARCHAR(50),
  ai_sentiment_score DECIMAL(5,2),
  ai_keywords JSONB DEFAULT '[]',
  ai_categories JSONB DEFAULT '[]',
  ai_fake_detection_score DECIMAL(5,2),
  
  -- Response
  has_response BOOLEAN DEFAULT FALSE,
  response_text TEXT,
  response_at TIMESTAMP WITH TIME ZONE,
  responder_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reference_id ON reviews(reference_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
```

### 2.10 Slots Table

```sql
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES consultants(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone VARCHAR(50) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'available',
  booking_id UUID REFERENCES bookings(id),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_slots_consultant_id ON slots(consultant_id);
CREATE INDEX idx_slots_start_time ON slots(start_time);
CREATE INDEX idx_slots_status ON slots(status);
```

---

## 3. MongoDB Collections

### 3.1 Messages Collection

```javascript
{
  _id: ObjectId,
  conversation_id: UUID,
  sender_id: UUID,
  receiver_id: UUID,
  message_type: String, // text, image, file, audio, video, system
  status: String, // sent, delivered, read, failed
  
  content: {
    text: String,
    media_url: String,
    media_type: String,
    attachments: Array
  },
  
  ai_processing: {
    intent: String,
    entities: Object,
    sentiment: Number,
    suggested_response: String,
    embedding: Array
  },
  
  metadata: {
    channel: String,
    external_message_id: String,
    thread_id: UUID,
    reply_to_id: UUID
  },
  
  created_at: ISODate,
  read_at: ISODate,
  edited_at: ISODate,
  deleted_at: ISODate
}
```

### 3.2 Session Transcripts Collection

```javascript
{
  _id: ObjectId,
  session_id: UUID,
  
  transcript: [
    {
      speaker: String, // consultant, seeker
      speaker_id: UUID,
      timestamp: ISODate,
      text: String,
      language: String,
      confidence: Number
    }
  ],
  
  ai_summary: {
    key_topics: Array,
    insights: Array,
    recommendations: Array,
    follow_up_suggestions: Array
  },
  
  sentiment_arc: [
    {
      timestamp: ISODate,
      sentiment_score: Number,
      emotional_category: String
    }
  ],
  
  created_at: ISODate,
  updated_at: ISODate
}
```

### 3.3 Content Transcripts Collection

```javascript
{
  _id: ObjectId,
  content_id: UUID,
  
  transcript: String,
  chapters: [
    {
      title: String,
      start_time: Number,
      end_time: Number,
      summary: String
    }
  ],
  
  ai_processing: {
    summary: String,
    keywords: Array,
    key_concepts: Array,
    quiz_questions: Array
  },
  
  embedding: Array,
  
  created_at: ISODate
}
```

---

## 4. Redis Key Structures

```
# Session Management
session:{session_id}:participants -> SET {consultant_id, seeker_id}
session:{session_id}:state -> JSON {video, audio, recording, duration}
session:{session_id}:billing -> JSON {start_time, rate, elapsed_seconds}

# User State
user:{user_id}:online -> BOOLEAN
user:{user_id}:active_session -> UUID
user:{user_id}:typing:{conversation_id} -> BOOLEAN

# Consultant Availability Cache
consultant:{consultant_id}:slots:{date} -> JSON {available_slots}
consultant:{consultant_id}:next_available -> TIMESTAMP

# Rate Limiting
ratelimit:{user_id}:{endpoint} -> COUNTER (TTL 60s)

# Authentication
refresh_token:{token_family} -> JSON {user_id, created_at}
session:{session_id}:access_tokens -> SET

# Caching
cache:consultant:{consultant_id}:profile -> JSON
cache:vertical:{vertical_id}:consultants -> LIST
cache:pricing:{vertical_id}:{consultant_id} -> JSON

# Queue
queue:notification -> LIST
queue:transcription -> LIST
queue:embedding -> LIST
```

---

## 5. Vector Database Schema (Pinecone)

```yaml
# Namespace: user_profiles
Vector:
  id: user_{user_id}
  values: [1536 floats]
  metadata:
    user_type: seeker/consultant
    primary_verticals: [vertical_ids]
    language: String
    region: String
    subscription_tier: String

# Namespace: consultant_profiles
Vector:
  id: consultant_{consultant_id}
  values: [1536 floats]
  metadata:
    verticals: [vertical_codes]
    expertise_level: String
    languages: [String]
    rating: Float
    price_range: {min, max}

# Namespace: session_summaries
Vector:
  id: session_{session_id}
  values: [1536 floats]
  metadata:
    vertical: String
    consultant_id: UUID
    seeker_id: UUID
    outcome: String
    rating: Integer
    created_at: Timestamp

# Namespace: knowledge_base
Vector:
  id: kb_{vertical_code}_{concept}
  values: [1536 floats]
  metadata:
    vertical: String
    concept_type: String
    description: String
```

---

## Next Steps

1. See [Domain Models](../architecture/domain-models.md) for entity definitions
2. Review [Service Architecture](../architecture/service-architecture.md) for data access
3. Check [Infrastructure](../architecture/infrastructure.md) for database deployment

---

**Return to:** [CLAUDE.md](../CLAUDE.md) - Master Architecture Index