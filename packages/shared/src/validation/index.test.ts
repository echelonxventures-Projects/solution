import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  createBookingSchema,
  createReviewSchema,
  paginationSchema,
  searchConsultantsSchema,
  registerConsultantSchema,
  weeklyScheduleSchema,
  validateUUID,
} from './index';

const VALID_UUID = '5f0d0c5f-1f0d-4f0d-8f0d-0f0d0c5f1f0d';

describe('validation schemas', () => {
  describe('registerSchema', () => {
    it('accepts a strong password and defaults role to seeker', () => {
      const result = registerSchema.parse({ email: 'a@b.com', password: 'Password1' });
      expect(result.role).toBe('seeker');
      expect(result.email).toBe('a@b.com');
    });

    it('rejects weak passwords', () => {
      expect(registerSchema.safeParse({ email: 'a@b.com', password: 'lowercase1' }).success).toBe(false);
      expect(registerSchema.safeParse({ email: 'a@b.com', password: 'NoNumber!!' }).success).toBe(false);
      expect(registerSchema.safeParse({ email: 'a@b.com', password: 'short1A' }).success).toBe(false);
    });

    it('rejects invalid emails and phones', () => {
      expect(registerSchema.safeParse({ email: 'not-an-email', password: 'Password1' }).success).toBe(false);
      expect(registerSchema.safeParse({ email: 'a@b.com', password: 'Password1', phone: 'abc' }).success).toBe(false);
      expect(registerSchema.safeParse({ email: 'a@b.com', password: 'Password1', phone: '+9779812345678' }).success).toBe(true);
    });
  });

  describe('loginSchema', () => {
    it('accepts optional 6-digit 2FA code', () => {
      expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x', twoFactorCode: '123456' }).success).toBe(true);
      expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x', twoFactorCode: '12345' }).success).toBe(false);
    });

    it('requires a non-empty password', () => {
      expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('enforces password strength', () => {
      expect(resetPasswordSchema.safeParse({ token: 't', newPassword: 'Weakpass' }).success).toBe(false);
      expect(resetPasswordSchema.safeParse({ token: 't', newPassword: 'StrongPass9' }).success).toBe(true);
    });
  });

  describe('createBookingSchema', () => {
    const valid = {
      consultantId: VALID_UUID,
      verticalId: VALID_UUID,
      scheduledStart: '2026-05-01T10:00:00Z',
      durationMinutes: 60,
      sessionType: 'video',
    };

    it('accepts a valid booking', () => {
      expect(createBookingSchema.safeParse(valid).success).toBe(true);
    });

    it('enforces duration bounds (5-480)', () => {
      expect(createBookingSchema.safeParse({ ...valid, durationMinutes: 4 }).success).toBe(false);
      expect(createBookingSchema.safeParse({ ...valid, durationMinutes: 481 }).success).toBe(false);
    });

    it('requires uuids and ISO datetimes', () => {
      expect(createBookingSchema.safeParse({ ...valid, consultantId: 'x' }).success).toBe(false);
      expect(createBookingSchema.safeParse({ ...valid, scheduledStart: 'tomorrow' }).success).toBe(false);
    });

    it('restricts session types', () => {
      expect(createBookingSchema.safeParse({ ...valid, sessionType: 'carrier-pigeon' }).success).toBe(false);
    });
  });

  describe('createReviewSchema', () => {
    it('enforces rating bounds 1-5', () => {
      const base = { referenceId: VALID_UUID, reviewType: 'consultant' };
      expect(createReviewSchema.safeParse({ ...base, rating: 0 }).success).toBe(false);
      expect(createReviewSchema.safeParse({ ...base, rating: 6 }).success).toBe(false);
      expect(createReviewSchema.safeParse({ ...base, rating: 5 }).success).toBe(true);
    });
  });

  describe('paginationSchema', () => {
    it('coerces strings and applies defaults', () => {
      const result = paginationSchema.parse({ limit: '10', offset: '20' });
      expect(result).toEqual({ limit: 10, offset: 20 });
      expect(paginationSchema.parse({})).toEqual({ limit: 20, offset: 0 });
    });

    it('caps limit at 100', () => {
      expect(paginationSchema.safeParse({ limit: 101 }).success).toBe(false);
    });
  });

  describe('searchConsultantsSchema', () => {
    it('merges pagination and sorting', () => {
      const result = searchConsultantsSchema.parse({ minRating: '4.5', maxPrice: '100' });
      expect(result.limit).toBe(20);
      expect(result.order).toBe('desc');
      expect(result.minRating).toBe(4.5);
      expect(result.maxPrice).toBe(100);
    });
  });

  describe('weeklyScheduleSchema', () => {
    it('validates HH:mm slots', () => {
      expect(
        weeklyScheduleSchema.safeParse({
          monday: { slots: [{ start: '09:00', end: '17:00' }] },
        }).success
      ).toBe(true);
      expect(
        weeklyScheduleSchema.safeParse({
          monday: { slots: [{ start: '9am', end: '17:00' }] },
        }).success
      ).toBe(false);
      expect(weeklyScheduleSchema.safeParse({ monday: { slots: [] } }).success).toBe(false);
    });
  });

  describe('registerConsultantSchema', () => {
    it('requires bio length, rate, verticals and service types', () => {
      const base = {
        title: 'Expert',
        professionalBio: 'x'.repeat(50),
        yearsOfExperience: 5,
        languagesSpoken: ['en'],
        specializations: ['tax'],
        verticalIds: [VALID_UUID],
        serviceTypes: ['video'],
        pricingModel: 'per_hour',
        baseRate: 50,
        weeklySchedule: { monday: { slots: [{ start: '09:00', end: '17:00' }] } },
      };
      expect(registerConsultantSchema.safeParse(base).success).toBe(true);
      expect(registerConsultantSchema.safeParse({ ...base, professionalBio: 'too short' }).success).toBe(false);
      expect(registerConsultantSchema.safeParse({ ...base, baseRate: 0 }).success).toBe(false);
      expect(registerConsultantSchema.safeParse({ ...base, verticalIds: [] }).success).toBe(false);
    });
  });

  describe('validateUUID', () => {
    it('validates uuid strings', () => {
      expect(validateUUID(VALID_UUID)).toBe(true);
      expect(validateUUID('123')).toBe(false);
    });
  });
});
