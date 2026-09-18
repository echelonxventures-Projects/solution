-- Infinite Billing Configuration System - Database Schema
-- Run after 001_initial_schema.sql

-- ============================================
-- PRICING MODELS (Flexible Pricing Definitions)
-- ============================================
CREATE TABLE pricing_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,

    -- Pricing unit configuration (infinite options)
    unit_type VARCHAR(50) NOT NULL, -- per_minute, per_second, per_question, per_session, per_day, custom
    unit_name VARCHAR(50),
    unit_plural VARCHAR(50),
    unit_seconds INT DEFAULT NULL, -- Seconds per unit for time-based pricing

    -- Base pricing
    base_rate DECIMAL(10,4) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Minimums and maximums
    min_units INT DEFAULT 1,
    max_units INT DEFAULT NULL,
    min_amount DECIMAL(10,2) DEFAULT 0,
    max_amount DECIMAL(10,2) DEFAULT NULL,

    -- Billing cadence
    billing_cadence VARCHAR(50) DEFAULT 'postpaid', -- prepaid, postpaid, realtime
    billing_interval INT DEFAULT NULL,
    rounding_strategy VARCHAR(20) DEFAULT 'round_up', -- round_up, round_down, exact

    -- Thresholds for tiered/volume pricing
    threshold_config JSONB DEFAULT '{}',

    -- Platform configuration
    platform_fee_type VARCHAR(20) DEFAULT 'percentage', -- percentage, fixed, tiered, hybrid
    platform_fee_value DECIMAL(10,4) DEFAULT 15,
    platform_fee_config JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,

    -- Metadata (infinite additional config)
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP DEFAULT NULL
);

CREATE INDEX idx_pricing_models_slug ON pricing_models(slug);
CREATE INDEX idx_pricing_models_unit_type ON pricing_models(unit_type);
CREATE INDEX idx_pricing_models_active ON pricing_models(is_active) WHERE is_active = true;

-- ============================================
-- BILLING RULES (Dynamic Pricing Rules)
-- ============================================
CREATE TABLE billing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- discount, multiplier, override, bonus, condition

    -- Applicability (infinite targeting)
    applies_to VARCHAR(50) NOT NULL, -- consultant, seeker, tier, region, vertical, booking_type, all
    consultant_id UUID DEFAULT NULL REFERENCES consultants(id),
    seeker_id UUID DEFAULT NULL REFERENCES users(id),
    tier_id UUID DEFAULT NULL,
    vertical_id UUID DEFAULT NULL REFERENCES verticals(id),
    region_code VARCHAR(10) DEFAULT NULL,

    -- Conditions (JSON for infinite flexibility)
    conditions JSONB NOT NULL DEFAULT '{}', -- {"min_duration": 30, "first_booking": true, "time_range": {...}}

    -- Actions
    action_type VARCHAR(50) NOT NULL, -- discount_percent, discount_fixed, multiply_rate, override_rate, add_bonus, free_units
    action_value DECIMAL(10,4) NOT NULL,
    action_config JSONB DEFAULT '{}',

    -- Priority and conflicts
    priority INT DEFAULT 100,
    stackable BOOLEAN DEFAULT false,
    max_applications INT DEFAULT 1,
    exclusive BOOLEAN DEFAULT false,

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

CREATE INDEX idx_billing_rules_type ON billing_rules(rule_type);
CREATE INDEX idx_billing_rules_applies ON billing_rules(applies_to);
CREATE INDEX idx_billing_rules_active ON billing_rules(is_active, valid_from, valid_until) WHERE is_active = true;

