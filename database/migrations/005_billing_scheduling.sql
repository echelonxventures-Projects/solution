-- Billing Scheduling System - Comprehensive Time/Calendar Configuration
-- Add to database after 004_infinite_billing_config.sql

-- ============================================
-- SCHEDULE CONFIGURATION (for all billing options)
-- ============================================
CREATE TABLE billing_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,

    -- Schedule Type (infinite)
    schedule_type VARCHAR(50) NOT NULL, -- once, daily, weekly, monthly, yearly, custom, cron, recurring
    schedule_name VARCHAR(100), -- User-friendly name

    -- Start/End Time
    start_at TIMESTAMP NOT NULL,
    end_at TIMESTAMP DEFAULT NULL, -- NULL = never ends
    expires_at TIMESTAMP DEFAULT NULL,

    -- Recurrence Configuration (infinite patterns)
    recurrence_pattern VARCHAR(50) DEFAULT NULL, -- every_x, on_days, on_dates, cron_expression, custom_pattern
    recurrence_config JSONB DEFAULT '{}', -- {"interval": 1, "unit": "day", "on_days": ["monday", "wednesday"], "on_dates": [1, 15], "cron": "0 9 * * 1"}

    -- Trigger Configuration (infinite triggers)
    trigger_type VARCHAR(50) DEFAULT 'time', -- time, event, condition, webhook, user_action, system_event, threshold
    trigger_config JSONB DEFAULT '{}', -- {"event": "booking_completed", "condition": {"amount": ">100"}, "webhook_url": "...", "threshold": {"balance": "<10"}}

    -- Execution Times (for specific schedules)
    execution_times JSONB DEFAULT '[]', -- ["09:00", "15:00", "18:00"]

    -- Days Configuration
    days_of_week INT[] DEFAULT '{}', -- [1, 2, 3, 4, 5] = Monday to Friday (0=Sunday, 6=Saturday)
    days_of_month INT[] DEFAULT '{}', -- [1, 15, 30] = 1st, 15th, 30th
    months_of_year INT[] DEFAULT '{}', -- [1, 3, 6, 9] = Jan, Mar, Jun, Sep

    -- Time Zone Support
    timezone VARCHAR(50) DEFAULT 'UTC',
    timezone_config JSONB DEFAULT '{}',

    -- Exclusion/Exception Rules
    exclusions JSONB DEFAULT '[]', -- [{"date": "2024-12-25", "reason": "Christmas"}, {"range": {"start": "2024-01-01", "end": "2024-01-05"}}]
    exceptions JSONB DEFAULT '{}', -- Special rules for holidays, maintenance, etc.

    -- Active Hours/Periods
    active_hours JSONB DEFAULT '{}', -- {"start": "09:00", "end": "18:00", "lunch_break": {"start": "12:00", "end": "13:00"}}
    blackout_periods JSONB DEFAULT '[]', -- Periods when schedule is inactive

    -- Duration/Validity
    duration_minutes INT DEFAULT NULL, -- Duration of each occurrence
    validity_hours INT DEFAULT NULL, -- How long the scheduled action remains valid
    grace_period_minutes INT DEFAULT NULL, -- Grace period before action

    -- Actions
    action_type VARCHAR(50) NOT NULL, -- apply_promotion, send_reminder, expire_offer, trigger_rule, send_notification, execute_billing
    action_config JSONB NOT NULL DEFAULT '{}', -- Action-specific configuration
    action_target VARCHAR(50) DEFAULT NULL, -- What this schedule targets (promotion_id, rule_id, etc.)
    action_target_id UUID DEFAULT NULL,

    -- Retry/Failure Handling
    retry_on_failure BOOLEAN DEFAULT true,
    retry_config JSONB DEFAULT '{}', -- {"max_retries": 3, "retry_interval_minutes": 30, "retry_on": ["error", "timeout"]}
    failure_action VARCHAR(50) DEFAULT 'log', -- log, alert, retry, skip, escalate
    failure_config JSONB DEFAULT '{}',

    -- Notifications
    notify_before_minutes INT DEFAULT NULL, -- Notify X minutes before
    notify_on_execution BOOLEAN DEFAULT true,
    notify_on_failure BOOLEAN DEFAULT true,
    notification_config JSONB DEFAULT '{}',

    -- Priority & Conflicts
    priority INT DEFAULT 100,
    conflict_resolution VARCHAR(50) DEFAULT 'highest_priority', -- highest_priority, first_created, random, merge

    -- Tracking
    last_executed_at TIMESTAMP DEFAULT NULL,
    next_execution_at TIMESTAMP DEFAULT NULL,
    execution_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_paused BOOLEAN DEFAULT false,
    paused_at TIMESTAMP DEFAULT NULL,
    pause_reason TEXT DEFAULT NULL,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_billing_schedules_slug ON billing_schedules(slug);
