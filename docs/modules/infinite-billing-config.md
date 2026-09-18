# Infinite Billing Configuration System

## Overview

This module implements a **fully flexible, infinitely configurable billing system** that supports:

- Per-minute billing
- Per-second billing
- Per-question billing
- Per-session billing
- Per-day/week/month billing
- Subscription tiers (customizable)
- Wallet recharge with bonus
- Promotional offers & coupons
- Dynamic pricing rules
- AI provider configurations per tier
- Any future billing model imaginable

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BILLING CONFIGURATION ENGINE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Pricing    │    │   Billing    │    │   Wallet     │                  │
│  │   Models     │───►│   Rules      │───►│   System     │                  │
│  │  (Infinite)  │    │  (Dynamic)   │    │  (Flexible)  │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ Promotional  │    │   AI Tier    │    │   Payment    │                  │
│  │   Offers     │    │  Configs     │    │  Providers   │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Pricing Units (Infinite Options)

| Unit Type | Description | Example |
|-----------|-------------|---------|
| `per_second` | Charge per second of session | $0.05/second |
| `per_minute` | Charge per minute of session | $2.00/minute |
| `per_hour` | Charge per hour of session | $150/hour |
| `per_day` | Daily access pass | $20/day |
| `per_week` | Weekly subscription | $50/week |
| `per_month` | Monthly subscription | $99/month |
| `per_year` | Annual subscription | $999/year |
| `per_session` | Fixed price per session | $50/session |
| `per_question` | Pay-per-question model | $5/question |
| `per_message` | Pay-per-message (chat) | $0.50/message |
| `per_document` | Per document review | $25/document |
| `per_project` | Project-based pricing | Custom |
| `per_consultation` | Single consultation fee | $75 |
| `per_download` | Content download fee | $10/download |
| `per_credit` | Credit-based system | 1 credit = $1 |
| `per_token` | AI token-based pricing | $0.001/token |
| `per_minute_video` | Video session minutes | $3/minute |
| `per_minute_audio` | Audio session minutes | $2/minute |
| `custom` | Any custom unit defined | Flexible |

## Database Schema

### pricing_models (Flexible Pricing Definitions)

```sql
CREATE TABLE pricing_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    
    -- Pricing unit configuration
    unit_type VARCHAR(50) NOT NULL, -- per_minute, per_session, per_question, etc.
    unit_name VARCHAR(50), -- Display name (e.g., "Minute", "Question")
    unit_plural VARCHAR(50), -- Plural form (e.g., "Minutes", "Questions")
    unit_seconds INT DEFAULT NULL, -- Seconds per unit (for time-based)
    
    -- Base pricing
    base_rate DECIMAL(10,4) NOT NULL, -- Rate per unit
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Minimums and maximums
    min_units INT DEFAULT 1, -- Minimum units to bill
    max_units INT DEFAULT NULL, -- Maximum units per transaction
    min_amount DECIMAL(10,2) DEFAULT 0, -- Minimum charge amount
    max_amount DECIMAL(10,2) DEFAULT NULL, -- Maximum charge amount
    
    -- Billing cadence
    billing_cadence VARCHAR(50) DEFAULT 'postpaid', -- prepaid, postpaid, realtime
    billing_interval INT DEFAULT NULL, -- Bill every X units
    rounding_strategy VARCHAR(20) DEFAULT 'round_up', -- round_up, round_down, exact
    
    -- Thresholds for tiered pricing
    threshold_config JSONB DEFAULT '{}', -- {"10": 0.9, "50": 0.8} = discount after X units
    
    -- Platform configuration
    platform_fee_type VARCHAR(20) DEFAULT 'percentage', -- percentage, fixed, tiered
    platform_fee_value DECIMAL(10,4) DEFAULT 15, -- 15% or $5 fixed
    platform_fee_config JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    
    -- Metadata
    metadata JSONB DEFAULT '{}', -- Any additional config
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP DEFAULT NULL
);
```

### billing_rules (Dynamic Pricing Rules)