-- ============================================
-- WALLET SYSTEM
-- ============================================
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Balance
    balance DECIMAL(10,2) DEFAULT 0 CHECK (balance >= 0),
    pending_balance DECIMAL(10,2) DEFAULT 0,
    frozen_balance DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Credits (alternative currency)
    credits INT DEFAULT 0 CHECK (credits >= 0),
    pending_credits INT DEFAULT 0,
    credits_to_currency_ratio DECIMAL(10,4) DEFAULT 1.0,

    -- Limits
    min_balance DECIMAL(10,2) DEFAULT 0,
    max_balance DECIMAL(10,2) DEFAULT 100000,
    min_credits INT DEFAULT 0,
    max_credits INT DEFAULT 1000000,

    -- Auto-recharge configuration
    auto_recharge_enabled BOOLEAN DEFAULT false,
    auto_recharge_threshold DECIMAL(10,2) DEFAULT 10,
    auto_recharge_amount DECIMAL(10,2) DEFAULT 50,
    auto_recharge_method VARCHAR(50) DEFAULT NULL, -- stripe, paypal, wallet
    auto_recharge_package_id UUID DEFAULT NULL,

    -- Loyalty
    loyalty_points INT DEFAULT 0,
    loyalty_tier VARCHAR(20) DEFAULT 'bronze', -- bronze, silver, gold, platinum

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_wallets_balance ON wallets(balance);

-- Wallet Transactions
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,

    -- Transaction info
    type VARCHAR(50) NOT NULL, -- recharge, deduct, refund, bonus, transfer, credit_add, credit_use, loyalty_add
    amount DECIMAL(10,2) NOT NULL,
    credits INT DEFAULT NULL,
    loyalty_points INT DEFAULT NULL,

    -- Balance snapshots
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    credits_before INT DEFAULT NULL,
    credits_after INT DEFAULT NULL,

    -- Source/Destination
    source_type VARCHAR(50), -- payment, referral, bonus, refund, promotion, loyalty
    source_id UUID,
    destination_type VARCHAR(50), -- booking, recharge, transfer, content
    destination_id UUID,

    -- Reference
    reference_type VARCHAR(50), -- booking, recharge_package, promotion, refund_request
    reference_id UUID,

    -- Description
    description TEXT,

    -- Status
    status VARCHAR(20) DEFAULT 'completed', -- pending, processing, completed, failed, reversed, cancelled

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP DEFAULT NULL
);

CREATE INDEX idx_wallet_trans_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_trans_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_trans_created ON wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_trans_ref ON wallet_transactions(reference_type, reference_id);

-- ============================================
-- RECHARGE PACKAGES
-- ============================================
CREATE TABLE recharge_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,

    -- Package amounts (flexible)
    amount DECIMAL(10,2) NOT NULL, -- Base amount to add to wallet
    bonus_amount DECIMAL(10,2) DEFAULT 0, -- Fixed bonus
    bonus_percent DECIMAL(5,2) DEFAULT 0, -- Percentage bonus (10% = 0.10)

    -- Credits
    credits INT DEFAULT NULL,
    bonus_credits INT DEFAULT 0,

    -- Loyalty bonus
    loyalty_points INT DEFAULT 0,

    -- Effective value (calculated)
    total_value DECIMAL(10,2) NOT NULL, -- amount + bonus_amount + (amount * bonus_percent)

    -- Pricing
    price DECIMAL(10,2) NOT NULL, -- What user actually pays
    currency VARCHAR(3) DEFAULT 'USD',

    -- Validity
    validity_days INT DEFAULT NULL, -- Credits/bonus expire after X days

    -- Display
    display_order INT DEFAULT 100,
    is_popular BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    badge_text VARCHAR(50), -- "Best Value", "Most Popular"
    icon_url VARCHAR(500),

    -- Targeting (infinite options)
    tier_id UUID DEFAULT NULL,
    region_code VARCHAR(10) DEFAULT NULL,
    user_type VARCHAR(50) DEFAULT NULL, -- seeker, consultant, both
    vertical_id UUID DEFAULT NULL,

    -- Restrictions
    min_purchases INT DEFAULT 0, -- Require minimum previous purchases
    first_time_only BOOLEAN DEFAULT false,
    max_per_user INT DEFAULT NULL,

    -- Status
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP DEFAULT NULL,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recharge_packages_slug ON recharge_packages(slug);
CREATE INDEX idx_recharge_packages_active ON recharge_packages(is_active) WHERE is_active = true;
CREATE INDEX idx_recharge_packages_order ON recharge_packages(display_order);

