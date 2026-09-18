import { z } from 'zod';

// ===== AUTH VALIDATION =====

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.enum(['seeker', 'consultant']).default('seeker'),
  timezone: z.string().optional(),
  language: z.string().length(2).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password required'),
  deviceId: z.string().optional(),
  twoFactorCode: z.string().length(6).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
});

// ===== USER VALIDATION =====

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  timezone: z.string().optional(),
  language: z.string().length(2).optional(),
  notificationSettings: z.record(z.boolean()).optional(),
  privacySettings: z.record(z.boolean()).optional(),
});

// ===== CONSULTANT VALIDATION =====

export const timeSlotSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
});

export const dayScheduleSchema = z.object({
  slots: z.array(timeSlotSchema).min(1),
  breaks: z.array(timeSlotSchema).optional(),
});

export const weeklyScheduleSchema = z.object({
  monday: dayScheduleSchema.optional(),
  tuesday: dayScheduleSchema.optional(),
  wednesday: dayScheduleSchema.optional(),
  thursday: dayScheduleSchema.optional(),
  friday: dayScheduleSchema.optional(),
  saturday: dayScheduleSchema.optional(),
  sunday: dayScheduleSchema.optional(),
});

export const registerConsultantSchema = z.object({
  title: z.string().min(2).max(100),
  professionalBio: z.string().min(50).max(2000),
  yearsOfExperience: z.number().int().min(0).max(50),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        field: z.string(),
        year: z.number().int().min(1950).max(2030),
        verified: z.boolean().optional(),
      })
    )
    .optional(),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string(),
        year: z.number().int().min(1950).max(2030),
        verified: z.boolean().optional(),
      })
    )
    .optional(),
  languagesSpoken: z.array(z.string()).min(1),
  specializations: z.array(z.string()).min(1),
  verticalIds: z.array(z.string().uuid()).min(1),
  serviceTypes: z.array(z.enum(['video', 'audio', 'chat', 'in_person'])).min(1),
  pricingModel: z.enum(['per_minute', 'per_hour', 'per_session', 'package']),
  baseRate: z.number().positive().max(10000),
  weeklySchedule: weeklyScheduleSchema,
});

// ===== BOOKING VALIDATION =====

export const createBookingSchema = z.object({
  consultantId: z.string().uuid('Invalid consultant ID'),
  verticalId: z.string().uuid('Invalid vertical ID'),
  scheduledStart: z.string().datetime({ message: 'Invalid datetime format' }),
  durationMinutes: z.number().int().min(5).max(480),
  sessionType: z.enum(['video', 'audio', 'chat', 'in_person']),
  topic: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  urgencyLevel: z.enum(['normal', 'urgent', 'emergency']).optional(),
  discountCode: z.string().max(50).optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(1).max(500, 'Reason required'),
});

export const rescheduleBookingSchema = z.object({
  newScheduledStart: z.string().datetime({ message: 'Invalid datetime format' }),
  newDurationMinutes: z.number().int().min(5).max(480).optional(),
});

// ===== REVIEW VALIDATION =====

export const createReviewSchema = z.object({
  referenceId: z.string().uuid(),
  reviewType: z.enum(['consultant', 'content', 'session']),
  bookingId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().max(1000).optional(),
  detailedRatings: z
    .object({
      communication: z.number().min(1).max(5).optional(),
      expertise: z.number().min(1).max(5).optional(),
      value: z.number().min(1).max(5).optional(),
      punctuality: z.number().min(1).max(5).optional(),
      professionalism: z.number().min(1).max(5).optional(),
    })
    .optional(),
});

// ===== PAYMENT VALIDATION =====

export const calculatePriceSchema = z.object({
  consultantId: z.string().uuid(),
  durationMinutes: z.number().int().min(5).max(480),
  pricingModel: z.enum(['per_minute', 'per_hour', 'per_session', 'package']),
  discountCode: z.string().max(50).optional(),
  subscriptionCheck: z.boolean().optional(),
});

export const processPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  paymentMethod: z.string().min(1),
  savePaymentMethod: z.boolean().optional(),
});

// ===== SUBSCRIPTION VALIDATION =====

export const subscribeSchema = z.object({
  planId: z.string().uuid(),
  paymentMethodId: z.string().min(1),
  autoRenew: z.boolean().default(true),
});

// ===== QUERY PARAMS VALIDATION =====

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const sortSchema = z.object({
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const searchConsultantsSchema = paginationSchema
  .merge(sortSchema)
  .extend({
    vertical: z.string().optional(),
    specialization: z.string().optional(),
    language: z.string().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    maxPrice: z.coerce.number().positive().optional(),
    availability: z.coerce.boolean().optional(),
  });

// ===== UUID VALIDATION =====

export const uuidSchema = z.string().uuid('Invalid UUID format');

// Helper to validate UUID params
export function validateUUID(id: string): boolean {
  return uuidSchema.safeParse(id).success;
}

// ===== EXPORT ALL =====

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type RegisterConsultantInput = z.infer<typeof registerConsultantSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CalculatePriceInput = z.infer<typeof calculatePriceSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type SearchConsultantsInput = z.infer<typeof searchConsultantsSchema>;