```sql
CREATE TABLE billing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- discount, multiplier, override, bonus
    
    -- Applicability
    applies_to VARCHAR(50) NOT NULL, -- consultant, seeker, tier, region, all
    consultant_id UUID DEFAULT NULL,
    seeker_id UUID DEFAULT NULL,
    tier_id UUID DEFAULT NULL,
    vertical_id UUID DEFAULT NULL,
    region_code VARCHAR(10) DEFAULT NULL,
    
    -- Conditions (JSON for infinite flexibility)
    conditions JSONB NOT NULL, -- {"min_duration": 30, "first_booking": true, etc.}
    
    -- Actions
    action_type VARCHAR(50) NOT NULL, -- discount_percent, discount_fixed, multiply_rate, override_rate, add_bonus
    action_value DECIMAL(10,4) NOT NULL,
    action_config JSONB DEFAULT '{}',
    
    -- Priority and conflicts
    priority INT DEFAULT 100, -- Higher priority rules override lower
    stackable BOOLEAN DEFAULT false, -- Can combine with other rules
    max_applications INT DEFAULT 1, -- How many times this rule can apply
    exclusive BOOLEAN DEFAULT false, -- If true, no other rules apply
    
    -- Validity
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP DEFAULT NULL,
    usage_limit INT DEFAULT NULL,
    usage_count INT DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### wallet_system

```sql
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Balance
    balance DECIMAL(10,2) DEFAULT 0,
    pending_balance DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Credits (alternative to money)
    credits INT DEFAULT 0,
    credits_to_currency_ratio DECIMAL(10,4) DEFAULT 1.0,
    
    -- Limits
    min_balance DECIMAL(10,2) DEFAULT 0,
    max_balance DECIMAL(10,2) DEFAULT 10000,
    
    -- Auto-recharge
    auto_recharge_enabled BOOLEAN DEFAULT false,
    auto_recharge_threshold DECIMAL(10,2) DEFAULT 10,
    auto_recharge_amount DECIMAL(10,2) DEFAULT 50,
    auto_recharge_method VARCHAR(50) DEFAULT NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    
    -- Transaction info
    type VARCHAR(50) NOT NULL, -- recharge, deduct, refund, bonus, transfer
    amount DECIMAL(10,2) NOT NULL,
    credits INT DEFAULT NULL,
    
    -- Balance snapshots
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    
    -- Source/Destination
    source_type VARCHAR(50), -- payment, referral, bonus, refund
    source_id UUID,
    destination_type VARCHAR(50),
    destination_id UUID,
    
    -- Reference
    reference_type VARCHAR(50), -- booking, recharge, refund
    reference_id UUID,
    
    -- Description
    description TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed', -- pending, completed, failed, reversed
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### recharge_packages (Wallet Recharge Options)

```sql
CREATE TABLE recharge_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    
    -- Package amounts
    amount DECIMAL(10,2) NOT NULL, -- $50 recharge
    bonus_amount DECIMAL(10,2) DEFAULT 0, -- Extra bonus
    bonus_percent DECIMAL(5,2) DEFAULT 0, -- 10% extra
    
    -- Credits
    credits INT DEFAULT NULL,
    bonus_credits INT DEFAULT 0,
    
    -- Effective value
    total_value DECIMAL(10,2) NOT NULL, -- amount + bonus
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL, -- What user pays
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Validity
    validity_days INT DEFAULT NULL, -- Credits expire after X days
    
    -- Display
    display_order INT DEFAULT 100,
    is_popular BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    
    -- Targeting
    tier_id UUID DEFAULT NULL, -- Only for specific tier
    region_code VARCHAR(10) DEFAULT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP DEFAULT NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### promotional_offers

```sql
CREATE TABLE promotional_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- PROMO2024
    
    -- Offer type
    offer_type VARCHAR(50) NOT NULL, -- coupon, referral, flash_sale, seasonal, first_booking
    
    -- Benefit
    benefit_type VARCHAR(50) NOT NULL, -- discount_percent, discount_fixed, free_units, bonus_wallet, bonus_credits
    benefit_value DECIMAL(10,4) NOT NULL,
    benefit_config JSONB DEFAULT '{}', -- {"free_minutes": 30, "free_questions": 5}
    
    -- Applicability
    applies_to_booking BOOLEAN DEFAULT true,
    applies_to_subscription BOOLEAN DEFAULT false,
    applies_to_recharge BOOLEAN DEFAULT false,
    applies_to_content BOOLEAN DEFAULT false,
    
    -- Restrictions
    min_purchase DECIMAL(10,2) DEFAULT NULL,
    max_discount DECIMAL(10,2) DEFAULT NULL,
    
    -- Usage limits
    total_limit INT DEFAULT NULL, -- Total uses across all users
    per_user_limit INT DEFAULT 1, -- Uses per user
    usage_count INT DEFAULT 0,
    
    -- First-time user restriction
    first_time_only BOOLEAN DEFAULT false,
    
    -- Validity
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    
    -- Display
    display_text TEXT,
    banner_url VARCHAR(500),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    auto_apply BOOLEAN DEFAULT false, -- Apply automatically without code
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### subscription_tiers (Flexible Tier System)