-- ============================================
-- PROMOTIONAL OFFERS
-- ============================================
CREATE TABLE promotional_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- Promo code

    -- Offer type (infinite)
    offer_type VARCHAR(50) NOT NULL, -- coupon, referral, flash_sale, seasonal, first_booking, loyalty, milestone, bundle

    -- Benefit configuration (infinite benefit types)
    benefit_type VARCHAR(50) NOT NULL, -- discount_percent, discount_fixed, free_units, bonus_wallet, bonus_credits, bonus_loyalty, free_feature
    benefit_value DECIMAL(10,4) NOT NULL,
    benefit_config JSONB DEFAULT '{}', -- {"unit_type": "per_minute", "free_units": 30, "features": ["video"]}

    -- Applicability (infinite targeting)
    applies_to_booking BOOLEAN DEFAULT true,
    applies_to_subscription BOOLEAN DEFAULT false,
    applies_to_recharge BOOLEAN DEFAULT false,
    applies_to_content BOOLEAN DEFAULT false,
    applies_to_wallet BOOLEAN DEFAULT false,

    applicable_tiers UUID[] DEFAULT '{}',
    applicable_verticals UUID[] DEFAULT '{}',
    applicable_regions VARCHAR(10)[] DEFAULT '{}',

    -- Restrictions (infinite)
    min_purchase DECIMAL(10,2) DEFAULT NULL,
    max_discount DECIMAL(10,2) DEFAULT NULL,
    min_booking_duration INT DEFAULT NULL,
    min_wallet_balance DECIMAL(10,2) DEFAULT NULL,

    -- Usage limits
    total_limit INT DEFAULT NULL,
    per_user_limit INT DEFAULT 1,
    usage_count INT DEFAULT 0,
    user_usage JSONB DEFAULT '{}', -- Track per-user usage

    -- First-time restriction
    first_time_only BOOLEAN DEFAULT false,
    first_time_type VARCHAR(50) DEFAULT NULL, -- first_booking, first_recharge, first_subscription

    -- Validity
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,

    -- Schedule (for recurring offers)
    schedule_type VARCHAR(50) DEFAULT NULL, -- daily, weekly, monthly, yearly, custom
    schedule_config JSONB DEFAULT '{}',

    -- Display
    display_text TEXT,
    banner_url VARCHAR(500),
    badge_icon VARCHAR(50),

    -- Status
    is_active BOOLEAN DEFAULT true,
    auto_apply BOOLEAN DEFAULT false,
    requires_code BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_promo_offers_code ON promotional_offers(code);
CREATE INDEX idx_promo_offers_type ON promotional_offers(offer_type);
CREATE INDEX idx_promo_offers_valid ON promotional_offers(valid_from, valid_until);
CREATE INDEX idx_promo_offers_active ON promotional_offers(is_active) WHERE is_active = true;

-- Track promotion usage
CREATE TABLE promotion_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES promotional_offers(id),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Usage details
    booking_id UUID DEFAULT NULL REFERENCES bookings(id),
    transaction_id UUID DEFAULT NULL REFERENCES wallet_transactions(id),

    -- Benefit applied
    benefit_type VARCHAR(50) NOT NULL,
    benefit_value DECIMAL(10,4) NOT NULL,
    actual_savings DECIMAL(10,2), -- Actual amount saved

    -- Status
    status VARCHAR(20) DEFAULT 'applied', -- applied, reverted, expired

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_promo_usage_promotion ON promotion_usages(promotion_id);
CREATE INDEX idx_promo_usage_user ON promotion_usages(user_id);

