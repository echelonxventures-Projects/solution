import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  role: z.enum(['seeker', 'consultant']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const bookingSchema = z.object({
  consultantId: z.string().uuid(),
  scheduledStart: z.string().datetime(),
  durationMinutes: z.number().min(15).max(480),
  notes: z.string().optional(),
})

export const consultantProfileSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  bio: z.string().min(50, 'Bio must be at least 50 characters'),
  verticals: z.array(z.string()).min(1, 'Select at least one vertical'),
  skills: z.array(z.string()).min(1, 'Add at least one skill'),
  languages: z.array(z.string()).min(1, 'Select at least one language'),
  hourlyRate: z.number().min(10, 'Rate must be at least $10'),
  currency: z.string().default('USD'),
})

export const consultantOnboardingSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  verticalId: z.string().min(1, 'Primary vertical is required'),
  subVerticalId: z.string().optional(),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  experienceYears: z.number().min(0).max(50),
  bio: z.string().min(50, 'Bio must be at least 50 characters').max(2000),
  hourlyRate: z.number().min(10, 'Minimum rate is $10/hour').max(1000, 'Maximum rate is $1000/hour'),
  languages: z.array(z.string()).min(1, 'At least one language is required'),
  availability: z.object({
    monday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
    tuesday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
    wednesday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
    thursday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
    friday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
    saturday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
    sunday: z.object({ start: z.string(), end: z.string(), available: z.boolean() }),
  }),
  credentials: z.array(z.object({
    type: z.string(),
    title: z.string(),
    institution: z.string(),
    year: z.number().optional(),
    documentUrl: z.string().optional(),
  })).optional(),
})

export const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  country: z.string().optional(),
  language: z.string().optional(),
})

export const reviewSchema = z.object({
  consultantId: z.string().uuid(),
  sessionId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Review must be at least 10 characters').optional(),
})

export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
  type: z.enum(['text', 'file', 'link']).default('text'),
})

export const searchSchema = z.object({
  query: z.string().optional(),
  verticals: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  ratingMin: z.number().min(0).max(5).optional(),
  availability: z.enum(['now', 'today', 'week']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
})

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type BookingInput = z.infer<typeof bookingSchema>
export type ConsultantProfileInput = z.infer<typeof consultantProfileSchema>
export type ConsultantOnboardingInput = z.infer<typeof consultantOnboardingSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type MessageInput = z.infer<typeof messageSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>