```sql
CREATE TABLE subscription_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    
    -- Tier level
    tier_level INT NOT NULL, -- 1=Free, 2=Basic, 3=Pro, 4=VIP
    tier_color VARCHAR(20), -- hex color for UI
    
    -- Pricing (multiple options per tier)
    pricing_options JSONB NOT NULL, -- [{"unit": "month", "price": 29.99}, {"unit": "year", "price": 299}]
    
    -- Features (infinite feature configuration)
    features JSONB NOT NULL, -- {"max_sessions": 10, "ai_model": "claude-opus", "video_quality": "hd"}
    
    -- Limits
    limits JSONB NOT NULL, -- {"daily_questions": 50, "monthly_minutes": 120, "storage_gb": 5}
    
    -- AI Configuration per tier
    ai_config JSONB NOT NULL, -- Full AI provider settings per tier
    
    -- Perks
    perks JSONB DEFAULT '[]', -- ["priority_support", "no_ads", "custom_branding"]
    
    -- Display
    description TEXT,
    icon_url VARCHAR(500),
    display_order INT DEFAULT 100,
    is_popular BOOLEAN DEFAULT false,
    is_recommended BOOLEAN DEFAULT false,
    
    -- Upgrade/downgrade
    upgrade_from UUID[], -- Can upgrade from these tiers
    downgrade_to UUID[], -- Can downgrade to these tiers
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### ai_tier_configurations (AI Provider Settings Per Tier)

```sql
CREATE TABLE ai_tier_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_id UUID NOT NULL REFERENCES subscription_tiers(id),
    
    -- Provider
    provider VARCHAR(50) NOT NULL, -- openai, anthropic, google, ollama, custom
    provider_name VARCHAR(100),
    
    -- Model
    model_id VARCHAR(100) NOT NULL, -- gpt-4-turbo, claude-opus-4, llama3.2
    model_name VARCHAR(100),
    model_type VARCHAR(50), -- chat, embedding, image, audio
    
    -- Configuration
    enabled BOOLEAN DEFAULT true,
    
    -- API Configuration
    api_endpoint VARCHAR(500),
    api_key_ref VARCHAR(100), -- Reference to secure key storage
    
    -- Model parameters
    max_tokens INT DEFAULT 2048,
    max_input_tokens INT DEFAULT NULL,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    top_p DECIMAL(3,2) DEFAULT 1.0,
    frequency_penalty DECIMAL(3,2) DEFAULT 0,
    presence_penalty DECIMAL(3,2) DEFAULT 0,
    
    -- Rate limits
    requests_per_minute INT DEFAULT 60,
    tokens_per_minute INT DEFAULT 40000,
    requests_per_day INT DEFAULT NULL,
    
    -- Cost tracking
    cost_per_input_token DECIMAL(10,6) DEFAULT 0,
    cost_per_output_token DECIMAL(10,6) DEFAULT 0,
    
    -- Fallback
    fallback_provider VARCHAR(50),
    fallback_model_id VARCHAR(100),
    
    -- Features available
    features JSONB DEFAULT '{}', -- {"streaming": true, "function_calling": true}
    
    -- Priority (if multiple providers configured)
    priority INT DEFAULT 100,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Example Configurations

### Pricing Model Examples

```json
// Per-minute pricing
{
  "unit_type": "per_minute",
  "unit_name": "Minute",
  "base_rate": 2.50,
  "min_units": 5,
  "billing_cadence": "realtime",
  "threshold_config": {"30": 0.9, "60": 0.85}
}

// Per-question pricing
{
  "unit_type": "per_question",
  "unit_name": "Question",
  "base_rate": 5.00,
  "min_units": 1,
  "max_units": 50,
  "billing_cadence": "postpaid"
}

// Subscription with infinite options
{
  "unit_type": "per_month",
  "base_rate": 99.00,
  "billing_cadence": "prepaid",
  "threshold_config": {"3_months": 0.9, "12_months": 0.75}
}

// Credit-based system
{
  "unit_type": "per_credit",
  "base_rate": 1.00,
  "min_units": 10,
  "billing_cadence": "prepaid"
}

// Per-second (real-time streaming)
{
  "unit_type": "per_second",
  "base_rate": 0.05,
  "billing_cadence": "realtime",
  "billing_interval": 10
}
```

### AI Tier Configuration Examples

