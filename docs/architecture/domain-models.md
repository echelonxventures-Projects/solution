# Domain Models - Core Business Entities

> **Document Version:** 1.0
> **Last Updated:** 2026-04-13
> **Owner:** Solution Architect
> **Related:** [CLAUDE.md](../CLAUDE.md) - Master Index

---

## 1. Domain Overview

This document defines the core business entities and their relationships for the online consultancy platform.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DOMAIN MODEL OVERVIEW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────┐     ┌─────────────┐     ┌─────────────┐                      │
│   │  USER   │────►│ CONSULTANT  │────►│  SESSION    │                      │
│   │         │     │             │     │             │                      │
│   └───┬─────┘     └──────┬──────┘     └──────┬──────┘                      │
│       │                  │                   │                              │
│       │                  │                   │                              │
│       ▼                  ▼                   ▼                              │
│   ┌─────────┐     ┌─────────────┐     ┌─────────────┐                      │
│   │ BOOKING │     │ CONTENT     │     │  PAYMENT    │                      │
│   │         │     │             │     │             │                      │
│   └────┬────┘     └──────┬──────┘     └──────┬──────┘                      │
│        │                  │                   │                              │
│        │                  │                   │                              │
│        ▼                  ▼                   ▼                              │
│   ┌─────────┐     ┌─────────────┐     ┌─────────────┐                      │
│   │SUBSCRIPTION│ │ REVIEW      │     │ TRANSACTION │                      │
│   │         │     │             │     │             │                      │
│   └─────────┘     └─────────────┘     └─────────────┘                      │
│                                                                             │
│   ┌─────────┐     ┌─────────────┐     ┌─────────────┐                      │
│   │ VERTICAL│     │ SLOT        │     │ MESSAGE     │                      │
│   │         │     │             │     │             │                      │
│   └─────────┘     └─────────────┘     └─────────────┘                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Entities

