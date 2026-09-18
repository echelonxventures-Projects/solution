// =====================================================
// SHARED PACKAGE - Main Entry Point
// =====================================================

// Types
export * from './types';

// Database
export * from './database';

// Events
export * from './events';

// Authentication
export * from './auth';

// Utilities
export * from './utils';

// Validation
export * from './validation';

// =====================================================
// Convenience Imports
// =====================================================

// Logger
import { logger, createLogger, RequestLogger } from './utils/logger';
export { logger, createLogger, RequestLogger };

// Database
import { DatabaseClient, findOne, findAll, insert, update, deleteOne, softDelete } from './database/client';
export { DatabaseClient, findOne, findAll, insert, update, deleteOne, softDelete };

// Auth
import { generateTokens, verifyAccessToken, authenticate, requireRole, authenticateRequest } from './auth';
export { generateTokens, verifyAccessToken, authenticate, requireRole, authenticateRequest };

// Events
import { EventBus, publishUserEvent, publishBookingEvent } from './events';
export { EventBus, publishUserEvent, publishBookingEvent };

// Errors
import { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } from './utils/errors';
export { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError };