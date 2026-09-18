import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  AppError,
  ErrorCode,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  BusinessError,
  PaymentError,
  RateLimitError,
  InternalError,
  ServiceUnavailableError,
  handleError,
} from './errors';

describe('errors', () => {
  describe('AppError', () => {
    it('carries code, statusCode, details and is operational by default', () => {
      const err = new AppError(ErrorCode.INTERNAL_ERROR, 'boom', 418, [{ field: 'x', message: 'bad' }]);
      expect(err.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(err.statusCode).toBe(418);
      expect(err.isOperational).toBe(true);
      expect(err.toJSON()).toEqual({
        error: { code: 'INTERNAL_ERROR', message: 'boom', details: [{ field: 'x', message: 'bad' }] },
      });
    });
  });

  describe('specialized error classes', () => {
    it('maps to the right HTTP status codes', () => {
      expect(new ValidationError('bad').statusCode).toBe(400);
      expect(new UnauthorizedError().statusCode).toBe(401);
      expect(new ForbiddenError().statusCode).toBe(403);
      expect(new NotFoundError('User', '42').statusCode).toBe(404);
      expect(new ConflictError(ErrorCode.EMAIL_EXISTS, 'dupe').statusCode).toBe(409);
      expect(new BusinessError(ErrorCode.CANNOT_CANCEL, 'nope').statusCode).toBe(400);
      expect(new PaymentError('declined').statusCode).toBe(402);
      expect(new RateLimitError(100).statusCode).toBe(429);
      expect(new InternalError().statusCode).toBe(500);
      expect(new ServiceUnavailableError('billing').statusCode).toBe(503);
    });

    it('formats messages', () => {
      expect(new NotFoundError('Booking', 'abc').message).toContain('Booking with id abc not found');
      expect(new NotFoundError('Session').message).toBe('Session not found');
      expect(new UnauthorizedError().message).toBe('Unauthorized');
      expect(new RateLimitError(50).message).toContain('50 requests');
    });

    it('marks InternalError as non-operational', () => {
      expect(new InternalError().isOperational).toBe(false);
    });
  });

  describe('ValidationError.fromZodError', () => {
    it('converts zod issues into field details', () => {
      const schema = z.object({ email: z.string().email(), age: z.number().int().min(18) });
      const result = schema.safeParse({ email: 'nope', age: 10 });
      expect(result.success).toBe(false);
      const err = ValidationError.fromZodError((result as { error: z.ZodError }).error);
      expect(err.details).toHaveLength(2);
      expect(err.details?.map((d) => d.field)).toEqual(expect.arrayContaining(['email', 'age']));
      expect(err.message).toBe('Validation failed');
    });
  });

  describe('handleError', () => {
    it('passes AppError through unchanged', () => {
      const original = new ConflictError(ErrorCode.BOOKING_CONFLICT, 'clash');
      expect(handleError(original)).toBe(original);
    });

    it('wraps ZodError into ValidationError', () => {
      const zodErr = z.string().uuid().safeParse('x') as { success: false; error: z.ZodError };
      const handled = handleError(zodErr.error);
      expect(handled).toBeInstanceOf(ValidationError);
      expect(handled.statusCode).toBe(400);
    });

    it('wraps unknown Error into non-operational InternalError', () => {
      const handled = handleError(new Error('disk on fire'));
      expect(handled).toBeInstanceOf(InternalError);
      expect(handled.message).toBe('disk on fire');
      expect(handled.isOperational).toBe(false);
    });

    it('handles non-error throwables', () => {
      expect(handleError('string failure')).toBeInstanceOf(InternalError);
      expect(handleError(undefined).message).toBe('Unknown error occurred');
    });
  });
});
