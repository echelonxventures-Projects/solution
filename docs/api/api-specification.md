# API Specification - REST & GraphQL Endpoints

> **Document Version:** 1.0
> **Last Updated:** 2026-04-13
> **Owner:** Solution Architect
> **Related:** [CLAUDE.md](../CLAUDE.md) - Master Index

---

## 1. API Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API ARCHITECTURE                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        API GATEWAY                                   │   │
│   │                                                                     │   │
│   │  Base URL: https://api.consultancy-platform.com/v1                 │   │
│   │                                                                     │   │
│   │  Authentication:                                                    │   │
│   │  • Bearer Token (JWT)                                               │   │
│   │  • API Key (for partners/white-label)                              │   │
│   │                                                                     │   │
│   │  Rate Limits:                                                       │   │
│   │  • Free: 100 req/min                                                │   │
│   │  • Basic: 500 req/min                                               │   │
│   │  • Premium: 1000 req/min                                            │   │
│   │  • Enterprise: Unlimited                                            │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│   │ REST API        │ │ GraphQL API     │ │ WebSocket       │              │
│   │                 │ │                 │ │                 │              │
│   │ CRUD operations │ │ Complex queries │ │ Real-time       │              │
│   │ Simple reads    │ │ Aggregations    │ │ Chat            │              │
│   │ Mutations       │ │ Nested data     │ │ Session signaling│             │
│   └─────────────────┘ └─────────────────┘ └─────────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. REST API Endpoints

### 2.1 Authentication Endpoints

```yaml
AuthEndpoints:
  
  POST /auth/register:
    description: Register new user
    auth_required: false
    request:
      body:
        email: String (required)
        phone: String (optional)
        password: String (required)
        first_name: String (optional)
        last_name: String (optional)
        role: String (seeker, consultant) (default: seeker)
        timezone: String (optional)
        language: String (optional)
    response:
      201:
        user_id: UUID
        email: String
        status: String
        verification_required: Boolean
      400: ValidationError
      409: EmailAlreadyExists
  
  POST /auth/login:
    description: Login user
    auth_required: false
    request:
      body:
        email: String (required)
        password: String (required)
        device_id: String (optional)
        two_factor_code: String (if 2FA enabled)
    response:
      200:
        access_token: String
        refresh_token: String
        expires_in: Integer
        user: UserObject
      401: InvalidCredentials
      403: AccountSuspended
  
  POST /auth/logout:
    description: Logout user
    auth_required: true
    response:
      200: Success
      401: Unauthorized
  
  POST /auth/refresh:
    description: Refresh access token
    auth_required: false (refresh token in body)
    request:
      body:
        refresh_token: String (required)
    response:
      200:
        access_token: String
        refresh_token: String
        expires_in: Integer
      401: InvalidRefreshToken
  
  POST /auth/forgot-password:
    description: Request password reset
    auth_required: false
    request:
      body:
        email: String (required)
    response:
      200: ResetEmailSent
      404: EmailNotFound
  
  POST /auth/reset-password:
    description: Reset password with token
    auth_required: false
    request:
      body:
        token: String (required)
        new_password: String (required)
    response:
      200: PasswordReset
      400: InvalidToken
  
  POST /auth/verify-email:
    description: Verify email address
    auth_required: false
    request:
      body:
        token: String (required)
    response:
      200: EmailVerified
      400: InvalidToken
  
  POST /auth/verify-phone:
    description: Verify phone with OTP
    auth_required: true
    request:
      body:
        otp: String (required)
    response:
      200: PhoneVerified
      400: InvalidOTP
  
  POST /auth/social/:provider:
    description: Social login (google, apple, facebook)
    auth_required: false
    request:
      body:
        provider_token: String (required)
    response:
      200: Same as login
```

### 2.2 User Endpoints