-- ============================================
-- SUBSCRIPTION TIERS (Flexible Tier System)
-- ============================================
CREATE TABLE subscription_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,

    -- Tier level
    tier_level INT NOT NULL, -- 0=Free, 1=Basic, 2=Pro, 3=Premium, 4=VIP, 5=Enterprise (infinite)
    tier_color VARCHAR(20), -- hex color for UI
    tier_icon VARCHAR(100),

    -- Pricing options (infinite pricing per tier)
    pricing_options JSONB NOT NULL DEFAULT '[]', -- [{"unit": "month", "price": 29.99, "billing_cycle": 1}, {"unit": "year", "price": 299, "billing_cycle": 12, "discount": 0.17}]

    -- Features (infinite feature configuration)
    features JSONB NOT NULL DEFAULT '{}', -- {"video_sessions": true, "max_duration": 60, "quality": "hd", "recording": true}

    -- Limits (infinite limits per tier)
    limits JSONB NOT NULL DEFAULT '{}', -- {"daily_sessions": 5, "monthly_minutes": 120, "daily_questions": 50, "storage_gb": 10, "api_calls": 1000}

    -- AI Configuration per tier (embedded)
    ai_config JSONB NOT NULL DEFAULT '{}',

    -- Perks (infinite perks)
    perks JSONB DEFAULT '[]', -- ["priority_support", "no_ads", "custom_branding", "api_access", "white_label"]

    -- Trial
    trial_days INT DEFAULT 0,
    trial_features JSONB DEFAULT '{}',

    -- Display
    display_order INT DEFAULT 100,
    is_popular BOOLEAN DEFAULT false,
    is_recommended BOOLEAN DEFAULT false,
    is_enterprise BOOLEAN DEFAULT false,

    -- Upgrade/downgrade paths
    upgrade_paths JSONB DEFAULT '[]', -- [{"to_tier": "premium", "discount": 0.1}]
    downgrade_paths JSONB DEFAULT '[]',

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscription_tiers_slug ON subscription_tiers(slug);
CREATE INDEX idx_subscription_tiers_level ON subscription_tiers(tier_level);
CREATE INDEX idx_subscription_tiers_active ON subscription_tiers(is_active) WHERE is_active = true;

-- ============================================
-- AI TIER CONFIGURATIONS
-- ============================================
CREATE TABLE ai_tier_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_id UUID NOT NULL REFERENCES subscription_tiers(id) ON DELETE CASCADE,

    -- Provider (infinite providers)
    provider VARCHAR(50) NOT NULL, -- openai, anthropic, google, azure, aws, ollama, local, custom
    provider_name VARCHAR(100),

    -- Model (infinite models)
    model_id VARCHAR(100) NOT NULL, -- gpt-4-turbo, claude-opus-4, gemini-1.5-pro, llama3.2, custom-model
    model_name VARCHAR(100),
    model_version VARCHAR(50),
    model_type VARCHAR(50) DEFAULT 'chat', -- chat, embedding, image, audio, video, multimodal

    -- Configuration
    enabled BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT true, -- Primary model for this tier

    -- API Configuration
    api_endpoint VARCHAR(500),
    api_key_ref VARCHAR(100), -- Reference to secure vault
    api_headers JSONB DEFAULT '{}',

    -- Model parameters (infinite tuning)
    max_tokens INT DEFAULT 2048,
    max_input_tokens INT DEFAULT 128000,
    context_window INT DEFAULT 128000,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    top_p DECIMAL(3,2) DEFAULT 1.0,
    top_k INT DEFAULT NULL,
    frequency_penalty DECIMAL(3,2) DEFAULT 0,
    presence_penalty DECIMAL(3,2) DEFAULT 0,
    stop_sequences JSONB DEFAULT '[]',

    -- Advanced parameters
    response_format JSONB DEFAULT NULL, -- {"type": "json_object"}
    seed INT DEFAULT NULL,
    logprobs BOOLEAN DEFAULT false,

    -- Rate limits (infinite control)
    requests_per_minute INT DEFAULT 60,
    requests_per_hour INT DEFAULT NULL,
    requests_per_day INT DEFAULT NULL,
    tokens_per_minute INT DEFAULT 40000,
    tokens_per_day INT DEFAULT NULL,
    concurrent_requests INT DEFAULT 5,

    -- Cost tracking
    cost_per_input_token DECIMAL(10,6) DEFAULT 0,
    cost_per_output_token DECIMAL(10,6) DEFAULT 0,
    cost_per_request DECIMAL(10,4) DEFAULT 0,
    monthly_cost_limit DECIMAL(10,2) DEFAULT NULL,

    -- Fallback configuration
    fallback_provider VARCHAR(50) DEFAULT NULL,
    fallback_model_id VARCHAR(100) DEFAULT NULL,
    fallback_on_error BOOLEAN DEFAULT true,
    fallback_on_rate_limit BOOLEAN DEFAULT true,
    fallback_on_cost_limit BOOLEAN DEFAULT true,

    -- Features available (infinite)
    features JSONB DEFAULT '{}', -- {"streaming": true, "function_calling": true, "vision": true, "audio": true, "tools": [...]}

    -- Capability scores
    capabilities JSONB DEFAULT '{}', -- {"reasoning": 8, "coding": 9, "creative": 7}

    -- Priority (multiple models per tier)
    priority INT DEFAULT 100,

    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_config_tier ON ai_tier_configurations(tier_id);
