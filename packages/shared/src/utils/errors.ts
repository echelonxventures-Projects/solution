import { ZodError } from 'zod';

export enum ErrorCode {
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_FIELD = 'MISSING_FIELD',

  // Not Found
  NOT_FOUND = 'NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  CONSULTANT_NOT_FOUND = 'CONSULTANT_NOT_FOUND',
  BOOKING_NOT_FOUND = 'BOOKING_NOT_FOUND',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',

  // Conflicts
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  EMAIL_EXISTS = 'EMAIL_EXISTS',
  SLOT_NOT_AVAILABLE = 'SLOT_NOT_AVAILABLE',
  BOOKING_CONFLICT = 'BOOKING_CONFLICT',

  // Business Logic
  CANNOT_CANCEL = 'CANNOT_CANCEL',
  CANNOT_REFUND = 'CANNOT_REFUND',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  SUBSCRIPTION_LIMIT = 'SUBSCRIPTION_LIMIT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  // External Services
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Internal
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  KAFKA_ERROR = 'KAFKA_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
}

export interface ErrorDetail {
  field?: string;
  message?: string;
  code?: string;
  value?: unknown;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: ErrorDetail[];
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 400,
    details?: ErrorDetail[],
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(): Record<string, unknown> {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

// Specific Error Classes

export class ValidationError extends AppError {
  constructor(message: string, details?: ErrorDetail[]) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }

  static fromZodError(zodError: ZodError): ValidationError {
    const details = zodError.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
    return new ValidationError('Validation failed', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(ErrorCode.UNAUTHORIZED, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(ErrorCode.PERMISSION_DENIED, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      ErrorCode.NOT_FOUND,
      id ? `${resource} with id ${id} not found` : `${resource} not found`,
      404
    );
  }
}

export class ConflictError extends AppError {
  constructor(code: ErrorCode, message: string, details?: ErrorDetail[]) {
    super(code, message, 409, details);
  }
}

export class BusinessError extends AppError {
  constructor(code: ErrorCode, message: string, details?: ErrorDetail[]) {
    super(code, message, 400, details);
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: ErrorDetail[]) {
    super(ErrorCode.PAYMENT_FAILED, message, 402, details);
  }
}

export class RateLimitError extends AppError {
  constructor(limit: number) {
    super(ErrorCode.RATE_LIMITED, `Rate limit exceeded: ${limit} requests`, 429);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(ErrorCode.INTERNAL_ERROR, message, 500, undefined, false);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(ErrorCode.SERVICE_UNAVAILABLE, `Service ${service} unavailable`, 503);
  }
}

// Error Handler Helper

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return ValidationError.fromZodError(error);
  }

  if (error instanceof Error) {
    return new InternalError(error.message);
  }

  return new InternalError('Unknown error occurred');
}

export default AppError;