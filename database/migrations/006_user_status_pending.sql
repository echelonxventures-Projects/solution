-- ============================================
-- 006: Align users.status constraint with application UserStatus enum
-- Adds 'pending' status used for new registrations awaiting verification
-- ============================================

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check
    CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'deleted'));
