// =====================================================
// DOMAIN TYPES - Online Consultancy Platform
// Based on architecture/domain-models.md
// =====================================================

// ===== ENUMS =====

export enum UserRole {
  SEEKER = 'seeker',
  CONSULTANT = 'consultant',
  ADMIN = 'admin',
  ENTERPRISE = 'enterprise',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
  PENDING = 'pending',
}

export enum VerificationLevel {
  NONE = 'none',
  BASIC = 'basic',
  VERIFIED = 'verified',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum ConsultantStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled',
}

export enum SessionStatus {
  INITIALIZING = 'initializing',
  WAITING = 'waiting',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
  FAILED = 'failed',
}

export enum SessionType {
  VIDEO = 'video',
  AUDIO = 'audio',
  CHAT = 'chat',
  IN_PERSON = 'in_person',
}

export enum PricingModel {
  PER_MINUTE = 'per_minute',
  PER_HOUR = 'per_hour',
  PER_SESSION = 'per_session',
  PACKAGE = 'package',
  SUBSCRIPTION = 'subscription',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIAL_REFUND = 'partial_refund',
  CANCELLED = 'cancelled',
}

export enum PaymentType {
  SESSION = 'session',
  SUBSCRIPTION = 'subscription',
  CONTENT = 'content',
  PACKAGE = 'package',
  REFUND = 'refund',
  PAYOUT = 'payout',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
  PENDING = 'pending',
}

export enum ReviewType {
  CONSULTANT = 'consultant',
  CONTENT = 'content',
  SESSION = 'session',
}

export enum SlotStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
}

export enum ContentType {
  VIDEO_CLASS = 'video_class',
  AUDIO_CLASS = 'audio_class',
  ARTICLE = 'article',
  DOCUMENT = 'document',
  LIVE_SESSION = 'live_session',
}

export enum ContentStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export enum TranscriptionStatus {
  NONE = 'none',
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum UrgencyLevel {
  NORMAL = 'normal',
  URGENT = 'urgent',
  EMERGENCY = 'emergency',
}

// ===== BASE TYPES =====

export interface UUID {
  id: string;
}

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDelete extends Timestamps {
  deletedAt?: Date;
}

// ===== USER ENTITY =====

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  whatsapp: boolean;
  marketingEmails: boolean;
  sessionReminders: boolean;
  bookingConfirmations: boolean;
  paymentNotifications: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'contacts';
  showOnlineStatus: boolean;
  allowReviews: boolean;
  dataSharing: boolean;
  analyticsOptOut: boolean;
}

export interface CommunicationPreferences {
  preferredChannel: 'email' | 'sms' | 'whatsapp' | 'push';
  language: string;
  timezone: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface User extends UUID, Timestamps, SoftDelete {
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  verified: boolean;
  verificationLevel: VerificationLevel;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'email' | 'sms' | 'app';

  // Profile
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  dateOfBirth?: Date;
  gender?: string;
  timezone: string;
  language: string;
  currencyPreference: string;
  region?: string;

  // Settings
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
  communicationPrefs: CommunicationPreferences;

  // Timestamps
  lastLogin?: Date;
  lastLoginAt?: Date;
}

export interface UserCreateInput {
  email: string;
  phone?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  timezone?: string;
  language?: string;
}

export interface UserUpdateInput {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  notificationSettings?: Partial<NotificationSettings>;
  privacySettings?: Partial<PrivacySettings>;
}

// ===== CONSULTANT ENTITY =====

export interface Education {
  institution: string;
  degree: string;
  field: string;
  year: number;
  verified: boolean;
}

export interface Certification {
  name: string;
  issuer: string;
  year: number;
  expiresAt?: Date;
  verified: boolean;
  documentUrl?: string;
}

export interface WeeklySchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  slots: TimeSlot[];
  breaks?: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;
}

export interface CancellationPolicy {
  freeCancellationHours: number;
  partialRefundHours: number;
  noRefundHours: number;
}

