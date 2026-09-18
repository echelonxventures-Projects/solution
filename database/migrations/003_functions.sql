-- Migration: Add functions for common operations
-- Version: 003
-- Date: 2024-04-13

-- Function to generate availability slots
CREATE OR REPLACE FUNCTION generate_availability_slots(
    p_consultant_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_hourly_rate DECIMAL(10, 2),
    p_currency VARCHAR(10) DEFAULT 'USD'
) RETURNS INTEGER AS $$
DECLARE
    v_slots_count INTEGER := 0;
    v_rule RECORD;
    v_slot_start TIMESTAMP WITH TIME ZONE;
    v_slot_end TIMESTAMP WITH TIME ZONE;
    v_current_date DATE;
BEGIN
    -- Get availability rules
    FOR v_rule IN
        SELECT * FROM availability_rules
        WHERE consultant_id = p_consultant_id AND is_active = true
    LOOP
        v_current_date := p_start_date;

        WHILE v_current_date <= p_end_date LOOP
            -- Check if day matches rule
            IF EXTRACT(DOW FROM v_current_date) = v_rule.day_of_week THEN
                -- Generate 1-hour slots
                v_slot_start := (v_current_date + v_rule.start_time)::TIMESTAMP WITH TIME ZONE;

                WHILE v_slot_start + INTERVAL '1 hour' <= (v_current_date + v_rule.end_time)::TIMESTAMP WITH TIME ZONE LOOP
                    -- Insert slot if not exists
                    INSERT INTO availability_slots (
                        consultant_id, date, start_time, end_time,
                        status, price, currency
                    )
                    SELECT
                        p_consultant_id,
                        v_current_date,
                        v_slot_start,
                        v_slot_start + INTERVAL '1 hour',
                        'available',
                        p_hourly_rate,
                        p_currency
                    WHERE NOT EXISTS (
                        SELECT 1 FROM availability_slots
                        WHERE consultant_id = p_consultant_id
                        AND start_time = v_slot_start
                        AND status != 'blocked'
                    );

                    v_slots_count := v_slots_count + 1;
                    v_slot_start := v_slot_start + INTERVAL '1 hour';
                END LOOP;
            END IF;

            v_current_date := v_current_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;

    RETURN v_slots_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate consultant rating
CREATE OR REPLACE FUNCTION update_consultant_rating(
    p_consultant_id UUID
) RETURNS VOID AS $$
DECLARE
    v_avg_rating DECIMAL(3, 2);
    v_total_reviews INTEGER;
BEGIN
    SELECT
        COALESCE(AVG(rating), 0),
        COUNT(*)
    INTO v_avg_rating, v_total_reviews
    FROM reviews
    WHERE consultant_id = p_consultant_id AND is_public = true;

    UPDATE consultants
    SET
        avg_rating = v_avg_rating,
        total_reviews = v_total_reviews
    WHERE id = p_consultant_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_consultant_rating_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM update_consultant_rating(NEW.consultant_id);
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM update_consultant_rating(NEW.consultant_id);
        IF OLD.consultant_id != NEW.consultant_id THEN
            PERFORM update_consultant_rating(OLD.consultant_id);
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_consultant_rating(OLD.consultant_id);
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rating on new review
CREATE TRIGGER update_rating_on_review
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_consultant_rating_trigger();

-- Function to check booking conflict
CREATE OR REPLACE FUNCTION check_booking_conflict(
    p_consultant_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN AS $$
DECLARE
    v_conflict_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_conflict_count
    FROM bookings
    WHERE consultant_id = p_consultant_id
    AND status IN ('confirmed', 'pending')
    AND (
        (scheduled_start <= p_start_time AND scheduled_end > p_start_time)
        OR (scheduled_start < p_end_time AND scheduled_end >= p_end_time)
        OR (scheduled_start >= p_start_time AND scheduled_end <= p_end_time)
    );

    RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate earnings
CREATE OR REPLACE FUNCTION calculate_consultant_earnings(
    p_consultant_id UUID,
    p_period VARCHAR(20) DEFAULT 'month'
) RETURNS TABLE(
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    total_sessions INTEGER,
    total_hours DECIMAL(10, 2),
    total_earnings DECIMAL(10, 2),
    avg_rating DECIMAL(3, 2)
) AS $$
DECLARE
    v_start TIMESTAMP WITH TIME ZONE;
    v_end TIMESTAMP WITH TIME ZONE;
BEGIN
    CASE p_period
        WHEN 'week' THEN
            v_start := DATE_TRUNC('week', NOW());
            v_end := NOW();
        WHEN 'month' THEN
            v_start := DATE_TRUNC('month', NOW());
            v_end := NOW();
        WHEN 'year' THEN
            v_start := DATE_TRUNC('year', NOW());
            v_end := NOW();
        ELSE
            v_start := '1970-01-01'::TIMESTAMP WITH TIME ZONE;
            v_end := NOW();
    END CASE;

    RETURN QUERY
    SELECT
        v_start AS period_start,
        v_end AS period_end,
        COUNT(*) AS total_sessions,
        SUM(b.actual_duration_minutes) / 60.0 AS total_hours,
        COALESCE(SUM(p.consultant_earnings), 0) AS total_earnings,
        COALESCE(AVG(r.rating), 0) AS avg_rating
    FROM bookings b
    LEFT JOIN payments p ON b.id = p.booking_id AND p.status = 'completed'
    LEFT JOIN reviews r ON b.id = r.booking_id
    WHERE b.consultant_id = p_consultant_id
    AND b.status = 'completed'
    AND b.session_ended_at BETWEEN v_start AND v_end;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired slots
CREATE OR REPLACE FUNCTION cleanup_expired_slots()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    UPDATE availability_slots
    SET status = 'expired'
    WHERE status = 'available'
    AND end_time < NOW();

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('0 * * * *', $$SELECT cleanup_expired_slots()$$);