### 2.1 User Entity

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER ENTITY                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Entity: User                                                                │
│  Description: Platform users (Seekers, Consultants, Admins)                 │
│  Database: PostgreSQL (primary), MongoDB (profile_extended)                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        ATTRIBUTES                                       ││
│  ├────────────────────────┬────────────────────────────────────────────────┤│
│  │ Attribute              │ Description                                   ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ id                     │ UUID (Primary Key)                             ││
│  │ email                  │ String (Unique, Encrypted)                     ││
│  │ phone                  │ String (Unique, Encrypted)                     ││
│  │ password_hash          │ String (bcrypt/scrypt)                         ││
│  │ role                   │ ENUM: seeker, consultant, admin, enterprise    ││
│  │ status                 │ ENUM: active, suspended, pending, deleted       ││
│  │ verified               │ Boolean (email/phone verified)                 ││
│  │ verification_level     │ ENUM: none, basic, enhanced, premium           ││
│  │ created_at             │ Timestamp                                      ││
│  │ updated_at             │ Timestamp                                      ││
│  │ last_login             │ Timestamp                                      ││
│  │ timezone               │ String (IANA timezone)                         ││
│  │ language               │ String (ISO 639-1)                             ││
│  │ currency_preference    │ String (ISO 4217)                              ││
│  │ region                 │ String (ISO 3166-1 alpha-2)                    ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ PROFILE ATTRIBUTES                             ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ first_name             │ String                                         ││
│  │ last_name              │ String                                         ││
│  │ display_name           │ String                                         ││
│  │ avatar_url             │ String (URL)                                   ││
│  │ bio                    │ String (Text)                                  ││
│  │ date_of_birth          │ Date (Encrypted)                               ││
│  │ gender                 │ ENUM: male, female, other, unspecified         ││
│  │ address                │ JSON (Encrypted)                               ││
│  │ social_links           │ JSON (LinkedIn, Twitter, etc.)                 ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ SETTINGS                                       ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ notification_settings  │ JSON (email, sms, push, whatsapp)              ││
│  │ privacy_settings       │ JSON (profile_visibility, data_sharing)        ││
│  │ communication_prefs    │ JSON (video, audio, chat preferred)            ││
│  │ marketing_consent      │ Boolean                                        ││
│  │ two_factor_enabled     │ Boolean                                        ││
│  │ two_factor_method      │ ENUM: sms, email, app, hardware_key            ││
│  └────────────────────────┴────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        RELATIONSHIPS                                    ││
│  ├────────────────────────┬────────────────────────────────────────────────┤│
│  │ Relationship           │ Description                                   ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ has_many bookings      │ As seeker or consultant                        ││
│  │ has_many sessions      │ As participant                                 ││
│  │ has_many payments      │ As payer or receiver                           ││
│  │ has_many reviews       │ As reviewer or reviewed                        ││
│  │ has_many messages      │ As sender or receiver                          ││
│  │ has_one subscription   │ If subscriber                                  ││
│  │ has_one consultant_profile │ If role=consultant                          ││
│  │ has_many notifications │ As recipient                                   ││
│  │ has_many devices       │ For multi-device support                       ││
│  └────────────────────────┴────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        INDEXES                                          ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ PRIMARY: id                                                              ││
│  │ UNIQUE: email, phone                                                     ││
│  │ INDEX: role, status, region, created_at                                  ││
│  │ COMPOSITE: (role, status) for active consultant queries                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 Consultant Entity

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CONSULTANT ENTITY                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Entity: Consultant                                                          │
│  Description: Expert profiles offering consultancy services                  │
│  Database: PostgreSQL (primary), MongoDB (extended), Neo4j (relationships)  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        ATTRIBUTES                                       ││
│  ├────────────────────────┬────────────────────────────────────────────────┤│
│  │ Attribute              │ Description                                   ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ id                     │ UUID (Primary Key)                             ││
│  │ user_id                │ UUID (FK → User)                               ││
│  │ status                 │ ENUM: pending, approved, suspended, inactive   ││
│  │ verification_status    │ ENUM: unverified, basic, enhanced, premium     ││
│  │ verification_documents │ JSON (certificate URLs, credentials)           ││
│  │ created_at             │ Timestamp                                      ││
│  │ updated_at             │ Timestamp                                      ││
│  │ approved_at            │ Timestamp (null if pending)                    ││
│  │ approved_by            │ UUID (FK → Admin User)                         ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ PROFESSIONAL INFO                              ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ title                  │ String (e.g., "Dr.", "Astrologer", "Coach")    ││
│  │ professional_bio       │ Text (detailed expertise description)          ││
│  │ years_of_experience    │ Integer                                        ││
│  │ education              │ JSON [{degree, institution, year}]             ││
│  │ certifications         │ JSON [{name, issuer, year, url}]               ││
│  │ languages_spoken       │ Array[String] (ISO 639-1)                      ││
│  │ specializations        │ Array[String]                                  ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ SERVICE CONFIG                                 ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ verticals              │ Array[UUID] (FK → Vertical)                    ││
│  │ service_types          │ Array[ENUM] (video, audio, chat, in_person)    ││
│  │ pricing_model          │ ENUM: per_minute, per_hour, per_session, pack  ││
│  │ base_rate              │ Decimal (minimum rate per unit)                ││
│  │ currency               │ String (ISO 4217)                              ││
│  │ session_duration_options│ Array[Integer] (minutes: 15,30,45,60,90...)   ││
│  │ max_concurrent_sessions│ Integer (default: 1)                           ││
│  │ buffer_time            │ Integer (minutes between sessions)             ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ AVAILABILITY                                   ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ availability_type      │ ENUM: fixed, dynamic, always_available         ││
│  │ weekly_schedule        │ JSON {day: {start, end, slots}}               ││
│  │ timezone               │ String (IANA)                                  ││
│  │ blackout_dates         │ Array[Date] (vacation, holidays)               ││
│  │ instant_booking_enabled│ Boolean                                        ││
│  │ advance_booking_limit  │ Integer (days)                                 ││
│  │ cancellation_policy    │ JSON {hours_before, refund_percentage}         ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ METRICS & RATINGS                              ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ total_sessions         │ Integer                                        ││
│  │ total_hours            │ Decimal                                        ││
│  │ average_rating         │ Decimal (1.00-5.00)                            ││
│  │ total_reviews          │ Integer                                        ││
│  │ repeat_client_rate     │ Decimal (percentage)                           ││
│  │ response_time_avg      │ Integer (seconds)                              ││
│  │ completion_rate        │ Decimal (percentage)                           ││
│  │ earnings_total         │ Decimal                                        ││
│  │ earnings_this_month    │ Decimal                                        ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ AI CONFIG                                      ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ ai_copilot_enabled     │ Boolean                                        ││
│  │ ai_copilot_config      │ JSON {suggestions_enabled, auto_summary...}    ││
│  │ custom_prompts         │ JSON {greeting, follow_up, closing}            ││
│  │ knowledge_base_enabled │ Boolean                                        ││
│  │ knowledge_base_items   │ Integer (count)                                ││
│  └────────────────────────┴────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        RELATIONSHIPS                                    ││
│  ├────────────────────────┬────────────────────────────────────────────────┤│
│  │ belongs_to user        │ One-to-one with User entity                    ││
│  │ has_many verticals     │ Many-to-many through ConsultantVertical        ││
│  │ has_many bookings      │ As service provider                            ││
│  │ has_many sessions      │ As consultant                                  ││
│  │ has_many reviews       │ Received from seekers                          ││
│  │ has_many slots         │ Availability slots                             ││
│  │ has_many contents      │ Recorded classes, articles                     ││
│  │ has_many payouts       │ Payment disbursements                          ││
│  │ has_one balance        │ Consultant wallet/balance                      ││
│  └────────────────────────┴────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.3 Vertical Entity

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VERTICAL ENTITY                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Entity: Vertical                                                            │
│  Description: Consultancy categories (Astrology, Legal, Career, etc.)       │
│  Database: PostgreSQL (primary), Neo4j (hierarchy)                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        ATTRIBUTES                                       ││
│  ├────────────────────────┬────────────────────────────────────────────────┤│
│  │ Attribute              │ Description                                   ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ id                     │ UUID (Primary Key)                             ││
│  │ code                   │ String (Unique: ASTRO, LEGAL, CAREER...)       ││
│  │ name                   │ String                                         ││
│  │ name_translations      │ JSON {lang: name}                              ││
│  │ description            │ Text                                           ││
│  │ description_translations│ JSON {lang: desc}                             ││
│  │ parent_id              │ UUID (FK → Vertical, for sub-verticals)        ││
│  │ level                  │ Integer (hierarchy depth)                      ││
│  │ icon_url               │ String (URL)                                   ││
│  │ banner_url             │ String (URL)                                   ││
│  │ color_code             │ String (hex)                                   ││
│  │ is_active              │ Boolean                                        ││
│  │ is_featured            │ Boolean                                        ││
│  │ sort_order             │ Integer                                        ││
│  │ created_at             │ Timestamp                                      ││
│  │ updated_at             │ Timestamp                                      ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ CONFIGURATION                                  ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ requires_verification  │ Boolean                                        ││
│  │ verification_level_req │ ENUM: none, basic, enhanced, premium           ││
│  │ min_experience_years   │ Integer                                        ││
│  │ required_certifications│ Array[String]                                  ││
│  │ session_types_allowed  │ Array[ENUM] (video, audio, chat, in_person)    ││
│  │ pricing_models_allowed │ Array[ENUM]                                    ││
│  │ default_pricing        │ JSON {suggested_rates}                         ││
│  │ compliance_requirements│ JSON (HIPAA for health, etc.)                  ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ AI CONFIG                                      ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ ai_matching_config     │ JSON {weight_factors, matching_criteria}       ││
│  │ domain_knowledge_base  │ Boolean (has specialized KB)                   ││
│  │ ai_prompt_templates    │ JSON {consultation, follow_up, summary}        ││
│  │ specialized_entities   │ Array[String] (domain-specific entities)       ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ METRICS                                        ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ total_consultants      │ Integer                                        ││
│  │ active_consultants     │ Integer                                        ││
│  │ total_sessions         │ Integer                                        ││
│  │ total_revenue          │ Decimal                                        ││
│  │ avg_rating             │ Decimal                                        ││
│  │ popularity_score       │ Decimal                                        ││
│  └────────────────────────┴────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        SAMPLE VERTICALS                                 ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │  ASTROLOGY           │ LEGAL              │ CAREER                      ││
│  │  ├── Vedic Astro     │ ├── Corporate Law  │ ├── Career Counseling       ││
│  │  ├── Western Astro   │ ├── Family Law     │ ├── Interview Prep          ││
│  │  ├── Chinese Astro   │ ├── Criminal Law   │ ├── Resume Writing          ││
│  │  ├── Numerology      │ ├── IP Law         │ ├── Career Transition       ││
│  │  └── Tarot Reading   │ └── Tax Law        │ └ Executive Coaching       ││
│  │                                                                         ││
│  │  EDUCATION           │ FINANCE            │ HEALTH                      ││
│  │  ├── Tutoring        │ ├── Investment     │ ├── Nutrition               ││
│  │  ├── Study Abroad    │ ├── Tax Planning   │ ├── Fitness                 ││
│  │  ├── Exam Prep       │ ├── Wealth Mgmt    │ ├── Mental Health           ││
│  │  └── College Admit   │ ├── Insurance      │ ├── Yoga/Meditation         ││
│  │                                                                         ││
│  │  MARRIAGE           │ CHILD CARE         │ PERSONAL                    ││
│  │  ├── Marriage Counsel│ ├── Parenting      │ ├── Life Coaching           ││
│  │  ├── Relationship    │ ├── Child Dev      │ ├── Stress Management       ││
│  │  ├── Pre-marriage    │ ├── Education      │ ├── Self Development        ││
│  │  └── Divorce Counsel │ └ Behavior        │ └ Mindfulness              ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.4 Booking Entity

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BOOKING ENTITY                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Entity: Booking                                                             │
│  Description: Appointment booking between seeker and consultant              │
│  Database: PostgreSQL (primary), MongoDB (extended context)                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        ATTRIBUTES                                       ││
│  ├────────────────────────┬────────────────────────────────────────────────┤│
│  │ Attribute              │ Description                                   ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ id                     │ UUID (Primary Key)                             ││
│  │ seeker_id              │ UUID (FK → User)                               ││
│  │ consultant_id          │ UUID (FK → Consultant)                         ││
│  │ vertical_id            │ UUID (FK → Vertical)                           ││
│  │ slot_id                │ UUID (FK → Slot)                               ││
│  │ status                 │ ENUM: pending, confirmed, in_progress,         ││
│  │                        │        completed, cancelled, expired, no_show  ││
│  │ created_at             │ Timestamp                                      ││
│  │ updated_at             │ Timestamp                                      ││
│  │ confirmed_at           │ Timestamp                                      ││
│  │ started_at             │ Timestamp                                      ││
│  │ ended_at               │ Timestamp                                      ││
│  │ cancelled_at           │ Timestamp                                      ││
│  │ cancellation_reason    │ String                                         ││
│  │ cancelled_by           │ UUID (FK → User)                               ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ SCHEDULE DETAILS                               ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ scheduled_start        │ Timestamp                                      ││
│  │ scheduled_end          │ Timestamp                                      ││
│  │ timezone               │ String (IANA)                                  ││
│  │ duration_minutes       │ Integer                                        ││
│  │ session_type           │ ENUM: video, audio, chat, in_person            ││
│  │ location_type          │ ENUM: online, consultant_office, client_home   ││
│  │ location_address       │ String (for in-person)                         ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ PRICING                                        ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ pricing_model          │ ENUM: per_minute, per_hour, per_session, pack  ││
│  │ base_amount            │ Decimal                                        ││
│  │ duration_charge        │ Decimal                                        ││
│  │ platform_fee           │ Decimal                                        ││
│  │ consultant_earnings    │ Decimal                                        ││
│  │ currency               │ String (ISO 4217)                              ││
│  │ discount_applied       │ Decimal                                        ││
│  │ discount_code          │ String                                         ││
│  │ tax_amount             │ Decimal                                        ││
│  │ total_amount           │ Decimal                                        ││
│  │ payment_status         │ ENUM: pending, paid, refunded, partial_refund  ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ SESSION CONTEXT                                ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ topic                  │ String                                         ││
│  │ description            │ Text                                           ││
│  │ urgency_level          │ ENUM: normal, urgent, emergency                ││
│  │ notes                  │ Text                                           ││
│  │ attachments            │ Array[URL]                                     ││
│  │ first_time_client      │ Boolean                                        ││
│  │ recurring_booking_id   │ UUID (FK → Booking, if recurring)              ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ AI CONTEXT                                     ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ ai_match_score         │ Decimal                                        ││
│  │ ai_match_reason        │ String                                         ││
│  │ ai_suggested_questions │ Array[String]                                  ││
│  │ ai_session_summary     │ Text (generated after session)                 ││
│  │ ai_insights            │ JSON (generated insights)                      ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ REMINDERS                                      ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ reminder_sent          │ Boolean                                        ││
│  │ reminder_24h_sent      │ Boolean                                        ││
│  │ reminder_1h_sent       │ Boolean                                        ││
│  │ reminder_15m_sent      │ Boolean                                        ││
│  └────────────────────────┴────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        STATE TRANSITIONS                                ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │   pending ─────► confirmed ─────► in_progress ─────► completed          ││
│  │      │              │                 │                   │               ││
│  │      │              │                 │                   │               ││
│  │      ▼              ▼                 ▼                   ▼               ││
│  │   expired       cancelled        cancelled         refunded              ││
│  │                  (before)         (during)        (after)               ││
│  │                                                                         ││
│  │   no_show (if not joined within 15 min of start)                       ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.5 Session Entity

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SESSION ENTITY                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Entity: Session                                                             │
│  Description: Live consultancy session with video/audio/chat                 │
│  Database: PostgreSQL (primary), MongoDB (transcripts), TimescaleDB (metrics)│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        ATTRIBUTES                                       ││
│  ├────────────────────────┬────────────────────────────────────────────────┤│
│  │ Attribute              │ Description                                   ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ id                     │ UUID (Primary Key)                             ││
│  │ booking_id             │ UUID (FK → Booking)                            ││
│  │ status                 │ ENUM: initializing, active, paused, ended      ││
│  │ session_type           │ ENUM: video, audio, chat                       ││
│  │ created_at             │ Timestamp                                      ││
│  │ started_at             │ Timestamp                                      ││
│  │ ended_at               │ Timestamp                                      ││
│  │ actual_duration        │ Integer (seconds)                              ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ PARTICIPANTS                                   ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ consultant_id          │ UUID (FK → User)                               ││
│  │ seeker_id              │ UUID (FK → User)                               ││
│  │ consultant_joined_at   │ Timestamp                                      ││
│  │ seeker_joined_at       │ Timestamp                                      ││
│  │ consultant_left_at     │ Timestamp                                      ││
│  │ seeker_left_at         │ Timestamp                                      ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ WEBRTC INFO                                    ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ room_id                │ String (WebRTC room identifier)                ││
│  │ server_region          │ String (media server region)                   ││
│  │ video_enabled          │ Boolean                                        ││
│  │ audio_enabled          │ Boolean                                        ││
│  │ chat_enabled           │ Boolean                                        ││
│  │ screen_share_enabled   │ Boolean                                        ││
│  │ recording_enabled      │ Boolean                                        ││
│  │ recording_url          │ String (URL, if recorded)                      ││
│  │ recording_duration     │ Integer (seconds)                              ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ QUALITY METRICS                                ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ video_quality_avg      │ String (resolution: 720p, 1080p)               ││
│  │ audio_quality_avg      │ Decimal (MOS score 1-5)                        ││
│  │ connection_stability   │ Decimal (percentage)                           ││
│  │ packet_loss_avg        │ Decimal (percentage)                           ││
│  │ latency_avg            │ Integer (ms)                                   ││
│  │ jitter_avg             │ Integer (ms)                                   ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ AI PROCESSING                                  ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ transcription_status   │ ENUM: none, in_progress, completed, failed     ││
│  │ transcription_url      │ String (URL)                                   ││
│  │ translation_enabled    │ Boolean                                        ││
│  │ translation_languages  │ Array[String]                                  ││
│  │ ai_copilot_active      │ Boolean                                        ││
│  │ ai_suggestions_count   │ Integer                                        ││
│  │ ai_insights_generated  │ Boolean                                        ││
│  │ sentiment_analysis     │ JSON (sentiment timeline)                      ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ BILLING                                        ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ billing_model          │ ENUM: per_minute, per_hour, per_session        ││
│  │ billing_start          │ Timestamp                                      ││
│  │ billing_end            │ Timestamp                                      ││
│  │ billable_duration      │ Integer (seconds)                              ││
│  │ billed_amount          │ Decimal                                        ││
│  │ currency               │ String                                         ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ POST-SESSION                                   ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ follow_up_required     │ Boolean                                        ││
│  │ follow_up_scheduled    │ Boolean                                        ││
│  │ notes_shared           │ Boolean                                        ││
│  │ resources_shared       │ Array[String]                                  ││
│  └────────────────────────┴────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.6 Payment Entity

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PAYMENT ENTITY                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Entity: Payment                                                             │
│  Description: Payment transactions for bookings, subscriptions, content     │
│  Database: PostgreSQL (primary), TimescaleDB (history)                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        ATTRIBUTES                                       ││
│  ├────────────────────────┬────────────────────────────────────────────────┤│
│  │ Attribute              │ Description                                   ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ id                     │ UUID (Primary Key)                             ││
│  │ user_id                │ UUID (FK → User, payer)                        ││
│  │ payment_type           │ ENUM: booking, subscription, content, tip     ││
│  │ reference_id           │ UUID (FK → Booking/Subscription/Content)       ││
│  │ status                 │ ENUM: pending, processing, completed, failed, ││
│  │                        │        refunded, cancelled                     ││
│  │ created_at             │ Timestamp                                      ││
│  │ updated_at             │ Timestamp                                      ││
│  │ completed_at           │ Timestamp                                      ││
│  │ failed_at              │ Timestamp                                      ││
│  │ refunded_at            │ Timestamp                                      ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ PAYMENT DETAILS                                ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ amount                 │ Decimal                                        ││
│  │ currency               │ String (ISO 4217)                              ││
│  │ platform_fee           │ Decimal                                        ││
│  │ tax_amount             │ Decimal                                        ││
│  │ discount_amount        │ Decimal                                        ││
│  │ final_amount           │ Decimal                                        ││
│  │ exchange_rate          │ Decimal (if multi-currency)                    ││
│  │ exchange_rate_date     │ Timestamp                                      ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ PAYMENT METHOD                                 ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ payment_method         │ ENUM: card, wallet, bank_transfer, crypto     ││
│  │ payment_provider       │ ENUM: stripe, paypal, razorpay, apple_pay...   ││
│  │ provider_transaction_id│ String                                         ││
│  │ card_last_four         │ String                                         ││
│  │ card_brand             │ String                                         ││
│  │ wallet_type            │ String                                         ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ RECEIVER INFO                                  ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ receiver_id            │ UUID (FK → User/Consultant)                    ││
│  │ receiver_amount        │ Decimal                                        ││
│  │ payout_status          │ ENUM: pending, processing, completed           ││
│  │ payout_id              │ UUID (FK → Payout)                             ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ REFUND INFO                                    ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ refund_amount          │ Decimal                                        ││
│  │ refund_reason          │ String                                         ││
│  │ refund_type            │ ENUM: full, partial                            ││
│  │ refund_provider_id     │ String                                         ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ FRAUD & SECURITY                               ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ fraud_score            │ Decimal                                        ││
│  │ fraud_checks           │ JSON {checks_performed, results}               ││
│  │ verified_by_3ds        │ Boolean                                        ││
│  │ ip_address             │ String                                         ││
│  │ device_id              │ String                                         ││
│  │ risk_level             │ ENUM: low, medium, high                        ││
│  └────────────────────────┴────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.7 Subscription Entity

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SUBSCRIPTION ENTITY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Entity: Subscription                                                        │
│  Description: User subscription plans (monthly, annual, packages)           │
│  Database: PostgreSQL                                                       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        ATTRIBUTES                                       ││
│  ├────────────────────────┬────────────────────────────────────────────────┤│
│  │ Attribute              │ Description                                   ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ id                     │ UUID (Primary Key)                             ││
│  │ user_id                │ UUID (FK → User)                               ││
│  │ plan_id                │ UUID (FK → SubscriptionPlan)                   ││
│  │ status                 │ ENUM: active, paused, cancelled, expired       ││
│  │ subscription_type      │ ENUM: monthly, annual, lifetime, pack         ││
│  │ created_at             │ Timestamp                                      ││
│  │ updated_at             │ Timestamp                                      ││
│  │ start_date             │ Timestamp                                      ││
│  │ end_date               │ Timestamp                                      ││
│  │ cancelled_at           │ Timestamp                                      ││
│  │ cancellation_reason    │ String                                         ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ BILLING                                        ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ price                  │ Decimal                                        ││
│  │ currency               │ String                                         ││
│  │ billing_cycle          │ ENUM: monthly, quarterly, annual               ││
│  │ next_billing_date      │ Timestamp                                      ││
│  │ last_billing_date      │ Timestamp                                      ││
│  │ auto_renew             │ Boolean                                        ││
│  │ payment_method_id      │ UUID                                           ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ USAGE                                          ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ sessions_used          │ Integer                                        ││
│  │ sessions_limit         │ Integer (-1 for unlimited)                     ││
│  │ minutes_used           │ Integer                                        ││
│  │ minutes_limit          │ Integer (-1 for unlimited)                     ││
│  │ content_accessed       │ Integer                                        ││
│  │ content_limit          │ Integer (-1 for unlimited)                     ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ FEATURES                                       ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ features_enabled       │ JSON {feature: boolean}                        ││
│  │ verticals_included     │ Array[UUID] or null (all)                      ││
│  │ consultants_tier       │ ENUM: all, premium, elite                      ││
│  │ discount_percentage    │ Decimal                                        ││
│  │ priority_support       │ Boolean                                        ││
│  │ ai_features_enabled    │ Boolean                                        ││
│  └────────────────────────┴────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                     SUBSCRIPTION PLANS                                 ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                         ││
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐               ││
│  │  │ FREE          │  │ BASIC         │  │ PREMIUM       │               ││
│  │  ├───────────────┤  ├───────────────┤  ├───────────────┤               ││
│  │  │ 1 session/mon │  │ 5 sessions/mo │  │ Unlimited     │               ││
│  │  │ Basic matching│  │ AI matching   │  │ AI Copilot    │               ││
│  │  │ No recording  │  │ Recording OK  │  │ Recording OK  │               ││
│  │  │               │  │ 10% discount  │  │ 25% discount  │               ││
│  │  │ $0/month      │  │ $29/month     │  │ $99/month     │               ││
│  │  └───────────────┘  └───────────────┘  └───────────────┘               ││
│  │                                                                         ││
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐               ││
│  │  │ ELITE         │  │ CONSULTANT    │  │ ENTERPRISE    │               ││
│  │  ├───────────────┤  ├───────────────┤  ├───────────────┤               ││
│  │  │ Unlimited     │  │ Dashboard Pro │  │ Unlimited     │               ││
│  │  │ + All classes │  │ AI Copilot    │  │ API Access    │               ││
│  │  │ + Priority    │  │ Advanced      │  │ White-label   │               ││
│  │  │ + 50% disc    │  │ Analytics     │  │ Support       │               ││
│  │  │               │  │               │  │               │               ││
│  │  │ $199/month    │  │ $49/month     │  │ Custom        │               ││
│  │  └───────────────┘  └───────────────┘  └───────────────┘               ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.8 Content Entity

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONTENT ENTITY                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Entity: Content                                                             │
│  Description: Recorded classes, articles, downloadable resources            │
│  Database: PostgreSQL (metadata), MongoDB (transcripts), S3 (files)        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        ATTRIBUTES                                       ││
│  ├────────────────────────┬────────────────────────────────────────────────┤│
│  │ Attribute              │ Description                                   ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ id                     │ UUID (Primary Key)                             ││
│  │ creator_id             │ UUID (FK → Consultant)                         ││
│  │ content_type           │ ENUM: video_class, audio_class, article,       ││
│  │                        │        ebook, template, resource               ││
│  │ status                 │ ENUM: draft, pending, published, archived      ││
│  │ created_at             │ Timestamp                                      ││
│  │ updated_at             │ Timestamp                                      ││
│  │ published_at           │ Timestamp                                      ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ CONTENT INFO                                   ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ title                  │ String                                         ││
│  │ title_translations     │ JSON {lang: title}                             ││
│  │ description            │ Text                                           ││
│  │ description_translations│ JSON {lang: desc}                             ││
│  │ vertical_id            │ UUID (FK → Vertical)                           ││
│  │ tags                   │ Array[String]                                  ││
│  │ difficulty_level       │ ENUM: beginner, intermediate, advanced        ││
│  │ language               │ String (primary language)                     ││
│  │ duration_minutes       │ Integer (for video/audio)                      ││
│  │ thumbnail_url          │ String                                         ││
│  │ preview_url            │ String (preview clip)                          ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ MEDIA                                          ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ media_url              │ String (S3 URL)                                ││
│  │ media_format           │ ENUM: mp4, mp3, pdf, epub, web                 ││
│  │ media_size_bytes       │ Integer                                        ││
│  │ video_quality          │ String (720p, 1080p, 4K)                       ││
│  │ transcript_url         │ String                                         ││
│  │ transcript_languages   │ Array[String]                                  ││
│  │ subtitles_url          │ String                                         ││
│  │ downloadable           │ Boolean                                        ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ PRICING                                        ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ pricing_model          │ ENUM: free, one_time, subscription_only        ││
│  │ price                  │ Decimal                                        ││
│  │ currency               │ String                                         ││
│  │ subscription_tiers     │ Array[String] (premium, elite)                 ││
│  │ discount_eligible      │ Boolean                                        ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ AI FEATURES                                    ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ ai_transcription_done  │ Boolean                                        ││
│  │ ai_summary             │ Text                                           ││
│  │ ai_keywords            │ Array[String]                                  ││
│  │ ai_chapters            │ JSON [{title, start_time, end_time}]          ││
│  │ ai_quiz_generated      │ Boolean                                        ││
│  │ ai_recommendation_score│ Decimal                                        ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ METRICS                                        ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ views                  │ Integer                                        ││
│  │ unique_views           │ Integer                                        ││
│  │ completion_rate        │ Decimal                                        ││
│  │ average_rating         │ Decimal                                        ││
│  │ total_ratings          │ Integer                                        ││
│  │ purchases              │ Integer                                        ││
│  │ revenue                │ Decimal                                        ││
│  │ shares                 │ Integer                                        ││
│  └────────────────────────┴────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.9 Review Entity

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REVIEW ENTITY                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Entity: Review                                                              │
│  Description: User reviews for consultants and content                       │
│  Database: PostgreSQL, MongoDB (detailed feedback)                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        ATTRIBUTES                                       ││
│  ├────────────────────────┬────────────────────────────────────────────────┤│
│  │ Attribute              │ Description                                   ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ id                     │ UUID (Primary Key)                             ││
│  │ reviewer_id            │ UUID (FK → User)                               ││
│  │ review_type            │ ENUM: consultant, content                      ││
│  │ reference_id           │ UUID (FK → Consultant/Content)                 ││
│  │ booking_id             │ UUID (FK → Booking, for consultant reviews)    ││
│  │ rating                 │ Integer (1-5)                                  ││
│  │ title                  │ String                                         ││
│  │ comment                │ Text                                           ││
│  │ status                 │ ENUM: pending, published, hidden, removed      ││
│  │ created_at             │ Timestamp                                      ││
│  │ updated_at             │ Timestamp                                      ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ DETAILED RATINGS                               ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ detailed_ratings       │ JSON {                                         ││
│  │                        │   expertise: 1-5,                              ││
│  │                        │   communication: 1-5,                          ││
│  │                        │   value: 1-5,                                  ││
│  │                        │   punctuality: 1-5,                            ││
│  │                        │   helpfulness: 1-5                             ││
│  │                        │ }                                              ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ AI ANALYSIS                                    ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ ai_sentiment           │ ENUM: positive, neutral, negative             ││
│  │ ai_sentiment_score     │ Decimal                                        ││
│  │ ai_keywords            │ Array[String]                                  ││
│  │ ai_categories          │ Array[String]                                  ││
│  │ ai_fake_detection_score│ Decimal                                        ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ RESPONSE                                       ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ has_response           │ Boolean                                        ││
│  │ response_text          │ Text                                           ││
│  │ response_at            │ Timestamp                                      ││
│  │ responder_id           │ UUID                                           ││
│  └────────────────────────┴────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.10 Message Entity

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MESSAGE ENTITY                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Entity: Message                                                             │
│  Description: Chat messages, notifications, WhatsApp messages               │
│  Database: MongoDB (primary), PostgreSQL (summary)                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        ATTRIBUTES                                       ││
│  ├────────────────────────┬────────────────────────────────────────────────┤│
│  │ Attribute              │ Description                                   ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ id                     │ UUID (Primary Key)                             ││
│  │ conversation_id        │ UUID                                           ││
│  │ sender_id              │ UUID (FK → User)                               ││
│  │ receiver_id            │ UUID (FK → User)                               ││
│  │ message_type           │ ENUM: text, image, file, audio, video, system ││
│  │ status                 │ ENUM: sent, delivered, read, failed            ││
│  │ created_at             │ Timestamp                                      ││
│  │ read_at                │ Timestamp                                      ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ CONTENT                                        ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ text_content           │ String                                         ││
│  │ media_url              │ String                                         ││
│  │ media_type             │ String                                         ││
│  │ media_size             │ Integer                                        ││
│  │ attachments            │ Array[URL]                                     ││
│  │ translation            │ JSON {lang: text}                              ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ AI PROCESSING                                  ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ ai_intent              │ String                                         ││
│  │ ai_entities            │ JSON                                           ││
│  │ ai_sentiment           │ Decimal                                        ││
│  │ ai_suggested_response  │ String                                         ││
│  │ ai_embedding           │ Array[Decimal]                                 ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │                        │ CHANNEL                                        ││
│  ├────────────────────────┼────────────────────────────────────────────────┤│
│  │ channel                │ ENUM: platform_chat, whatsapp, sms, email     ││
│  │ external_message_id    │ String (WhatsApp/SMS ID)                       ││
│  │ thread_id              │ UUID                                           ││
│  │ reply_to_id            │ UUID                                           ││
│  └────────────────────────┴────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Entity Relationships Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ENTITY RELATIONSHIP MATRIX                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User ─────────────────────────────────────────────────────────────────────│
│    ├── 1:1    → ConsultantProfile (if consultant)                           │
│    ├── 1:N    → Bookings (as seeker)                                        │
│    ├── 1:N    → Sessions (as participant)                                   │
│    ├── 1:N    → Payments (as payer)                                         │
│    ├── 1:N    → Reviews (as reviewer)                                       │
│    ├── 1:N    → Messages (as sender/receiver)                               │
│    ├── 1:1    → Subscription                                                │
│    ├── 1:N    → Notifications                                               │
│                                                                             │
│  Consultant ──────────────────────────────────────────────────────────────│
│    ├── 1:1    → User                                                        │
│    ├── M:N    → Verticals                                                   │
│    ├── 1:N    → Slots                                                       │
│    ├── 1:N    → Bookings (as provider)                                      │
│    ├── 1:N    → Sessions (as consultant)                                    │
│    ├── 1:N    → Content                                                     │
│    ├── 1:N    → Reviews (received)                                          │
│    ├── 1:N    → Payouts                                                     │
│    ├── 1:1    → Balance                                                     │
│                                                                             │
│  Vertical ────────────────────────────────────────────────────────────────│
│    ├── 1:N    → SubVerticals (self-reference)                               │
│    ├── M:N    → Consultants                                                 │
│    ├── M:N    → Content                                                     │
│                                                                             │
│  Booking ─────────────────────────────────────────────────────────────────│
│    ├── 1:1    → User (seeker)                                               │
│    ├── 1:1    → Consultant                                                  │
│    ├── 1:1    → Vertical                                                    │
│    ├── 1:1    → Slot                                                        │
│    ├── 1:1    → Session                                                     │
│    ├── 1:N    → Payments                                                    │
│    ├── 1:N    → Reviews                                                     │
│    ├── 1:1    → RecurringBooking (optional)                                 │
│                                                                             │
│  Session ─────────────────────────────────────────────────────────────────│
│    ├── 1:1    → Booking                                                     │
│    ├── 1:N    → Messages                                                    │
│    ├── 1:1    → Recording                                                   │
│    ├── 1:1    → Transcript                                                  │
│                                                                             │
│  Payment ─────────────────────────────────────────────────────────────────│
│    ├── 1:1    → User (payer)                                                │
│    ├── 1:1    → Booking/Subscription/Content                                │
│    ├── 1:1    → Payout                                                      │
│                                                                             │
│  Subscription ─────────────────────────────────────────────────────────────│
│    ├── 1:1    → User                                                        │
│    ├── 1:1    → SubscriptionPlan                                            │
│    ├── 1:N    → Payments                                                    │
│                                                                             │
│  Content ─────────────────────────────────────────────────────────────────│
│    ├── 1:1    → Consultant                                                  │
│    ├── 1:1    → Vertical                                                    │
│    ├── 1:N    → Reviews                                                     │
│    ├── 1:N    → Payments                                                    │
│                                                                             │
│  Review ──────────────────────────────────────────────────────────────────│
│    ├── 1:1    → User (reviewer)                                             │
│    ├── 1:1    → Consultant/Content                                          │
│    ├── 1:1    → Booking (optional)                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. See [Database Schema](../database/database-schema.md) for SQL/NoSQL implementations
2. Review [Service Architecture](service-architecture.md) for entity management services
3. Check [API Specification](../api/api-specification.md) for entity CRUD operations

---

**Return to:** [CLAUDE.md](../CLAUDE.md) - Master Architecture Index