CREATE INDEX idx_billing_schedules_type ON billing_schedules(schedule_type);
CREATE INDEX idx_billing_schedules_active ON billing_schedules(is_active) WHERE is_active = true;
CREATE INDEX idx_billing_schedules_next ON billing_schedules(next_execution_at);

-- ============================================
-- PROMOTION SCHEDULES (Link promotions to schedules)
-- ============================================
CREATE TABLE promotion_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES promotional_offers(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES billing_schedules(id) ON DELETE CASCADE,

    -- Override settings
    override_start BOOLEAN DEFAULT false,
    override_end BOOLEAN DEFAULT false,

    -- Priority
    priority INT DEFAULT 100,

    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- REMINDER SCHEDULES (for bookings, payments, etc.)
-- ============================================
CREATE TABLE reminder_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,

    -- Reminder Type (infinite)
    reminder_type VARCHAR(50) NOT NULL, -- booking_reminder, payment_reminder, subscription_reminder, expiry_reminder, follow_up, custom

    -- Target
    target_type VARCHAR(50) NOT NULL, -- booking, payment, subscription, promotion, wallet, user
    target_id UUID DEFAULT NULL,

    -- Timing Configuration (infinite timing options)
    timing_type VARCHAR(50) NOT NULL, -- relative, absolute, recurring, trigger_based
    timing_config JSONB NOT NULL DEFAULT '{}', -- {"relative_to": "booking_start", "offset_minutes": [-1440, -60, 0], "absolute_times": [...], "recurring_pattern": {...}}

    -- Relative Timing (common presets)
    relative_to VARCHAR(50) DEFAULT NULL, -- booking_start, booking_end, payment_due, subscription_expiry, last_activity
    offset_minutes INT[] DEFAULT '{}', -- [-1440, -720, -60, -30] = 24hrs, 12hrs, 1hr, 30min before
    offset_config JSONB DEFAULT '{}', -- More complex offset rules

    -- Absolute Timing
    absolute_times JSONB DEFAULT '[]', -- [{"time": "09:00", "timezone": "UTC"}, {"time": "18:00"}]

    -- Recurring Timing
    recurring_interval_minutes INT DEFAULT NULL, -- Repeat every X minutes
    recurring_config JSONB DEFAULT '{}', -- {"max_repeats": 5, "stop_on_response": true}

    -- Trigger-Based Timing
    trigger_event VARCHAR(50) DEFAULT NULL, -- payment_completed, session_started, user_action
    trigger_delay_minutes INT DEFAULT NULL, -- Delay after trigger
    trigger_config JSONB DEFAULT '{}',

    -- Content Configuration
    message_template TEXT NOT NULL,
    message_variables JSONB DEFAULT '{}', -- Available variables for template
    message_config JSONB DEFAULT '{}', -- Formatting, localization, etc.

    -- Channels (infinite)
    channels JSONB NOT NULL DEFAULT '[]', -- ["email", "sms", "push", "whatsapp", "in_app", "web_push"]
    channel_config JSONB DEFAULT '{}', -- {"email": {"template_id": "..."}, "sms": {"sender": "..."}}

    -- Escalation (reminders that get stronger)
    escalation_enabled BOOLEAN DEFAULT false,
    escalation_config JSONB DEFAULT '{}', -- [{"after_minutes": 60, "channels": ["sms", "push"], "message": "URGENT: ..."}]

    -- Conditions (only send if conditions met)
    conditions JSONB DEFAULT '{}', -- {"booking_status": ["confirmed", "pending"], "amount": {"min": 50}}

    -- Limits
    max_reminders INT DEFAULT 3, -- Maximum reminders per target
    min_interval_minutes INT DEFAULT 60, -- Minimum time between reminders
    stop_on_action BOOLEAN DEFAULT true, -- Stop sending if user takes action

    -- Tracking
    sent_count INT DEFAULT 0,
    last_sent_at TIMESTAMP DEFAULT NULL,
    next_send_at TIMESTAMP DEFAULT NULL,

    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reminder_schedules_type ON reminder_schedules(reminder_type);
CREATE INDEX idx_reminder_schedules_target ON reminder_schedules(target_type, target_id);
CREATE INDEX idx_reminder_schedules_next ON reminder_schedules(next_send_at);

-- ============================================
-- EXPIRY/TRIGGER RULES (for all time-based events)
-- ============================================
CREATE TABLE expiry_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,

    -- Rule Type
    rule_type VARCHAR(50) NOT NULL, -- expire, activate, deactivate, trigger, schedule, recurring

    -- Target (infinite targets)
    target_type VARCHAR(50) NOT NULL, -- promotion, booking, subscription, wallet_balance, credits, offer, session, content
    target_id UUID DEFAULT NULL,

    -- Expiry Configuration (infinite expiry options)
    expiry_type VARCHAR(50) NOT NULL, -- absolute, relative, conditional, usage_based, inactivity_based, never

    -- Absolute Expiry
    expires_at TIMESTAMP DEFAULT NULL,
    expiry_timezone VARCHAR(50) DEFAULT 'UTC',

    -- Relative Expiry (relative to creation or event)
    relative_to VARCHAR(50) DEFAULT NULL, -- creation, first_use, last_use, activation, event
    expiry_after_minutes INT DEFAULT NULL,
    expiry_after_hours INT DEFAULT NULL,
    expiry_after_days INT DEFAULT NULL,
    expiry_after_months INT DEFAULT NULL,
    expiry_after_years INT DEFAULT NULL,
    expiry_config JSONB DEFAULT '{}', -- {"valid_for": {"hours": 24, "days": 7}, "extend_on_use": true}

    -- Conditional Expiry (expire when conditions met)
    expiry_conditions JSONB DEFAULT '{}', -- {"when": {"usage_count": ">5", "balance": "<0", "status": "cancelled"}}
    expiry_trigger VARCHAR(50) DEFAULT NULL, -- Event that triggers expiry check

    -- Usage-Based Expiry
    max_uses INT DEFAULT NULL, -- Expire after X uses
    usage_count INT DEFAULT 0,

    -- Inactivity-Based Expiry
    inactivity_after_days INT DEFAULT NULL, -- Expire after X days of no activity
    inactivity_config JSONB DEFAULT '{}', -- What counts as activity

    -- Auto-Extend Options
    auto_extend_enabled BOOLEAN DEFAULT false,
    auto_extend_conditions JSONB DEFAULT '{}', -- Conditions that trigger auto-extend
    auto_extend_config JSONB DEFAULT '{}', -- {"extend_by_days": 7, "max_extensions": 3}

    -- Pre-Expiry Actions
    pre_expiry_actions JSONB DEFAULT '[]', -- Actions X time before expiry [{"minutes_before": 1440, "action": "notify", "channels": ["email", "push"]}]

    -- Post-Expiry Actions
    post_expiry_actions JSONB DEFAULT '[]', -- Actions after expiry [{"action": "archive", "notify": true, "cleanup": true}]
    cleanup_config JSONB DEFAULT '{}', -- What to do with expired items

    -- Grace Period
    grace_period_minutes INT DEFAULT 0, -- Allow usage X minutes after expiry
    grace_period_actions JSONB DEFAULT '{}',

    -- Notifications
    notify_before_expiry BOOLEAN DEFAULT true,
    notify_on_expiry BOOLEAN DEFAULT true,
    notification_config JSONB DEFAULT '{}', -- Times and channels for notifications

    -- Status
    is_active BOOLEAN DEFAULT true,
    applied_count INT DEFAULT 0,
    last_applied_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_expiry_rules_type ON expiry_rules(rule_type);
CREATE INDEX idx_expiry_rules_target ON expiry_rules(target_type, target_id);

-- ============================================
-- TRIGGER RULES (event-based triggers)
-- ============================================
CREATE TABLE trigger_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,

    -- Trigger Type (infinite)
    trigger_type VARCHAR(50) NOT NULL, -- event, time, condition, threshold, user_action, system_event, webhook, schedule, manual

    -- Event Triggers
    event_type VARCHAR(100) DEFAULT NULL, -- booking.created, payment.completed, subscription.expired, user.registered, session.started
    event_source VARCHAR(50) DEFAULT NULL, -- system, user, api, webhook, cron
    event_config JSONB DEFAULT '{}', -- Additional event configuration

    -- Time Triggers (time-based)
    time_trigger_type VARCHAR(50) DEFAULT NULL, -- scheduled, recurring, cron, interval
    time_config JSONB DEFAULT '{}', -- {"schedule": "0 9 * * *", "interval_minutes": 60}

    -- Condition Triggers (trigger when conditions met)
    condition_type VARCHAR(50) DEFAULT NULL, -- database, api, threshold, comparison, composite
    conditions JSONB NOT NULL DEFAULT '{}', -- {"field": "balance", "operator": "<", "value": 10, "check_interval_minutes": 5}

    -- Threshold Triggers
    threshold_type VARCHAR(50) DEFAULT NULL, -- count, amount, time, percentage, custom
    threshold_config JSONB DEFAULT '{}', -- {"metric": "api_calls", "threshold": 1000, "period": "daily"}

    -- User Action Triggers
    user_action VARCHAR(50) DEFAULT NULL, -- login, booking_made, payment_completed, profile_updated
    user_action_config JSONB DEFAULT '{}',

    -- System Event Triggers
    system_event VARCHAR(50) DEFAULT NULL, -- maintenance_start, backup_complete, error_threshold_reached
    system_event_config JSONB DEFAULT '{}',

    -- Webhook Triggers
    webhook_url VARCHAR(500) DEFAULT NULL,
    webhook_config JSONB DEFAULT '{}', -- {"method": "POST", "headers": {...}, "auth": {...}}
    webhook_retry_config JSONB DEFAULT '{}',

    -- Composite Triggers (multiple conditions)
    composite_type VARCHAR(50) DEFAULT NULL, -- and, or, sequence, parallel
    composite_triggers UUID[] DEFAULT '{}', -- IDs of other trigger rules to combine
    composite_config JSONB DEFAULT '{}',

    -- Trigger Actions (infinite action types)
    action_type VARCHAR(50) NOT NULL, -- apply_promotion, send_notification, execute_billing, update_record, call_api, create_booking, send_webhook, log_event, trigger_workflow
    action_config JSONB NOT NULL DEFAULT '{}', -- Action-specific configuration
    action_target UUID DEFAULT NULL, -- Target entity for action

    -- Action Sequencing
    sequential_actions JSONB DEFAULT '[]', -- Multiple actions in sequence [{"action": "...", "delay": 5, "config": {...}]
    parallel_actions JSONB DEFAULT '[]', -- Multiple actions in parallel

    -- Retry Configuration
    retry_enabled BOOLEAN DEFAULT true,
    retry_config JSONB DEFAULT '{}', -- {"max_retries": 3, "retry_delay_minutes": 5, "backoff": "exponential"}

    -- Failure Handling
    on_failure VARCHAR(50) DEFAULT 'log', -- log, retry, alert, fallback, escalate, ignore
    failure_config JSONB DEFAULT '{}',
    fallback_action VARCHAR(50) DEFAULT NULL, -- Alternative action on failure
    fallback_config JSONB DEFAULT '{}',

    -- Cooldown (prevent trigger spam)
    cooldown_minutes INT DEFAULT 0, -- Wait X minutes before triggering again
    cooldown_config JSONB DEFAULT '{}', -- Different cooldowns for different scenarios

    -- Rate Limiting
    rate_limit_enabled BOOLEAN DEFAULT false,
    rate_limit_config JSONB DEFAULT '{}', -- {"max_per_minute": 10, "max_per_hour": 100}

    -- Priority (higher priority triggers first)
    priority INT DEFAULT 100,

    -- Tracking
    trigger_count INT DEFAULT 0,
    last_triggered_at TIMESTAMP DEFAULT NULL,
    next_trigger_at TIMESTAMP DEFAULT NULL,
    failure_count INT DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_paused BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trigger_rules_type ON trigger_rules(trigger_type);
CREATE INDEX idx_trigger_rules_event ON trigger_rules(event_type);
CREATE INDEX idx_trigger_rules_active ON trigger_rules(is_active) WHERE is_active = true;

-- ============================================
-- TIME-BASED BILLING RULES (special rules that apply at specific times)
-- ============================================
CREATE TABLE time_based_billing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES billing_rules(id) ON DELETE CASCADE,

    -- Time Type
    time_rule_type VARCHAR(50) NOT NULL, -- time_of_day, day_of_week, day_of_month, month_of_year, season, holiday, custom_period

    -- Time of Day Rules
    time_ranges JSONB DEFAULT '[]', -- [{"start": "09:00", "end": "12:00", "action": {...}}, {"start": "18:00", "end": "22:00", "action": {...}}]

    -- Day of Week Rules
    days_of_week_config JSONB DEFAULT '{}', -- {"weekdays": {"rate_multiplier": 1.0}, "weekends": {"rate_multiplier": 1.5}}

    -- Day of Month Rules
    days_of_month_config JSONB DEFAULT '{}', -- {"first_of_month": {...}, "last_of_month": {...}, "specific_days": [1, 15, 30]}

    -- Month of Year Rules
    months_config JSONB DEFAULT '{}', -- Seasonal pricing, holiday periods

    -- Holiday Rules
    holidays JSONB DEFAULT '[]', -- [{"date": "2024-12-25", "name": "Christmas", "action": {...}}
    holiday_config JSONB DEFAULT '{}', -- Default holiday behavior

    -- Custom Period Rules
    custom_periods JSONB DEFAULT '[]', -- [{"name": "Summer Sale", "start": "2024-06-01", "end": "2024-08-31", "action": {...}}

    -- Recurrence
    recurring BOOLEAN DEFAULT false,
    recurrence_config JSONB DEFAULT '{}',

    -- Priority (more specific rules override general ones)
    specificity_level INT DEFAULT 1, -- 1=general, 2=day type, 3=specific day, 4=specific time

    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_time_billing_rule ON time_based_billing_rules(rule_id);

-- ============================================
-- CALENDAR/AVAILABILITY SCHEDULES (for consultants)
-- ============================================
CREATE TABLE calendar_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,

    -- Schedule Name
    name VARCHAR(100) DEFAULT 'Default Schedule',

    -- Working Hours (per day)
    working_hours JSONB NOT NULL DEFAULT '{}', -- {"monday": [{"start": "09:00", "end": "12:00"}, {"start": "14:00", "end": "18:00"}], "tuesday": [...]}

    -- Timezone
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',

    -- Default Availability
    default_available_days INT[] DEFAULT '{1, 2, 3, 4, 5}', -- Monday to Friday
    default_start_time TIME DEFAULT '09:00',
    default_end_time TIME DEFAULT '18:00',

    -- Breaks
    breaks JSONB DEFAULT '[]', -- [{"type": "lunch", "start": "12:00", "end": "13:00", "days": [1, 2, 3, 4, 5]}]

    -- Exceptions (specific dates)
    exceptions JSONB DEFAULT '[]', -- [{"date": "2024-12-25", "status": "unavailable", "reason": "Christmas"}, {"date": "2024-01-15", "hours": [{"start": "10:00", "end": "15:00"}]}]

    -- Recurring Exceptions (vacations, regular offs)
    recurring_exceptions JSONB DEFAULT '[]', -- [{"type": "vacation", "pattern": "annual", "month": 7, "duration_days": 14}]

    -- Booking Window (how far in advance bookings can be made)
    min_advance_hours INT DEFAULT 1, -- Minimum hours before booking
    max_advance_days INT DEFAULT 30, -- Maximum days in advance

    -- Buffer Time
    buffer_before_minutes INT DEFAULT 0, -- Buffer before each session
    buffer_after_minutes INT DEFAULT 15, -- Buffer after each session

    -- Session Duration Options
    min_session_minutes INT DEFAULT 15,
    max_session_minutes INT DEFAULT 480,
    default_session_minutes INT DEFAULT 60,
    session_options INT[] DEFAULT '{15, 30, 45, 60, 90, 120}', -- Available durations

    -- Availability Override (temporary changes)
    override_start TIMESTAMP DEFAULT NULL,
    override_end TIMESTAMP DEFAULT NULL,
    override_config JSONB DEFAULT '{}', -- Temporary override of normal schedule

    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calendar_schedule_consultant ON calendar_schedules(consultant_id);

-- ============================================
-- SEED DATA
-- ============================================

-- Reminder Schedule Examples
INSERT INTO reminder_schedules (name, slug, reminder_type, target_type, timing_type, timing_config, relative_to, offset_minutes, message_template, channels, is_active) VALUES
('Booking Reminder - 24h', 'booking-24h', 'booking_reminder', 'booking', 'relative', '{}', 'booking_start', ARRAY[-1440], 'Your booking with {{consultant_name}} is tomorrow at {{booking_time}}. Don''t forget!', '["email", "push"]', true),
('Booking Reminder - 1h', 'booking-1h', 'booking_reminder', 'booking', 'relative', '{}', 'booking_start', ARRAY[-60], 'Your session starts in 1 hour! Join at {{session_url}}', '["push", "sms"]', true),
('Payment Reminder', 'payment-reminder', 'payment_reminder', 'payment', 'relative', '{}', 'payment_due', ARRAY[-1440, -720, -60], 'Payment reminder: {{amount}} is due on {{due_date}}', '["email", "push"]', true),
('Subscription Expiry', 'subscription-expiry', 'expiry_reminder', 'subscription', 'relative', '{}', 'subscription_expiry', ARRAY[-7200, -1440, 0], 'Your subscription expires {{time_remaining}}. Renew now to keep your benefits!', '["email", "push", "sms"]', true);

-- Expiry Rules Examples
INSERT INTO expiry_rules (name, slug, rule_type, target_type, expiry_type, expiry_after_days, pre_expiry_actions, post_expiry_actions, is_active) VALUES
('Promotion Expiry', 'promotion-expiry', 'expire', 'promotion', 'relative', 30, '[{"days_before": 7, "action": "notify", "channels": ["email"]}]', '[{"action": "deactivate", "notify": true}]', true),
('Booking Auto-Cancel', 'booking-auto-cancel', 'expire', 'booking', 'relative', 1, '[{"hours_before": 2, "action": "warn"}]', '[{"action": "cancel", "notify": true, "refund": true}]', true),
('Wallet Bonus Expiry', 'wallet-bonus-expiry', 'expire', 'wallet_balance', 'relative', 90, '[{"days_before": 30, "action": "notify"}]', '[{"action": "deduct", "notify": true}]', true),
('Session Recording Expiry', 'recording-expiry', 'expire', 'content', 'relative', 30, '[]', '[{"action": "archive", "cleanup": true}]', true);

-- Trigger Rule Examples
INSERT INTO trigger_rules (name, slug, trigger_type, event_type, action_type, action_config, is_active) VALUES
('Welcome Email', 'welcome-email', 'event', 'user.registered', 'send_notification', '{"template": "welcome", "channels": ["email"]}', true),
('Booking Created', 'booking-created', 'event', 'booking.created', 'trigger_workflow', '{"workflow": "booking_confirmation"}', true),
('Low Balance Alert', 'low-balance', 'threshold', NULL, 'send_notification', '{"template": "low_balance", "channels": ["email", "push"], "condition": {"balance": "<10"}}', true),
('Subscription Renewal', 'subscription-renew', 'time', NULL, 'execute_billing', '{"action": "renew_subscription", "notify": true}', true);