export interface AICopilotConfig {
  enabled: boolean;
  suggestionsEnabled: boolean;
  transcriptionEnabled: boolean;
  summaryEnabled: boolean;
  realTimeInsights: boolean;
  customPrompts?: string[];
}

export interface Consultant extends UUID, Timestamps {
  userId: string;
  user: User;
  status: ConsultantStatus;
  verificationStatus: VerificationLevel;
  verificationDocuments: Record<string, string>;

  // Professional Info
  title?: string;
  professionalBio?: string;
  yearsOfExperience: number;
  education: Education[];
  certifications: Certification[];
  languagesSpoken: string[];
  specializations: string[];

  // Service Config
  serviceTypes: SessionType[];
  pricingModel: PricingModel;
  baseRate?: number;
  currency: string;
  sessionDurationOptions: number[];
  maxConcurrentSessions: number;
  bufferTime: number; // minutes

  // Availability
  availabilityType: 'fixed' | 'flexible' | 'instant';
  weeklySchedule: WeeklySchedule;
  blackoutDates: Date[];
  instantBookingEnabled: boolean;
  advanceBookingLimit: number; // days
  cancellationPolicy: CancellationPolicy;

  // Metrics
  totalSessions: number;
  totalHours: number;
  averageRating: number;
  totalReviews: number;
  repeatClientRate: number;
  responseTimeAvg: number; // minutes
  completionRate: number;
  earningsTotal: number;
  earningsThisMonth: number;

  // AI Config
  aiCopilotEnabled: boolean;
  aiCopilotConfig: AICopilotConfig;
  customPrompts: Record<string, string>;
  knowledgeBaseEnabled: boolean;

  // Timestamps
  approvedAt?: Date;
  approvedBy?: string;
}

export interface ConsultantCreateInput {
  title: string;
  professionalBio: string;
  yearsOfExperience: number;
  education?: Education[];
  certifications?: Certification[];
  languagesSpoken: string[];
  specializations: string[];
  verticalIds: string[];
  serviceTypes: SessionType[];
  pricingModel: PricingModel;
  baseRate: number;
  weeklySchedule: WeeklySchedule;
}

// ===== VERTICAL ENTITY =====

export interface Vertical extends UUID, Timestamps {
  code: string;
  name: string;
  nameTranslations: Record<string, string>;
  description?: string;
  descriptionTranslations: Record<string, string>;
  parentId?: string;
  level: number;
  iconUrl?: string;
  bannerUrl?: string;
  colorCode?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;

  // Configuration
  requiresVerification: boolean;
  verificationLevelReq: VerificationLevel;
  minExperienceYears: number;
  requiredCertifications: string[];
  sessionTypesAllowed: SessionType[];
  pricingModelsAllowed: PricingModel[];
  defaultPricing: Record<string, number>;
  complianceRequirements: Record<string, boolean>;

  // AI Config
  aiMatchingConfig: Record<string, unknown>;
  domainKnowledgeBase: boolean;
  aiPromptTemplates: Record<string, string>;
  specializedEntities: string[];

  // Metrics
  totalConsultants: number;
  activeConsultants: number;
  totalSessions: number;
  totalRevenue: number;
  avgRating: number;
  popularityScore: number;
}

// ===== CONSULTANT VERTICALS =====

export interface ConsultantVertical extends UUID, Timestamps {
  consultantId: string;
  verticalId: string;
  expertiseLevel: 'beginner' | 'intermediate' | 'expert' | 'master';
  yearsInVertical: number;
  isPrimary: boolean;
}

// ===== BOOKING ENTITY =====

export interface Booking extends UUID, Timestamps {
  seekerId: string;
  seeker: User;
  consultantId: string;
  consultant: Consultant;
  verticalId: string;
  vertical: Vertical;
  slotId?: string;
  status: BookingStatus;

  // Schedule
  scheduledStart: Date;
  scheduledEnd: Date;
  timezone: string;
  durationMinutes: number;
  sessionType: SessionType;
  locationType: 'online' | 'in_person';
  locationAddress?: string;