CREATE INDEX idx_ai_config_provider ON ai_tier_configurations(provider);
CREATE INDEX idx_ai_config_model ON ai_tier_configurations(model_id);
CREATE INDEX idx_ai_config_active ON ai_tier_configurations(is_active) WHERE is_active = true;

-- ============================================
-- USER SUBSCRIPTIONS
-- ============================================
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES subscription_tiers(id),

    -- Subscription details
    pricing_option JSONB NOT NULL, -- Which pricing option they chose
    billing_cycle INT NOT NULL DEFAULT 1, -- months
    unit_type VARCHAR(50) DEFAULT 'month',

    -- Pricing
    base_price DECIMAL(10,2) NOT NULL,
    discount_applied DECIMAL(10,4) DEFAULT 0,
    actual_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Validity
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    expires_at TIMESTAMP DEFAULT NULL,
    cancelled_at TIMESTAMP DEFAULT NULL,

    -- Payment
    payment_method_id UUID DEFAULT NULL,
    auto_renew BOOLEAN DEFAULT true,
    next_billing_date TIMESTAMP DEFAULT NULL,

    -- Trial
    is_trial BOOLEAN DEFAULT false,
    trial_ends_at TIMESTAMP DEFAULT NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, paused, cancelled, expired, trial, pending

    -- Usage tracking
    usage_this_period JSONB DEFAULT '{}', -- {"sessions": 5, "minutes": 45, "questions": 20}

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_subs_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subs_tier ON user_subscriptions(tier_id);
CREATE INDEX idx_user_subs_status ON user_subscriptions(status);
CREATE INDEX idx_user_subs_period ON user_subscriptions(current_period_end);