```json
// Free tier - Ollama (Free)
{
  "tier_id": "free_tier",
  "provider": "ollama",
  "model_id": "llama3.2",
  "enabled": true,
  "api_endpoint": "http://localhost:11434",
  "max_tokens": 512,
  "requests_per_minute": 10,
  "cost_per_input_token": 0,
  "cost_per_output_token": 0
}

// Premium Monthly - Claude Sonnet
{
  "tier_id": "premium_monthly",
  "provider": "anthropic",
  "model_id": "claude-sonnet-4-20250514",
  "enabled": true,
  "max_tokens": 2048,
  "temperature": 0.7,
  "requests_per_minute": 60,
  "tokens_per_minute": 40000,
  "cost_per_input_token": 0.000003,
  "cost_per_output_token": 0.000015,
  "fallback_provider": "openai",
  "fallback_model_id": "gpt-4-turbo"
}

// VIP Yearly - Claude Opus
{
  "tier_id": "vip_yearly",
  "provider": "anthropic",
  "model_id": "claude-opus-4-20250514",
  "enabled": true,
  "max_tokens": 4096,
  "temperature": 0.7,
  "requests_per_minute": 100,
  "tokens_per_minute": 100000,
  "features": {
    "streaming": true,
    "function_calling": true,
    "vision": true,
    "extended_context": true
  }
}
```

### Recharge Package Examples

```json
// Basic recharge
{
  "amount": 25,
  "bonus_percent": 0,
  "price": 25,
  "total_value": 25
}

// Bonus recharge
{
  "amount": 50,
  "bonus_percent": 10,
  "bonus_amount": 5,
  "price": 50,
  "total_value": 55
}

// Premium recharge
{
  "amount": 100,
  "bonus_percent": 20,
  "bonus_amount": 20,
  "price": 100,
  "total_value": 120,
  "is_popular": true
}

// Credit package
{
  "credits": 500,
  "bonus_credits": 100,
  "price": 50,
  "validity_days": 365
}
```

### Promotional Offer Examples

```json
// First booking discount
{
  "offer_type": "first_booking",
  "benefit_type": "discount_percent",
  "benefit_value": 25,
  "first_time_only": true,
  "auto_apply": true
}

// Flash sale
{
  "offer_type": "flash_sale",
  "benefit_type": "discount_percent",
  "benefit_value": 50,
  "valid_from": "2024-01-15T00:00:00Z",
  "valid_until": "2024-01-15T23:59:59Z",
  "total_limit": 1000
}

// Referral bonus
{
  "offer_type": "referral",
  "benefit_type": "bonus_wallet",
  "benefit_value": 25,
  "per_user_limit": 10
}

// Free minutes offer
{
  "offer_type": "coupon",
  "benefit_type": "free_units",
  "benefit_config": {"unit_type": "per_minute", "free_units": 30},
  "code": "FREE30MIN"
}
```

## API Endpoints

### Pricing Models
- `GET /billing/pricing-models` - List all pricing models
- `POST /billing/pricing-models` - Create new pricing model
- `PUT /billing/pricing-models/:id` - Update pricing model
- `DELETE /billing/pricing-models/:id` - Delete pricing model

### Billing Rules
- `GET /billing/rules` - List billing rules
- `POST /billing/rules` - Create billing rule
- `PUT /billing/rules/:id` - Update billing rule
- `DELETE /billing/rules/:id` - Delete billing rule

### Wallet
- `GET /wallet` - Get user wallet
- `POST /wallet/recharge` - Recharge wallet
- `GET /wallet/transactions` - Transaction history
- `POST /wallet/auto-recharge/config` - Configure auto-recharge

### Recharge Packages
- `GET /billing/recharge-packages` - List available packages
- `POST /billing/recharge-packages` - Create package (admin)
- `POST /billing/recharge/:packageId` - Purchase recharge

### Promotional Offers
- `GET /billing/promotions` - List active promotions
- `POST /billing/promotions/apply` - Apply promotion code
- `POST /billing/promotions` - Create promotion (admin)
- `GET /billing/promotions/my` - User's applied promotions

### Subscription Tiers
- `GET /billing/tiers` - List all tiers
- `POST /billing/tiers` - Create tier (admin)
- `PUT /billing/tiers/:id` - Update tier
- `GET /billing/tiers/:id/ai-config` - Get AI config for tier
- `PUT /billing/tiers/:id/ai-config` - Update AI config

### AI Configuration
- `GET /billing/ai-config/providers` - List available providers
- `POST /billing/ai-config/providers` - Add provider (admin)
- `GET /billing/ai-config/tiers` - All tier configs
- `POST /billing/ai-config/tier/:tierId` - Configure tier AI
- `GET /billing/ai-config/my-tier` - Get user's tier AI config

---

## Implementation Status

- ✅ Database schema designed
- ✅ Infinite pricing units supported
- ✅ Dynamic billing rules engine
- ✅ Wallet system with recharge
- ✅ Promotional offers system
- ✅ AI tier configurations
- ⏳ UI components (next step)
- ⏳ Admin configuration panel (next step)