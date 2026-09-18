-- Online Consultancy Platform Database Schema
-- PostgreSQL 15

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'seeker' CHECK (role IN ('seeker', 'consultant', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    language VARCHAR(10) DEFAULT 'en',
    country VARCHAR(10) DEFAULT 'US',
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(10) DEFAULT 'USD',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Sessions (auth sessions)
CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    device_info JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_expires_at ON auth_sessions(expires_at);

-- ============================================
-- CONSULTANTS
-- ============================================

CREATE TABLE consultants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    bio TEXT,
    hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    experience_years INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_hours INTEGER DEFAULT 0,
    avg_rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    response_rate INTEGER DEFAULT 100,
    response_time_hours INTEGER DEFAULT 24,
    is_verified BOOLEAN DEFAULT false,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    is_featured BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    profile_completed BOOLEAN DEFAULT false,
    onboarding_completed BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_consultants_user_id ON consultants(user_id);
CREATE INDEX idx_consultants_rating ON consultants(avg_rating DESC);
CREATE INDEX idx_consultants_verified ON consultants(is_verified);
CREATE INDEX idx_consultants_featured ON consultants(is_featured);

-- Consultant Skills
CREATE TABLE consultant_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
    skill VARCHAR(100) NOT NULL,
    proficiency_level INTEGER DEFAULT 1 CHECK (proficiency_level BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_consultant_skills_consultant_id ON consultant_skills(consultant_id);
CREATE INDEX idx_consultant_skills_skill ON consultant_skills(skill);

-- Consultant Languages
CREATE TABLE consultant_languages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    proficiency VARCHAR(20) CHECK (proficiency IN ('native', 'fluent', 'advanced', 'intermediate', 'basic')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_consultant_languages_consultant_id ON consultant_languages(consultant_id);

-- ============================================
-- VERTICALS (Categories)
-- ============================================

CREATE TABLE verticals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    parent_id UUID REFERENCES verticals(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verticals_slug ON verticals(slug);
CREATE INDEX idx_verticals_parent_id ON verticals(parent_id);
CREATE INDEX idx_verticals_level ON verticals(level);

-- Consultant Verticals (many-to-many)
CREATE TABLE consultant_verticals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
    vertical_id UUID NOT NULL REFERENCES verticals(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    experience_years INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(consultant_id, vertical_id)
);

CREATE INDEX idx_consultant_verticals_consultant_id ON consultant_verticals(consultant_id);
CREATE INDEX idx_consultant_verticals_vertical_id ON consultant_verticals(vertical_id);

-- ============================================
-- AVAILABILITY & SLOTS
-- ============================================

CREATE TABLE availability_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_availability_rules_consultant_id ON availability_rules(consultant_id);

CREATE TABLE availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked', 'expired')),
    booking_id UUID,
    price DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    is_recurring BOOLEAN DEFAULT false,
    recurring_rule_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_availability_slots_consultant_id ON availability_slots(consultant_id);
CREATE INDEX idx_availability_slots_date ON availability_slots(date);
CREATE INDEX idx_availability_slots_status ON availability_slots(status);
CREATE INDEX idx_availability_slots_start_time ON availability_slots(start_time);

-- ============================================
-- BOOKINGS
-- ============================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultant_id UUID NOT NULL REFERENCES consultants(id),
    seeker_id UUID NOT NULL REFERENCES users(id),
    slot_id UUID REFERENCES availability_slots(id),
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled')),
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    rescheduled_from UUID REFERENCES bookings(id),
    rescheduled_to UUID REFERENCES bookings(id),
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    session_started_at TIMESTAMP WITH TIME ZONE,
    session_ended_at TIMESTAMP WITH TIME ZONE,
    actual_duration_minutes INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bookings_consultant_id ON bookings(consultant_id);
CREATE INDEX idx_bookings_seeker_id ON bookings(seeker_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled_start ON bookings(scheduled_start);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

-- ============================================
-- PAYMENTS
-- ============================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    seeker_id UUID NOT NULL REFERENCES users(id),
    consultant_id UUID NOT NULL REFERENCES consultants(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    platform_fee DECIMAL(10, 2) NOT NULL,
    consultant_earnings DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'wallet', 'credits')),
    payment_provider VARCHAR(20),
    provider_transaction_id VARCHAR(255),
    provider_customer_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'partial_refund')),
    refund_amount DECIMAL(10, 2) DEFAULT 0,
    refund_reason TEXT,
    refunded_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_seeker_id ON payments(seeker_id);
CREATE INDEX idx_payments_consultant_id ON payments(consultant_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    pdf_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoices_payment_id ON invoices(payment_id);

-- ============================================
-- SESSIONS (Communication)
-- ============================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    room_id VARCHAR(100) UNIQUE NOT NULL,
    room_token TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended', 'failed')),
    recording_enabled BOOLEAN DEFAULT false,
    recording_url TEXT,
    transcription_enabled BOOLEAN DEFAULT false,
    transcription_url TEXT,
    transcription_text TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    participant_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_booking_id ON sessions(booking_id);
CREATE INDEX idx_sessions_room_id ON sessions(room_id);
CREATE INDEX idx_sessions_status ON sessions(status);

-- Session Messages (chat)
CREATE TABLE session_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'link', 'system')),
    file_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_session_messages_session_id ON session_messages(session_id);
CREATE INDEX idx_session_messages_created_at ON session_messages(created_at);

-- ============================================
-- REVIEWS
-- ============================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    session_id UUID REFERENCES sessions(id),
    consultant_id UUID NOT NULL REFERENCES consultants(id),
    seeker_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_public BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(booking_id)
);

CREATE INDEX idx_reviews_consultant_id ON reviews(consultant_id);
CREATE INDEX idx_reviews_seeker_id ON reviews(seeker_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);

-- ============================================
-- CONTENT (Learning Materials)
-- ============================================

CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultant_id UUID NOT NULL REFERENCES consultants(id),
    vertical_id UUID REFERENCES verticals(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('video', 'document', 'audio', 'course', 'ebook')),
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    file_size_bytes INTEGER,
    format VARCHAR(50),
    is_free BOOLEAN DEFAULT false,
    price DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'archived')),
    view_count INTEGER DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_consultant_id ON content(consultant_id);