-- ============================================
-- BILLING CALCULATION LOGS
-- ============================================
CREATE TABLE billing_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    user_id UUID REFERENCES users(id),
    consultant_id UUID REFERENCES consultants(id),

    -- Input parameters
    pricing_model_id UUID REFERENCES pricing_models(id),
    input_units DECIMAL(10,4) NOT NULL,
    unit_type VARCHAR(50) NOT NULL,
    duration_seconds INT DEFAULT NULL,

    -- Applied rules
    applied_rules UUID[] DEFAULT '{}',
    applied_promotions UUID[] DEFAULT '{}',

    -- Base calculation
    base_rate DECIMAL(10,4) NOT NULL,
    base_amount DECIMAL(10,2) NOT NULL,

    -- Discounts
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_breakdown JSONB DEFAULT '{}',

    -- Platform fee
    platform_fee_type VARCHAR(20),
    platform_fee_rate DECIMAL(10,4),
    platform_fee_amount DECIMAL(10,2),

    -- Tax
    tax_region VARCHAR(10),
    tax_rate DECIMAL(10,4),
    tax_amount DECIMAL(10,2),

    -- Final amounts
    subtotal DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    consultant_earnings DECIMAL(10,2),

    -- Wallet usage
    wallet_amount_used DECIMAL(10,2) DEFAULT 0,
    credits_used INT DEFAULT 0,

    -- Payment
    payment_method VARCHAR(50),
    payment_status VARCHAR(20),

    -- Metadata
    metadata JSONB DEFAULT '{}',
    calculated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_billing_calc_booking ON billing_calculations(booking_id);
CREATE INDEX idx_billing_calc_user ON billing_calculations(user_id);
CREATE INDEX idx_billing_calc_date ON billing_calculations(calculated_at DESC);

-- ============================================
-- SEED DATA
-- ============================================

-- Pricing Models
INSERT INTO pricing_models (name, slug, unit_type, unit_name, unit_plural, unit_seconds, base_rate, billing_cadence, threshold_config, is_default) VALUES
('Per Minute', 'per_minute', 'per_minute', 'Minute', 'Minutes', 60, 2.50, 'realtime', '{"30": 0.9, "60": 0.85}', true),
('Per Session', 'per_session', 'per_session', 'Session', 'Sessions', NULL, 50.00, 'postpaid', '{}', false),
('Per Question', 'per_question', 'per_question', 'Question', 'Questions', NULL, 5.00, 'postpaid', '{"10": 0.8}', false),
('Per Hour', 'per_hour', 'per_hour', 'Hour', 'Hours', 3600, 150.00, 'realtime', '{"2": 0.9, "4": 0.85}', false),
('Per Day', 'per_day', 'per_day', 'Day', 'Days', 86400, 25.00, 'prepaid', '{}', false),
('Per Second', 'per_second', 'per_second', 'Second', 'Seconds', 1, 0.05, 'realtime', '{}', false);

-- Subscription Tiers
INSERT INTO subscription_tiers (name, slug, tier_level, tier_color, pricing_options, features, limits, ai_config, perks, is_popular) VALUES
('Free', 'free', 0, '#808080', '[{"unit": "forever", "price": 0}]', '{"video_sessions": false, "chat_sessions": true, "max_duration": 15}', '{"daily_sessions": 1, "daily_questions": 5}', '{"provider": "ollama", "model": "llama3.2", "max_tokens": 512}', '[]', false),
('Basic', 'basic', 1, '#3B82F6', '[{"unit": "month", "price": 19.99}, {"unit": "year", "price": 199.99}]', '{"video_sessions": true, "max_duration": 30, "recording": false}', '{"monthly_minutes": 60, "daily_sessions": 3}', '{"provider": "openai", "model": "gpt-3.5-turbo", "max_tokens": 1024}', '["email_support"]', false),
('Pro', 'pro', 2, '#10B981', '[{"unit": "month", "price": 49.99}, {"unit": "year", "price": 499.99}]', '{"video_sessions": true, "max_duration": 60, "recording": true, "hd_video": true}', '{"monthly_minutes": 180, "daily_sessions": 10}', '{"provider": "anthropic", "model": "claude-sonnet-4-20250514", "max_tokens": 2048}', '["priority_support", "no_ads"]', true),
('Premium', 'premium', 3, '#F59E0B', '[{"unit": "month", "price": 99.99}, {"unit": "year", "price": 999.99}]', '{"video_sessions": true, "max_duration": 120, "recording": true, "4k_video": true, "custom_branding": true}', '{"monthly_minutes": 500, "daily_sessions": 20}', '{"provider": "anthropic", "model": "claude-opus-4-20250514", "max_tokens": 4096}', '["priority_support", "no_ads", "custom_branding", "api_access"]', false),
('VIP', 'vip', 4, '#EF4444', '[{"unit": "month", "price": 199.99}, {"unit": "year", "price": 1999.99}]', '{"video_sessions": true, "max_duration": 480, "recording": true, "4k_video": true, "custom_branding": true, "white_label": true}', '{"monthly_minutes": 1000, "daily_sessions": 50}', '{"provider": "anthropic", "model": "claude-opus-4-20250514", "max_tokens": 8192}', '["priority_support", "no_ads", "custom_branding", "api_access", "white_label", "dedicated_manager"]', false);