  // Pricing
  pricingModel: PricingModel;
  baseAmount: number;
  durationCharge?: number;
  platformFee: number;
  consultantEarnings: number;
  currency: string;
  discountApplied: number;
  discountCode?: string;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;

  // Context
  topic?: string;
  description?: string;
  urgencyLevel: UrgencyLevel;
  notes?: string;
  attachments: Attachment[];
  firstTimeClient: boolean;
  recurringBookingId?: string;

  // AI
  aiMatchScore?: number;
  aiMatchReason?: string;
  aiSuggestedQuestions: string[];
  aiSessionSummary?: string;
  aiInsights: Record<string, unknown>;

  // Reminders
  reminderSent: boolean;
  reminder24hSent: boolean;
  reminder1hSent: boolean;
  reminder15mSent: boolean;

  // Timestamps
  confirmedAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  cancelledBy?: string;
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface BookingCreateInput {
  consultantId: string;
  verticalId: string;
  scheduledStart: Date;
  durationMinutes: number;
  sessionType: SessionType;
  topic?: string;
  description?: string;
  urgencyLevel?: UrgencyLevel;
  discountCode?: string;
}

// ===== SESSION ENTITY =====

export interface SessionParticipant {
  userId: string;
  userType: 'consultant' | 'seeker';
  joinedAt?: Date;
  leftAt?: Date;
}

export interface SessionQuality {
  videoQualityAvg?: string;
  audioQualityAvg?: number;
  connectionStability?: number;
  packetLossAvg?: number;
  latencyAvg?: number;
  jitterAvg?: number;
}

export interface SentimentAnalysis {
  overall: number;
  timeline: SentimentPoint[];
  categories: Record<string, number>;
}

export interface SentimentPoint {
  timestamp: Date;
  score: number;
  category: string;
}

export interface Session extends UUID, Timestamps {
  bookingId: string;
  booking: Booking;
  status: SessionStatus;
  sessionType: SessionType;

  // Participants
  consultantId: string;
  seekerId: string;
  consultantJoinedAt?: Date;
  seekerJoinedAt?: Date;
  consultantLeftAt?: Date;
  seekerLeftAt?: Date;

  // WebRTC
  roomId: string;
  serverRegion?: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  chatEnabled: boolean;
  screenShareEnabled: boolean;
  recordingEnabled: boolean;
  recordingUrl?: string;
  recordingDuration: number;

  // Quality
  quality: SessionQuality;

  // AI Processing
  transcriptionStatus: TranscriptionStatus;
  transcriptionUrl?: string;
  translationEnabled: boolean;
  translationLanguages: string[];
  aiCopilotActive: boolean;
  aiSuggestionsCount: number;
  aiInsightsGenerated: boolean;
  sentimentAnalysis: SentimentAnalysis;

  // Billing
  billingModel?: PricingModel;
  billingStart?: Date;
  billingEnd?: Date;
  billableDuration: number;
  billedAmount?: number;
  currency?: string;

  // Post-session
  followUpRequired: boolean;
  followUpScheduled: boolean;
  notesShared: boolean;
  resourcesShared: string[];

  // Duration
  startedAt?: Date;
  endedAt?: Date;
  actualDuration: number;
}

// ===== PAYMENT ENTITY =====

export interface Payment extends UUID, Timestamps {
  userId: string;
  user: User;
  paymentType: PaymentType;
  referenceId: string;
  status: PaymentStatus;

  // Amount
  amount: number;
  currency: string;
  platformFee?: number;
  taxAmount?: number;
  discountAmount?: number;
  finalAmount: number;
  exchangeRate?: number;

  // Payment Method
  paymentMethod?: string;
  paymentProvider?: 'stripe' | 'paypal' | 'bank';
  providerTransactionId?: string;
  cardLastFour?: string;
  cardBrand?: string;

  // Receiver
  receiverId?: string;
  receiverAmount?: number;
  payoutStatus?: PaymentStatus;
  payoutId?: string;

  // Refund
  refundAmount?: number;
  refundReason?: string;
  refundType?: 'full' | 'partial';
  refundProviderId?: string;

  // Fraud
  fraudScore?: number;
  fraudChecks: Record<string, boolean>;
  verifiedBy3ds: boolean;
  riskLevel: 'low' | 'medium' | 'high';

  // Timestamps
  completedAt?: Date;
  failedAt?: Date;
  refundedAt?: Date;
}

// ===== SUBSCRIPTION ENTITY =====

export interface SubscriptionPlan extends UUID, Timestamps {
  name: string;
  code: string;
  description: string;
  type: 'seeker' | 'consultant' | 'enterprise';
  tier: 'basic' | 'pro' | 'enterprise';

  // Pricing
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';

  // Limits
  sessionsLimit: number; // -1 for unlimited
  minutesLimit: number; // -1 for unlimited
  contentLimit: number; // -1 for unlimited

  // Features
  features: Record<string, boolean>;
  discountPercentage: number;
  prioritySupport: boolean;
  aiFeaturesEnabled: boolean;

  // Status
  isActive: boolean;
  isFeatured: boolean;
}

export interface Subscription extends UUID, Timestamps {
  userId: string;
  user: User;
  planId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  subscriptionType: 'seeker' | 'consultant' | 'enterprise';

  // Billing
  price: number;
  currency: string;
  billingCycle: string;
  nextBillingDate?: Date;
  lastBillingDate?: Date;
  autoRenew: boolean;

  // Usage
  sessionsUsed: number;
  sessionsLimit: number;
  minutesUsed: number;
  minutesLimit: number;
  contentAccessed: number;
  contentLimit: number;

  // Features
  featuresEnabled: Record<string, boolean>;
  discountPercentage: number;
  prioritySupport: boolean;
  aiFeaturesEnabled: boolean;

  // Dates
  startDate: Date;
  endDate: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

// ===== REVIEW ENTITY =====

export interface DetailedRatings {
  communication?: number;
  expertise?: number;
  value?: number;
  punctuality?: number;
  professionalism?: number;
}

export interface Review extends UUID, Timestamps {
  reviewerId: string;
  reviewer: User;
  reviewType: ReviewType;
  referenceId: string;
  bookingId?: string;
  rating: number; // 1-5
  title?: string;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';

  // Detailed Ratings
  detailedRatings?: DetailedRatings;

  // AI Analysis
  aiSentiment?: 'positive' | 'neutral' | 'negative';
  aiSentimentScore?: number;
  aiKeywords: string[];
  aiCategories: string[];
  aiFakeDetectionScore?: number;

  // Response
  hasResponse: boolean;
  responseText?: string;
  responseAt?: Date;
  responderId?: string;
}

// ===== SLOT ENTITY =====

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate?: Date;
}

export interface Slot extends UUID, Timestamps {
  consultantId: string;
  consultant: Consultant;
  startTime: Date;
  endTime: Date;
  timezone: string;
  durationMinutes: number;
  status: SlotStatus;
  bookingId?: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
}

// ===== CONTENT ENTITY =====

export interface ContentChapter {
  title: string;
  startTime: number; // seconds
  endTime: number;
  summary?: string;
}

export interface ContentPricing {
  model: 'free' | 'paid' | 'subscription';
  price?: number;
  currency?: string;
}

export interface Content extends UUID, Timestamps {
  creatorId: string;
  creator: Consultant;
  contentType: ContentType;
  status: ContentStatus;

  // Info
  title: string;
  description: string;
  descriptionTranslations: Record<string, string>;
  verticalId: string;
  vertical: Vertical;

  // Media
  fileUrl: string;
  thumbnailUrl?: string;
  durationMinutes?: number;
  fileSize: number;

  // Pricing
  pricing: ContentPricing;

  // Metrics
  averageRating: number;
  totalReviews: number;
  totalViews: number;
  totalPurchases: number;
  totalRevenue: number;

  // Processing
  chapters: ContentChapter[];
  transcriptUrl?: string;
  aiSummary?: string;
  aiKeywords: string[];
  aiConcepts: string[];

  // Access
  accessLevel: 'public' | 'subscribers' | 'purchased';
}

// ===== MESSAGE ENTITY =====

export interface MessageContent {
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  mediaSize?: number;
  attachments?: Attachment[];
}

export interface MessageReaction {
  reaction: string;
  userId: string;
  timestamp: Date;
}

export interface MessageReadStatus {
  userId: string;
  readAt: Date;
}

export interface MessageAIProcessing {
  intent?: string;
  entities?: Record<string, unknown>;
  sentiment?: number;
  suggestedResponse?: string;
  translation?: Record<string, string>;
  embedding?: number[];
}

export interface Message extends UUID, Timestamps {
  conversationId: string;
  sessionId?: string;
  senderId: string;
  receiverId: string;
  messageType: 'text' | 'image' | 'file' | 'audio' | 'video' | 'system' | 'ai_suggestion';
  status: 'sent' | 'delivered' | 'read' | 'failed';

  // Content
  content: MessageContent;

  // AI Processing
  aiProcessing?: MessageAIProcessing;

  // Metadata
  channel: 'platform' | 'whatsapp' | 'sms';
  externalMessageId?: string;
  threadId?: string;
  replyToId?: string;

  // Reactions & Read
  reactions: MessageReaction[];
  readBy: MessageReadStatus[];

  // Timestamps
  readAt?: Date;
  editedAt?: Date;
  deletedAt?: Date;
}

// ===== API TYPES =====

export interface PaginationInput {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SortInput {
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchFilters {
  vertical?: string;
  language?: string;
  minRating?: number;
  maxPrice?: number;
  availability?: boolean;
  status?: string;
}

// ===== EVENT TYPES =====

export type UserEvent =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.logged_in'
  | 'user.logged_out'
  | 'user.email_verified'
  | 'user.phone_verified';

export type ConsultantEvent =
  | 'consultant.created'
  | 'consultant.updated'
  | 'consultant.verified'
  | 'consultant.suspended'
  | 'consultant.availability_updated'
  | 'consultant.rating_updated';

export type BookingEvent =
  | 'booking.created'
  | 'booking.confirmed'
  | 'booking.cancelled'
  | 'booking.rescheduled'
  | 'booking.reminder_sent';

export type SessionEvent =
  | 'session.created'
  | 'session.started'
  | 'session.ended'
  | 'message.sent'
  | 'message.delivered'
  | 'message.read'
  | 'transcription.completed'
  | 'translation.completed';

export type PaymentEvent =
  | 'payment.created'
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.refunded'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.expired'
  | 'payout.processed';

export type AIEvent =
  | 'ai.matching_completed'
  | 'ai.summary_generated'
  | 'ai.insight_generated'
  | 'ai.suggestion_provided';

export type NotificationEvent =
  | 'notification.sent'
  | 'notification.delivered'
  | 'notification.failed';

export type MemoryEvent =
  | 'memory.stored'
  | 'memory.retrieved'
  | 'memory.consolidated'
  | 'memory.forgotten';

export type PlatformEvent =
  | UserEvent
  | ConsultantEvent
  | BookingEvent
  | SessionEvent
  | PaymentEvent
  | AIEvent
  | NotificationEvent
  | MemoryEvent;

export interface EventPayload<T = unknown> {
  eventType: PlatformEvent;
  timestamp: Date;
  source: string;
  data: T;
  metadata?: Record<string, unknown>;
}

// ===== JWT TYPES =====

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ===== HEALTH CHECK =====

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  version: string;
  uptime: number;
  checks: {
    database: boolean;
    redis?: boolean;
    kafka?: boolean;
    memory?: boolean;
  };
}