CREATE INDEX idx_content_vertical_id ON content(vertical_id);
CREATE INDEX idx_content_type ON content(content_type);
CREATE INDEX idx_content_status ON content(status);

-- Content Purchases
CREATE TABLE content_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content(id),
    user_id UUID NOT NULL REFERENCES users(id),
    payment_id UUID REFERENCES payments(id),
    amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, user_id)
);

CREATE INDEX idx_content_purchases_content_id ON content_purchases(content_id);
CREATE INDEX idx_content_purchases_user_id ON content_purchases(user_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    channel VARCHAR(20) DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'sms', 'push', 'whatsapp')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================
-- VERIFICATIONS (Consultant Credentials)
-- ============================================

CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN ('identity', 'email', 'phone', 'credential', 'portfolio')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    document_type VARCHAR(50),
    document_url TEXT,
    document_name VARCHAR(255),
    institution VARCHAR(255),
    title VARCHAR(255),
    year INTEGER,
    notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verifications_consultant_id ON verifications(consultant_id);
CREATE INDEX idx_verifications_status ON verifications(status);

-- ============================================
-- SUBSCRIPTIONS (Consultant Packages)
-- ============================================

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2),
    price_yearly DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    plan_id UUID REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT,
    stripe_subscription_id VARCHAR(255),
    paypal_subscription_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG (Compliance)
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- SETTINGS
-- ============================================

CREATE TABLE platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    value_type VARCHAR(20) DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- WEBHOOKS
-- ============================================

CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
    processed_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhooks_event_type ON webhooks(event_type);
CREATE INDEX idx_webhooks_status ON webhooks(status);

-- ============================================
-- AI MEMORY & INTERACTIONS
-- ============================================

CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES sessions(id),
    interaction_type VARCHAR(50) NOT NULL,
    input TEXT NOT NULL,
    output TEXT,
    model VARCHAR(50),
    tokens_used INTEGER,
    latency_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_type ON ai_interactions(interaction_type);
CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultants_updated_at BEFORE UPDATE ON consultants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verifications_updated_at BEFORE UPDATE ON verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA (SEEDS)
-- ============================================

-- Insert default verticals
INSERT INTO verticals (name, slug, description, icon, level, sort_order) VALUES
('Technology', 'technology', 'Software development, IT, and tech consulting', 'code', 1, 1),
('Business', 'business', 'Business strategy, management, and entrepreneurship', 'briefcase', 1, 2),
('Health & Wellness', 'health', 'Medical, fitness, and mental health consulting', 'heart', 1, 3),
('Legal', 'legal', 'Legal advice and compliance consulting', 'scale', 1, 4),
('Finance', 'finance', 'Financial planning, investment, and accounting', 'dollar', 1, 5),
('Education', 'education', 'Academic tutoring and educational consulting', 'book', 1, 6),
('Career Development', 'career', 'Career coaching and professional development', 'trending-up', 1, 7),
('Creative Arts', 'creative', 'Design, writing, and creative consulting', 'palette', 1, 8),
('Marketing', 'marketing', 'Digital marketing, branding, and growth', 'megaphone', 1, 9),
('Life Coaching', 'lifestyle', 'Personal development and lifestyle consulting', 'sun', 1, 10);

-- Insert sub-verticals for Technology
INSERT INTO verticals (name, slug, description, parent_id, level, sort_order) VALUES
('Software Development', 'software-dev', 'Web, mobile, and desktop development',
    (SELECT id FROM verticals WHERE slug = 'technology'), 2, 1),
('Data Science', 'data-science', 'Data analysis, ML, and AI',
    (SELECT id FROM verticals WHERE slug = 'technology'), 2, 2),
('Cloud Architecture', 'cloud', 'AWS, GCP, Azure consulting',
    (SELECT id FROM verticals WHERE slug = 'technology'), 2, 3),
('Cybersecurity', 'security', 'Security audits and consulting',
    (SELECT id FROM verticals WHERE slug = 'technology'), 2, 4),
('Mobile Development', 'mobile-dev', 'iOS and Android development',
    (SELECT id FROM verticals WHERE slug = 'technology'), 2, 5);

-- Insert platform settings
INSERT INTO platform_settings (key, value, value_type, description, is_public) VALUES
('platform_name', 'Online Consultancy Platform', 'string', 'Platform display name', true),
('platform_fee_percentage', '15', 'number', 'Platform fee percentage', true),
('min_booking_amount', '10', 'number', 'Minimum booking amount in USD', true),
('max_booking_duration', '480', 'number', 'Maximum session duration in minutes', true),
('default_session_duration', '60', 'number', 'Default session duration in minutes', true),
('booking_reminder_hours', '24', 'number', 'Hours before session to send reminder', false),
('auto_approve_consultants', 'false', 'boolean', 'Auto-approve new consultants', false),
('enable_video_sessions', 'true', 'boolean', 'Enable video session feature', true),
('enable_whatsapp_bot', 'true', 'boolean', 'Enable WhatsApp bot', true),
('enable_ai_chatbot', 'true', 'boolean', 'Enable AI chatbot', true),
('support_email', 'support@platform.com', 'string', 'Support email address', true),
('default_currency', 'USD', 'string', 'Default currency', true),
('default_language', 'en', 'string', 'Default language', true);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Create read-only user for analytics
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'consultancy_readonly') THEN
        CREATE USER consultancy_readonly WITH PASSWORD 'readonly_password';
    END IF;
END
$$;
GRANT CONNECT ON DATABASE consultancy TO consultancy_readonly;
GRANT USAGE ON SCHEMA public TO consultancy_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO consultancy_readonly;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Consultant search view
CREATE VIEW consultant_search_view AS
SELECT
    c.id,
    c.user_id,
    u.first_name || ' ' || u.last_name AS name,
    u.avatar_url,
    c.title,
    c.bio,
    c.hourly_rate,
    c.currency,
    c.avg_rating,
    c.total_reviews,
    c.total_sessions,
    c.is_verified,
    c.is_featured,
    c.is_available,
    v.name AS primary_vertical,
    array_agg(DISTINCT cs.skill) AS skills,
    array_agg(DISTINCT cl.language_code) AS languages
FROM consultants c
JOIN users u ON c.user_id = u.id
LEFT JOIN consultant_verticals cv ON c.id = cv.consultant_id AND cv.is_primary = true
LEFT JOIN verticals v ON cv.vertical_id = v.id
LEFT JOIN consultant_skills cs ON c.id = cs.consultant_id
LEFT JOIN consultant_languages cl ON c.id = cl.consultant_id
WHERE u.status = 'active' AND c.is_available = true
GROUP BY c.id, u.id, v.id;

-- Booking dashboard view
CREATE VIEW booking_dashboard_view AS
SELECT
    b.id,
    b.status,
    b.scheduled_start,
    b.duration_minutes,
    c.id AS consultant_id,
    c_user.first_name || ' ' || c_user.last_name AS consultant_name,
    s.id AS seeker_id,
    s.first_name || ' ' || s.last_name AS seeker_name,
    p.total_amount,
    p.currency,
    b.created_at
FROM bookings b
JOIN consultants c ON b.consultant_id = c.id
JOIN users c_user ON c.user_id = c_user.id
JOIN users s ON b.seeker_id = s.id
LEFT JOIN payments p ON b.id = p.booking_id;

-- Revenue analytics view
CREATE VIEW revenue_analytics_view AS
SELECT
    DATE_TRUNC('day', created_at) AS date,
    COUNT(*) AS transaction_count,
    SUM(total_amount) AS total_revenue,
    SUM(platform_fee) AS platform_revenue,
    SUM(consultant_earnings) AS consultant_payouts,
    AVG(total_amount) AS avg_transaction,
    currency
FROM payments
WHERE status = 'completed'
GROUP BY DATE_TRUNC('day', created_at), currency
ORDER BY date DESC;