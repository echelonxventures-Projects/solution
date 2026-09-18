# Security & Privacy - Comprehensive Protection Framework

> **Document Version:** 1.0
> **Last Updated:** 2026-04-13
> **Owner:** Solution Architect
> **Related:** [CLAUDE.md](../CLAUDE.md) - Master Index

---

## 1. Security Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐      │
│   │ AUTHENTICATION  │     │ AUTHORIZATION   │     │ DATA SECURITY   │      │
│   │ & IDENTITY      │────►│ & ACCESS        │────►│ & ENCRYPTION    │      │
│   │                 │     │ CONTROL         │     │                 │      │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘      │
│           │                       │                       │                │
│           └────────────────────────────────────────────────┘                │
│                                   │                                         │
│                                   ▼                                         │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐      │
│   │ FRAUD           │     │ COMPLIANCE      │     │ AUDIT &         │      │
│   │ PREVENTION      │     │ & REGULATORY    │     │ MONITORING      │      │
│   │                 │     │                 │     │                 │      │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Identity

### 2.1 Authentication Methods

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION METHODS                                    │
├───────────────────────┬─────────────────────────────────────────────────────┤
│ Method                │ Implementation                                        │
├───────────────────────┼─────────────────────────────────────────────────────┤
│                       │                                                      │
│ EMAIL/PASSWORD        │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • bcrypt hashing      │ Standard login with secure password storage         │
│ • Password policies   │ Min 8 chars, uppercase, lowercase, number, special  │
│ • Rate limiting       │ Max 5 attempts per 15 min                           │
│                       │                                                      │
│ PHONE OTP             │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • SMS via Twilio      │ One-time password sent to phone                     │
│ • WhatsApp OTP        │ Alternative delivery via WhatsApp                   │
│ • OTP expiry: 5 min   │                                                      │
│                       │                                                      │
│ SOCIAL LOGIN          │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • Google OAuth2       │ OAuth2 flow with profile sync                       │
│ • Apple Sign-In       │ Privacy-focused auth                                 │
│ • Facebook Login      │ Optional integration                                 │
│                       │                                                      │
│ TWO-FACTOR AUTH       │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • SMS/App OTP         │ Required for consultants, optional for seekers      │
│ • TOTP (Authenticator)│ Google Authenticator, Authy                          │
│ • Hardware key        │ YubiKey support                                      │
│                       │                                                      │
│ MAGIC LINK            │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • Email magic link    │ Passwordless authentication                          │
│ • Expiry: 15 min      │                                                      │
│                       │                                                      │
│ BIOMETRIC             │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • Fingerprint         │ Mobile app authentication                            │
│ • Face ID             │ iOS/Android biometrics                               │
│                       │                                                      │
│ ENTERPRISE SSO        │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • SAML 2.0            │ Corporate single sign-on                             │
│ • OIDC                │ OpenID Connect                                       │
│                       │                                                      │
└───────────────────────┴─────────────────────────────────────────────────────┘
```

### 2.2 JWT Token System

```yaml
JWTConfiguration:
  algorithm: RS256  # Asymmetric for security
  issuer: "consultancy-platform"
  audience: ["platform-api", "media-server", "ai-service"]
  
  AccessToken:
    expiry: 15 minutes
    claims:
      - user_id
      - role
      - permissions
      - subscription_tier
      - region
      - language
      - session_id (optional)
  
  RefreshToken:
    expiry: 7 days
    storage: Redis (hashed)
    rotation: true  # New refresh token on each use
    family_tracking: true  # Detect token theft
  
  TokenFlow:
    login:
      - Generate access_token + refresh_token
      - Store refresh_token family in Redis
      - Return tokens to client
    
    refresh:
      - Validate refresh_token
      - Check family in Redis
      - Generate new access_token + new refresh_token
      - Update family in Redis
    
    revoke:
      - Invalidate token family
      - Clear from Redis
      - Require re-authentication
```

---

## 3. Authorization & Access Control

### 3.1 Role-Based Access Control (RBAC)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RBAC PERMISSION MATRIX                                    │
├─────────────────┬───────────────────────────────────────────────────────────┤
│ Role            │ Permissions                                                │
├─────────────────┼───────────────────────────────────────────────────────────┤
│                 │                                                           │
│ SEEKER_FREE     │                                                           │
│ ────────────────┼───────────────────────────────────────────────────────────┤
│ • View consultants│ Basic user access                                        │
│ • Book sessions  │                                                           │
│ • Send messages  │                                                           │
│ • View free content│                                                          │
│ • Basic AI chat │                                                           │
│                 │                                                           │
│ SEEKER_BASIC    │                                                           │
│ ────────────────┼───────────────────────────────────────────────────────────┤
│ • Free + 10% discount│ Subscribed seeker                                     │
│ • 5 sessions/month│                                                          │
│ • View all content│                                                           │
│ • Priority booking│                                                          │
│                 │                                                           │
│ SEEKER_PREMIUM  │                                                           │
│ ────────────────┼───────────────────────────────────────────────────────────┤
│ • Unlimited sessions│ Premium user                                           │
│ • 25% discount   │                                                           │
│ • All AI features│                                                           │
│ • Recording access│                                                          │
│                 │                                                           │
│ CONSULTANT_BASIC│                                                           │
│ ────────────────┼───────────────────────────────────────────────────────────┤
│ • Manage profile │ Registered consultant                                     │
│ • Set availability│                                                          │
│ • Conduct sessions│                                                          │
│ • Basic AI copilot│                                                          │
│ • Basic analytics│                                                           │
│                 │                                                           │
│ CONSULTANT_PRO  │                                                           │
│ ────────────────┼───────────────────────────────────────────────────────────┤
│ • Full AI copilot│ Professional consultant                                   │
│ • Advanced analytics│                                                        │
│ • Content hosting│                                                           │
│ • Lower platform fee│                                                        │
│                 │                                                           │
│ ADMIN           │                                                           │
│ ────────────────┼───────────────────────────────────────────────────────────┤
│ • User management│ Platform administrator                                    │
│ • Consultant approval│                                                       │
│ • Content moderation│                                                        │
│ • Billing oversight│                                                         │
│ • System configuration│                                                       │
│                 │                                                           │
│ SUPER_ADMIN     │                                                           │
│ ────────────────┼───────────────────────────────────────────────────────────┤
│ • All admin +   │ Highest privilege                                          │
│ • System logs   │                                                           │
│ • Security config│                                                           │
│ • API management │                                                           │
│                 │                                                           │
│ ENTERPRISE_ADMIN│                                                           │
│ ────────────────┼───────────────────────────────────────────────────────────┤
│ • Manage team   │ Corporate account                                          │
│ • Bulk bookings │                                                           │
│ • Team analytics│                                                           │
│ • API access    │                                                           │
│                 │                                                           │
└─────────────────┴───────────────────────────────────────────────────────────┘
```

### 3.2 Permission Enforcement

```yaml
PermissionCheck:
  middleware:
    - Extract JWT from request
    - Validate token signature
    - Check token expiry
    - Extract role and permissions
    - Check against required_permission
  
  enforcement:
    API_Gateway:
      - Role-based route filtering
      - Rate limiting per role
      - IP whitelist for admin
    
    Service_Level:
      - Permission check in each service
      - Resource ownership verification
      - Data scope filtering
    
    Data_Level:
      - Row-level security (PostgreSQL RLS)
      - Field-level encryption
      - Audit trail logging
```

---

## 4. Data Security & Encryption

### 4.1 Encryption Standards

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ENCRYPTION CONFIGURATION                                  │
├───────────────────────┬─────────────────────────────────────────────────────┤
│ Layer                 │ Implementation                                        │
├───────────────────────┼─────────────────────────────────────────────────────┤
│                       │                                                      │
│ TRANSPORT (TLS)       │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • TLS 1.3 minimum    │ All API and WebRTC communications                   │
│ • Certificate: Let's Encrypt │ Auto-renewal                                  │
│ • HSTS enabled       │ Force HTTPS                                           │
│                       │                                                      │
│ DATA AT REST          │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • AES-256-GCM        │ Database encryption                                   │
│ • Key management: AWS KMS │                                                    │
│ • Field-level: PII, payments │                                                    │
│                       │                                                      │
│ PASSWORD              │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • bcrypt with salt   │ Password hashing                                      │
│ • Cost factor: 12    │                                                        │
│                       │                                                      │
│ WEBRTC MEDIA          │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • SRTP encryption    │ Real-time media encryption                           │
│ • DTLS key exchange  │                                                        │
│                       │                                                      │
│ FILES/ATTACHMENTS     │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • AES-256-GCM        │ S3 object encryption                                  │
│ • SSE-S3 or SSE-KMS  │                                                        │
│                       │                                                      │
│ JWT                   │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • RS256 algorithm    │ Asymmetric signing                                    │
│ • Private key: HSM   │ Hardware security module                              │
│                       │                                                      │
└───────────────────────┴─────────────────────────────────────────────────────┘
```

### 4.2 PII Protection

```yaml
PIIFields:
  # Fields requiring encryption
  encrypted_fields:
    - email
    - phone
    - address
    - date_of_birth
    - payment_card_number
    - payment_card_expiry
    - payment_card_cvv (never stored)
    - ip_address (anonymized after 90 days)
    - session_transcripts (after processing)
  
  # Fields requiring anonymization for analytics
  anonymized_fields:
    - user_id → session_hash
    - location → region_only
    - age → age_range
  
  # Fields never stored
  never_stored:
    - raw_password
    - card_cvv
    - otp_code (after verification)
```

---

## 5. Fraud Prevention

### 5.1 Fraud Detection System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FRAUD DETECTION ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      FRAUD SIGNALS                                     │ │
│  │                                                                       │ │
│  │  Payment Fraud:                                                         │ │
│  │  ├── Velocity checks (too many payments quickly)                       │ │
│  │  ├── Geographic mismatch (billing vs IP)                               │ │
│  │  ├── Card testing patterns                                             │ │
│  │  ├── Unusual transaction amounts                                        │ │
│  │  ├── Failed payment patterns                                            │ │
│  │                                                                       │ │
│  │  Account Fraud:                                                          │ │
│  │  ├── Multiple accounts from same IP/device                             │ │
│  │  ├── Unusual registration patterns                                      │ │
│  │  ├── Credential stuffing indicators                                     │ │
│  │  ├── Session hijacking signals                                          │ │
│  │                                                                       │ │
│  │  Platform Abuse:                                                          │ │
│  │  ├── Booking manipulation (create-cancel patterns)                     │ │
│  │  ├── Review manipulation                                                │ │
│  │  ├── Referral abuse                                                      │ │
│  │  ├── Promo code abuse                                                   │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      DETECTION ENGINE                                  │ │
│  │                                                                       │ │
│  │  ML-based scoring:                                                       │ │
│  │  • Real-time fraud score (0-100)                                        │ │
│  │  • Risk level classification                                            │ │
│  │  • Pattern matching against known fraud                                │ │
│  │                                                                       │ │
│  │  Rule-based checks:                                                      │ │
│  │  • Velocity rules                                                        │ │
│  │  • Geographic rules                                                      │ │
│  │  • Amount threshold rules                                                │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      ACTIONS                                           │ │
│  │                                                                       │ │
│  │  Score 0-30 (Low): Allow with logging                                   │ │
│  │  Score 31-60 (Medium): Allow with enhanced monitoring                   │ │
│  │  Score 61-80 (High): Block + manual review                              │ │
│  │  Score 81-100 (Critical): Block + account flag                          │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Compliance & Regulatory

### 6.1 Regulatory Compliance Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLIANCE REQUIREMENTS                                   │
├─────────────────┬───────────────────────────────────────────────────────────┤
│ Regulation      │ Requirements                                                │
├─────────────────┼───────────────────────────────────────────────────────────┤
│                 │                                                           │
│ GDPR            │                                                           │
│ (EU Users)      │                                                           │
│ ────────────────┼───────────────────────────────────────────────────────────┤
│ • Data export   │ User can export all personal data                         │
│ • Data deletion │ Right to be forgotten                                      │
│ • Consent mgmt  │ Explicit consent for processing                           │
│ • Privacy policy│ Clear disclosure                                          │
│ • DPO appointed │ Data Protection Officer                                    │
│ • Breach notify │ 72-hour notification to authorities                        │
│                 │                                                           │
│ HIPAA           │                                                           │
│ (Health Content)│                                                           │
│ ────────────────┼───────────────────────────────────────────────────────────┤
│ • PHI encryption│ Health data encrypted                                      │
│ • Access logs   │ Audit trail for health data                               │
│ • BAA agreements│ Business Associate Agreements                             │
│ • Minimum necessary│ Data minimization                                       │
│                 │                                                           │
│ PCI-DSS         │                                                           │
│ (Payments)      │                                                           │
│ │───────────────┼───────────────────────────────────────────────────────────┤
│ • Card data protection│ Payment card security                               │
│ • Secure transmission│ TLS for payments                                      │
│ • Access control│ Limited access to payment data                            │
│ • Vulnerability scanning│ Regular security scans                             │
│ • Penetration testing│ Annual testing                                        │
│                 │                                                           │
│ SOC 2 Type II   │                                                           │
│ (Platform)      │                                                           │
│ ────────────────┼───────────────────────────────────────────────────────────┤
│ • Security controls│ Organizational controls                                 │
│ • Availability │ 99.9% uptime                                               │
│ • Processing integrity│ Accurate processing                                  │
│ • Confidentiality│ Data protection                                           │
│                 │                                                           │
│ LOCAL REGULATIONS│                                                           │
│ (Per Region)    │                                                           │
│ ────────────────┼───────────────────────────────────────────────────────────┤
│ • India: DPDP Act│ Data Protection Act                                       │
│ • Brazil: LGPD │                                                           │
│ • California: CCPA│ Consumer Privacy Act                                    │
│ • Singapore: PDPA│                                                           │
│                 │                                                           │
└─────────────────┴───────────────────────────────────────────────────────────┘
```

### 6.2 Data Retention Policies

```yaml
DataRetentionPolicies:
  
  UserAccountData:
    active: forever
    deleted_user: 30 days (then anonymize)
    inactive_account: 2 years (then archive)
  
  SessionData:
    transcripts: 1 year (then delete)
    recordings: 30 days (then delete, unless subscription)
    chat_logs: 90 days (then anonymize)
  
  PaymentData:
    transaction_records: 7 years (legal requirement)
    card_details: never store
    invoices: 7 years
  
  AnalyticsData:
    raw_events: 90 days (then aggregate)
    aggregated_stats: forever
    user_behavior: anonymized after 90 days
  
  AuditLogs:
    security_logs: 2 years
    access_logs: 1 year
    system_logs: 90 days
  
  ContentData:
    published_content: until deleted
    draft_content: 30 days (then delete)
    user_uploaded_files: until session + 30 days
```

---

## 7. Audit & Monitoring

### 7.1 Audit Trail

```yaml
AuditLog:
  log_id: UUID
  timestamp: Timestamp
  
  actor:
    user_id: UUID
    user_type: String
    ip_address: String
    device_id: String
    session_id: UUID
  
  action:
    action_type: enum[login, logout, create, update, delete, view, export, payment]
    resource_type: String
    resource_id: UUID
  
  details:
    before_state: JSON (for updates)
    after_state: JSON
    changes: JSON
  
  metadata:
    api_endpoint: String
    request_method: String
    response_status: Integer
    duration_ms: Integer
  
  security:
    risk_level: enum[low, medium, high]
    flagged: Boolean
    review_status: enum[none, pending, reviewed]
```

---

## Next Steps

1. See [User Entity in Domain Models](../architecture/domain-models.md#21-user-entity)
2. Review [Infrastructure](../architecture/infrastructure.md) for deployment security
3. Check [Multi-Region Config](multi-region.md) for regional compliance

---

**Return to:** [CLAUDE.md](../CLAUDE.md) - Master Architecture Index