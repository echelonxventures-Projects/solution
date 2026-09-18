-- Migration: Add indexes for performance optimization
-- Version: 002
-- Date: 2024-04-13

-- Additional indexes for search optimization
CREATE INDEX idx_consultants_search_trgm ON consultants USING gin(title gin_trgm_ops);
CREATE INDEX idx_consultants_bio_trgm ON consultants USING gin(bio gin_trgm_ops);

-- Composite indexes for common queries
CREATE INDEX idx_bookings_consultant_status_date ON bookings(consultant_id, status, scheduled_start);
CREATE INDEX idx_bookings_seeker_status_date ON bookings(seeker_id, status, scheduled_start);
CREATE INDEX idx_availability_slots_consultant_date_status ON availability_slots(consultant_id, date, status);

-- Partial indexes
CREATE INDEX idx_bookings_upcoming ON bookings(status, scheduled_start) WHERE status IN ('confirmed', 'pending');
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE status NOT IN ('read', 'failed');
CREATE INDEX idx_consultants_available_verified ON consultants(avg_rating DESC) WHERE is_verified = true AND is_available = true;

-- Optimization for count queries
CREATE INDEX idx_payments_status_currency_date ON payments(status, currency, created_at);