-- AI Tier Configurations
INSERT INTO ai_tier_configurations (tier_id, provider, provider_name, model_id, model_name, enabled, api_endpoint, max_tokens, temperature, requests_per_minute, cost_per_input_token, cost_per_output_token, features, is_primary) VALUES
((SELECT id FROM subscription_tiers WHERE slug = 'free'), 'ollama', 'Ollama (Free)', 'llama3.2', 'Llama 3.2', true, 'http://localhost:11434', 512, 0.7, 10, 0, 0, '{"streaming": true}', true),
((SELECT id FROM subscription_tiers WHERE slug = 'basic'), 'openai', 'OpenAI', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', true, NULL, 1024, 0.7, 60, 0.0000005, 0.0000015, '{"streaming": true}', true),
((SELECT id FROM subscription_tiers WHERE slug = 'pro'), 'anthropic', 'Anthropic Claude', 'claude-sonnet-4-20250514', 'Claude Sonnet 4', true, NULL, 2048, 0.7, 60, 0.000003, 0.000015, '{"streaming": true, "function_calling": true}', true),
((SELECT id FROM subscription_tiers WHERE slug = 'premium'), 'anthropic', 'Anthropic Claude', 'claude-opus-4-20250514', 'Claude Opus 4', true, NULL, 4096, 0.7, 100, 0.000015, 0.000075, '{"streaming": true, "function_calling": true, "vision": true}', true),
((SELECT id FROM subscription_tiers WHERE slug = 'vip'), 'anthropic', 'Anthropic Claude', 'claude-opus-4-20250514', 'Claude Opus 4', true, NULL, 8192, 0.7, 200, 0.000015, 0.000075, '{"streaming": true, "function_calling": true, "vision": true, "extended_context": true}', true);

-- Recharge Packages
INSERT INTO recharge_packages (name, slug, amount, bonus_percent, total_value, price, is_popular, badge_text, display_order) VALUES
('Basic Recharge', 'recharge-25', 25.00, 0, 25.00, 25.00, false, NULL, 1),
('Standard Recharge', 'recharge-50', 50.00, 10, 55.00, 50.00, true, 'Most Popular', 2),
('Value Recharge', 'recharge-100', 100.00, 20, 120.00, 100.00, false, 'Best Value', 3),
('Premium Recharge', 'recharge-200', 200.00, 25, 250.00, 200.00, false, '25% Bonus', 4),
('VIP Recharge', 'recharge-500', 500.00, 30, 650.00, 500.00, false, 'Maximum Bonus', 5);

-- Promotional Offers
INSERT INTO promotional_offers (name, slug, code, offer_type, benefit_type, benefit_value, applies_to_booking, first_time_only, auto_apply, valid_from, valid_until) VALUES
('First Booking Discount', 'first-booking', 'FIRST25', 'first_booking', 'discount_percent', 25.00, true, true, true, NOW(), NOW() + INTERVAL '1 year'),
('Welcome Bonus', 'welcome-bonus', 'WELCOME10', 'first_booking', 'bonus_wallet', 10.00, false, true, true, NOW(), NOW() + INTERVAL '1 year');