```yaml
UserEndpoints:
  
  GET /users/me:
    description: Get current user profile
    auth_required: true
    response:
      200:
        id: UUID
        email: String
        phone: String
        role: String
        status: String
        first_name: String
        last_name: String
        display_name: String
        avatar_url: String
        timezone: String
        language: String
        currency_preference: String
        subscription: SubscriptionObject
        created_at: Timestamp
  
  PUT /users/me:
    description: Update current user profile
    auth_required: true
    request:
      body:
        first_name: String (optional)
        last_name: String (optional)
        display_name: String (optional)
        avatar_url: String (optional)
        timezone: String (optional)
        language: String (optional)
        notification_settings: Object (optional)
        privacy_settings: Object (optional)
    response:
      200: UpdatedUserObject
      400: ValidationError
  
  DELETE /users/me:
    description: Delete current user account
    auth_required: true
    request:
      body:
        password: String (required for verification)
        reason: String (optional)
    response:
      200: AccountDeleted
      401: Unauthorized
  
  GET /users/me/preferences:
    description: Get user preferences
    auth_required: true
    response:
      200: PreferencesObject
  
  PUT /users/me/preferences:
    description: Update user preferences
    auth_required: true
    request:
      body:
        notification_settings: Object
        privacy_settings: Object
        communication_prefs: Object
    response:
      200: UpdatedPreferences
  
  GET /users/me/bookings:
    description: Get user's bookings
    auth_required: true
    query_params:
      status: String (pending, confirmed, completed, cancelled)
      limit: Integer (default: 20)
      offset: Integer (default: 0)
    response:
      200:
        bookings: [BookingObject]
        total: Integer
        limit: Integer
        offset: Integer
```

### 2.3 Consultant Endpoints

```yaml
ConsultantEndpoints:
  
  POST /consultants:
    description: Register as consultant
    auth_required: true
    request:
      body:
        title: String (required)
        professional_bio: String (required)
        years_of_experience: Integer (required)
        education: Array (optional)
        certifications: Array (optional)
        languages_spoken: Array (required)
        specializations: Array (required)
        vertical_ids: Array (required)
        service_types: Array (required)
        pricing_model: String (required)
        base_rate: Decimal (required)
        weekly_schedule: Object (required)
    response:
      201: ConsultantObject (pending status)
      400: ValidationError
  
  GET /consultants:
    description: Search consultants
    auth_required: false (limited), true (full)
    query_params:
      vertical: String
      specialization: String
      language: String
      min_rating: Decimal
      max_price: Decimal
      availability: Boolean
      sort: String (rating, price, popularity)
      limit: Integer (default: 20)
      offset: Integer (default: 0)
    response:
      200:
        consultants: [ConsultantObject]
        total: Integer
        facets: FacetObject
  
  GET /consultants/:id:
    description: Get consultant details
    auth_required: false
    response:
      200: ConsultantObject
      404: NotFound
  
  PUT /consultants/:id:
    description: Update consultant profile
    auth_required: true (owner only)
    request:
      body: Same as POST
    response:
      200: UpdatedConsultant
  
  GET /consultants/:id/availability:
    description: Get consultant availability
    auth_required: false
    query_params:
      date: Date (required)
      duration_minutes: Integer (optional)
    response:
      200:
        slots: [SlotObject]
        timezone: String
  
  PUT /consultants/:id/availability:
    description: Update consultant availability
    auth_required: true (owner only)
    request:
      body:
        weekly_schedule: Object
        blackout_dates: Array
        instant_booking_enabled: Boolean
    response:
      200: UpdatedAvailability
  
  GET /consultants/:id/reviews:
    description: Get consultant reviews
    auth_required: false
    query_params:
      limit: Integer
      offset: Integer
      sort: String (recent, helpful)
    response:
      200:
        reviews: [ReviewObject]
        average_rating: Decimal
        total_reviews: Integer
  
  GET /consultants/:id/metrics:
    description: Get consultant performance metrics
    auth_required: true (owner only)
    response:
      200: MetricsObject
```

### 2.4 Booking Endpoints

```yaml
BookingEndpoints:
  
  POST /bookings:
    description: Create booking
    auth_required: true
    request:
      body:
        consultant_id: UUID (required)
        vertical_id: UUID (required)
        scheduled_start: Timestamp (required)
        duration_minutes: Integer (required)
        session_type: String (required)
        topic: String (optional)
        description: String (optional)
        urgency_level: String (optional)
        discount_code: String (optional)
    response:
      201:
        booking: BookingObject
        payment_required: Boolean
        amount: Decimal
        currency: String
      400: ValidationError
      409: SlotNotAvailable
  
  GET /bookings/:id:
    description: Get booking details
    auth_required: true (seeker or consultant)
    response:
      200: BookingObject
      404: NotFound
      403: Unauthorized
  
  PUT /bookings/:id/cancel:
    description: Cancel booking
    auth_required: true (seeker or consultant)
    request:
      body:
        reason: String (required)
    response:
      200: CancelledBooking
      400: CannotCancel
  
  PUT /bookings/:id/reschedule:
    description: Reschedule booking
    auth_required: true (seeker only)
    request:
      body:
        new_scheduled_start: Timestamp (required)
        new_duration_minutes: Integer (optional)
    response:
      200: RescheduledBooking
      400: NewSlotNotAvailable
  
  GET /bookings/user/:userId:
    description: Get user's bookings
    auth_required: true
    response:
      200: BookingList
```

### 2.5 Session Endpoints

```yaml
SessionEndpoints:
  
  POST /sessions/create:
    description: Create session room
    auth_required: true
    request:
      body:
        booking_id: UUID (required)
    response:
      200:
        session_id: UUID
        room_id: String
        webrtc_config: Object
        join_url: String
  
  POST /sessions/:id/start:
    description: Start session
    auth_required: true
    response:
      200: SessionStarted
  
  POST /sessions/:id/join:
    description: Join session
    auth_required: true
    response:
      200:
        session_state: Object
        participants: Array
  
  POST /sessions/:id/end:
    description: End session
    auth_required: true
    request:
      body:
        notes: String (optional)
        follow_up_required: Boolean (optional)
    response:
      200:
        duration: Integer
        billed_amount: Decimal
        recording_url: String (if recorded)
  
  GET /sessions/:id:
    description: Get session details
    auth_required: true
    response:
      200: SessionObject
  
  POST /sessions/:id/chat:
    description: Send chat message during session
    auth_required: true
    request:
      body:
        text: String (required)
        attachments: Array (optional)
    response:
      200: MessageObject
  
  GET /sessions/:id/transcript:
    description: Get session transcript
    auth_required: true
    response:
      200: TranscriptObject
  
  GET /sessions/:id/recording:
    description: Get recording URL
    auth_required: true
    response:
      200:
        recording_url: String
        duration: Integer
```

### 2.6 Payment Endpoints

```yaml
PaymentEndpoints:
  
  POST /payments/calculate:
    description: Calculate payment amount
    auth_required: true
    request:
      body:
        consultant_id: UUID
        duration_minutes: Integer
        pricing_model: String
        discount_code: String (optional)
        subscription_check: Boolean (optional)
    response:
      200:
        base_amount: Decimal
        discount_amount: Decimal
        tax_amount: Decimal
        platform_fee: Decimal
        total_amount: Decimal
        currency: String
  
  POST /payments/charge:
    description: Process payment
    auth_required: true
    request:
      body:
        booking_id: UUID
        amount: Decimal
        currency: String
        payment_method: String
        save_payment_method: Boolean (optional)
    response:
      200:
        payment_id: UUID
        status: String
        provider_transaction_id: String
      400: PaymentFailed
      402: InsufficientFunds
  
  GET /payments/:id:
    description: Get payment details
    auth_required: true
    response:
      200: PaymentObject
  
  GET /payments/invoices/:id:
    description: Get invoice
    auth_required: true
    response:
      200:
        invoice: InvoiceObject
        download_url: String
  
  POST /payments/refund:
    description: Request refund
    auth_required: true
    request:
      body:
        payment_id: UUID
        reason: String
        amount: Decimal (optional, for partial)
    response:
      200: RefundInitiated
      400: CannotRefund
```

### 2.7 Subscription Endpoints

```yaml
SubscriptionEndpoints:
  
  GET /subscriptions/plans:
    description: Get available subscription plans
    auth_required: false
    response:
      200:
        plans: [PlanObject]
  
  POST /subscriptions:
    description: Subscribe to plan
    auth_required: true
    request:
      body:
        plan_id: UUID
        payment_method_id: String
        auto_renew: Boolean
    response:
      200: SubscriptionObject
  
  GET /subscriptions/me:
    description: Get current subscription
    auth_required: true
    response:
      200: SubscriptionObject
  
  PUT /subscriptions/:id/cancel:
    description: Cancel subscription
    auth_required: true
    request:
      body:
        reason: String (optional)
    response:
      200: CancelledSubscription
  
  PUT /subscriptions/:id/upgrade:
    description: Upgrade subscription
    auth_required: true
    request:
      body:
        new_plan_id: UUID
    response:
      200: UpdatedSubscription
```

### 2.8 Content Endpoints

```yaml
ContentEndpoints:
  
  GET /content:
    description: Search content
    auth_required: false (free), true (paid)
    query_params:
      vertical: String
      type: String (video_class, audio_class, article)
      difficulty: String
      language: String
      sort: String
      limit: Integer
    response:
      200:
        content: [ContentObject]
        total: Integer
  
  GET /content/:id:
    description: Get content details
    auth_required: depends on pricing
    response:
      200: ContentObject
  
  GET /content/stream/:id:
    description: Stream content
    auth_required: true (if paid)
    response:
      200: StreamURL
  
  POST /content/purchase/:id:
    description: Purchase content
    auth_required: true
    request:
      body:
        payment_method_id: String
    response:
      200: PurchaseCompleted
  
  POST /content/upload:
    description: Upload content (consultant only)
    auth_required: true (consultant)
    request:
      body:
        title: String
        description: String
        vertical_id: UUID
        type: String
        pricing_model: String
        price: Decimal
        file: FileUpload
    response:
      201: ContentObject
```

### 2.9 Review Endpoints

```yaml
ReviewEndpoints:
  
  POST /reviews:
    description: Create review
    auth_required: true
    request:
      body:
        reference_id: UUID (consultant_id or content_id)
        review_type: String
        booking_id: UUID (if consultant review)
        rating: Integer (1-5)
        title: String
        comment: String
        detailed_ratings: Object (optional)
    response:
      201: ReviewObject
  
  GET /reviews:
    description: Get reviews
    auth_required: false
    query_params:
      reference_id: UUID
      review_type: String
      limit: Integer
    response:
      200: ReviewList
  
  PUT /reviews/:id:
    description: Update review
    auth_required: true (owner)
    request:
      body:
        rating: Integer
        comment: String
    response:
      200: UpdatedReview
```

### 2.10 AI Endpoints

```yaml
AIEndpoints:
  
  POST /ai/match:
    description: Get AI-powered consultant recommendations
    auth_required: true
    request:
      body:
        query: String
        vertical: String (optional)
        preferences: Object (optional)
        limit: Integer (default: 10)
    response:
      200:
        matches: [
          {
            consultant: ConsultantObject,
            match_score: Decimal,
            match_reasons: Array
          }
        ]
  
  POST /ai/chat:
    description: Chat with AI assistant
    auth_required: true
    request:
      body:
        message: String
        context: Object (optional)
    response:
      200:
        response: String
        suggested_actions: Array
        consultant_recommendations: Array
  
  POST /ai/translate:
    description: Translate text
    auth_required: true
    request:
      body:
        text: String
        source_language: String (auto-detect if empty)
        target_language: String
    response:
      200:
        translated_text: String
        source_language: String
  
  POST /ai/sentiment:
    description: Analyze sentiment
    auth_required: true
    request:
      body:
        text: String
    response:
      200:
        sentiment_score: Decimal
        sentiment_label: String
        emotional_categories: Array
```

---

## 3. GraphQL Schema

```graphql
# Schema Definition

type User {
  id: ID!
  email: String!
  phone: String
  role: UserRole!
  status: UserStatus!
  firstName: String
  lastName: String
  displayName: String
  avatarUrl: String
  timezone: String
  language: String
  subscription: Subscription
  bookings(limit: Int, offset: Int): BookingConnection!
  reviews(limit: Int, offset: Int): ReviewConnection!
  createdAt: DateTime!
}

type Consultant {
  id: ID!
  user: User!
  status: ConsultantStatus!
  verificationStatus: VerificationLevel!
  title: String
  professionalBio: String
  yearsOfExperience: Int
  specializations: [String!]!
  languagesSpoken: [String!]!
  verticals: [Vertical!]!
  serviceTypes: [ServiceType!]!
  pricingModel: PricingModel!
  baseRate: Float
  currency: String
  availability(date: Date!, durationMinutes: Int): [Slot!]!
  averageRating: Float
  totalReviews: Int
  totalSessions: Int
  reviews(limit: Int, offset: Int, sort: ReviewSort): ReviewConnection!
  metrics: ConsultantMetrics
}

type Vertical {
  id: ID!
  code: String!
  name: String!
  description: String
  parent: Vertical
  children: [Vertical!]!
  consultants(limit: Int, offset: Int): ConsultantConnection!
  totalConsultants: Int
}

type Booking {
  id: ID!
  seeker: User!
  consultant: Consultant!
  vertical: Vertical!
  status: BookingStatus!
  scheduledStart: DateTime!
  scheduledEnd: DateTime!
  timezone: String!
  durationMinutes: Int!
  sessionType: ServiceType!
  topic: String
  description: String
  totalAmount: Float
  currency: String!
  paymentStatus: PaymentStatus!
  session: Session
  review: Review
  createdAt: DateTime!
}

type Session {
  id: ID!
  booking: Booking!
  status: SessionStatus!
  roomId: String!
  videoEnabled: Boolean!
  audioEnabled: Boolean!
  recordingEnabled: Boolean!
  recordingUrl: String
  actualDuration: Int!
  transcript: Transcript
  participants: [SessionParticipant!]!
  messages(limit: Int, offset: Int): MessageConnection!
}

type Payment {
  id: ID!
  user: User!
  paymentType: PaymentType!
  referenceId: ID!
  status: PaymentStatus!
  amount: Float!
  currency: String!
  createdAt: DateTime!
}

type Subscription {
  id: ID!
  user: User!
  plan: SubscriptionPlan!
  status: SubscriptionStatus!
  startDate: DateTime!
  endDate: DateTime!
  sessionsUsed: Int!
  sessionsLimit: Int!
  discountPercentage: Float!
}

type Content {
  id: ID!
  creator: Consultant!
  contentType: ContentType!
  title: String!
  description: String!
  vertical: Vertical!
  durationMinutes: Int
  thumbnailUrl: String
  price: Float
  currency: String
  averageRating: Float
  totalViews: Int
  chapters: [ContentChapter!]!
}

type Review {
  id: ID!
  reviewer: User!
  reviewType: ReviewType!
  referenceId: ID!
  rating: Int!
  title: String
  comment: String
  detailedRatings: DetailedRatings
  createdAt: DateTime!
}

# Connections for pagination
type BookingConnection {
  edges: [BookingEdge!]!
  pageInfo: PageInfo!
  total: Int!
}

type ConsultantConnection {
  edges: [ConsultantEdge!]!
  pageInfo: PageInfo!
  total: Int!
}

type BookingEdge {
  node: Booking!
  cursor: String!
}

type ConsultantEdge {
  node: Consultant!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

# Enums
enum UserRole {
  SEEKER
  CONSULTANT
  ADMIN
  ENTERPRISE
}

enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  EXPIRED
  NO_SHOW
}

enum ServiceType {
  VIDEO
  AUDIO
  CHAT
  IN_PERSON
}

enum PricingModel {
  PER_MINUTE
  PER_HOUR
  PER_SESSION
  PACKAGE
}

# Queries
type Query {
  me: User
  user(id: ID!): User
  consultant(id: ID!): Consultant
  consultants(
    vertical: String
    language: String
    minRating: Float
    maxPrice: Float
    limit: Int
    offset: Int
    sort: ConsultantSort
  ): ConsultantConnection!
  
  vertical(id: ID!): Vertical
  verticals(parentId: ID, limit: Int, offset: Int): [Vertical!]!
  
  booking(id: ID!): Booking
  bookings(
    userId: ID
    consultantId: ID
    status: BookingStatus
    limit: Int
    offset: Int
  ): BookingConnection!
  
  content(id: ID!): Content
  contents(
    vertical: String
    type: ContentType
    limit: Int
    offset: Int
  ): ContentConnection!
  
  subscriptionPlans: [SubscriptionPlan!]!
  
  # AI-powered search
  aiMatch(
    query: String!
    vertical: String
    limit: Int
  ): [ConsultantMatch!]!
}

type ConsultantMatch {
  consultant: Consultant!
  matchScore: Float!
  matchReasons: [String!]!
}

# Mutations
type Mutation {
  # Auth
  register(input: RegisterInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!
  logout: SuccessPayload!
  refreshToken(token: String!): AuthPayload!
  
  # User
  updateUser(input: UpdateUserInput!): User!
  deleteUser(password: String!): SuccessPayload!
  
  # Consultant
  registerConsultant(input: RegisterConsultantInput!): Consultant!
  updateConsultant(id: ID!, input: UpdateConsultantInput!): Consultant!
  updateAvailability(id: ID!, input: AvailabilityInput!): Consultant!
  
  # Booking
  createBooking(input: CreateBookingInput!): Booking!
  cancelBooking(id: ID!, reason: String!): Booking!
  rescheduleBooking(id: ID!, input: RescheduleInput!): Booking!
  
  # Session
  createSession(bookingId: ID!): Session!
  startSession(id: ID!): Session!
  endSession(id: ID!, input: EndSessionInput!): Session!
  sendSessionMessage(sessionId: ID!, text: String!): Message!
  
  # Payment
  calculatePrice(input: PriceInput!): PriceResult!
  processPayment(input: PaymentInput!): Payment!
  requestRefund(input: RefundInput!): Payment!
  
  # Subscription
  subscribe(planId: ID!, paymentMethodId: String!): Subscription!
  cancelSubscription(id: ID!): Subscription!
  
  # Review
  createReview(input: CreateReviewInput!): Review!
  
  # AI
  aiChat(message: String!, context: JSON): AIChatResponse!
}

# Inputs
input RegisterInput {
  email: String!
  password: String!
  firstName: String
  lastName: String
  role: UserRole
  timezone: String
  language: String
}

input LoginInput {
  email: String!
  password: String!
  twoFactorCode: String
}

input CreateBookingInput {
  consultantId: ID!
  verticalId: ID!
  scheduledStart: DateTime!
  durationMinutes: Int!
  sessionType: ServiceType!
  topic: String
  description: String
  discountCode: String
}

input CreateReviewInput {
  referenceId: ID!
  reviewType: ReviewType!
  bookingId: ID
  rating: Int!
  title: String
  comment: String
  detailedRatings: DetailedRatingsInput
}

# Payloads
type AuthPayload {
  accessToken: String!
  refreshToken: String!
  expiresIn: Int!
  user: User!
}

type SuccessPayload {
  success: Boolean!
  message: String
}

type AIChatResponse {
  response: String!
  suggestedActions: [String!]!
  consultantRecommendations: [ConsultantMatch!]!
}
```

---

## 4. WebSocket Events

```yaml
WebSocketChannels:
  
  # Session Channel
  /ws/session/:sessionId:
    events:
      # Client to Server
      join_session:
        session_id: UUID
        user_id: UUID
      
      leave_session:
        session_id: UUID
      
      webrtc_signal:
        type: String (offer, answer, ice_candidate)
        data: Object
      
      toggle_media:
        video: Boolean
        audio: Boolean
      
      send_chat:
        text: String
      
      # Server to Client
      participant_joined:
        user_id: UUID
        user_type: String
      
      participant_left:
        user_id: UUID
      
      webrtc_signal:
        from: UUID
        type: String
        data: Object
      
      session_state_update:
        video_enabled: Boolean
        audio_enabled: Boolean
        recording: Boolean
      
      chat_message:
        message: MessageObject
      
      billing_update:
        elapsed_seconds: Integer
        current_charge: Decimal
      
      session_ended:
        duration: Integer
        billed_amount: Decimal
  
  # Chat Channel
  /ws/chat/:conversationId:
    events:
      # Client to Server
      send_message:
        text: String
        attachments: Array
      
      typing_start: null
      typing_stop: null
      mark_read:
        message_ids: Array
      
      # Server to Client
      new_message:
        message: MessageObject
      
      user_typing:
        user_id: UUID
        is_typing: Boolean
      
      messages_read:
        user_id: UUID
        message_ids: Array
      
      message_deleted:
        message_id: UUID
```

---

## Next Steps

1. See [Service Architecture](../architecture/service-architecture.md) for service endpoints
2. Review [Domain Models](../architecture/domain-models.md) for entity structures
3. Check [Security & Privacy](../specifications/security-privacy.md) for authentication

---

**Return to:** [CLAUDE.md](../CLAUDE.md) - Master Architecture Index