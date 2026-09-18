# Billing Module - Comprehensive Pricing Engine

> **Document Version:** 1.0
> **Last Updated:** 2026-04-13
> **Owner:** Solution Architect
> **Related:** [CLAUDE.md](../CLAUDE.md) - Master Index

---

## 1. Billing Overview

The billing system supports all pricing combinations: subscription, per-minute, per-hour, per-session, packages, bundles, dynamic pricing, and more.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BILLING SYSTEM OVERVIEW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                  │
│   │ PRICING     │────►│ CALCULATION │────►│ BILLING     │                  │
│   │ MODELS      │     │ ENGINE      │     │ PROCESSOR   │                  │
│   └──────┬──────┘     └──────┬──────┘     └──────┬──────┘                  │
│          │                   │                   │                          │
│          ▼                   ▼                   ▼                          │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                  │
│   │ SUBSCRIPTION│     │ DYNAMIC     │     │ PAYMENT     │                  │
│   │ ENGINE      │     │ PRICING     │     │ GATEWAY     │                  │
│   └──────┬──────┘     └──────┬──────┘     └──────┬──────┘                  │
│          │                   │                   │                          │
│          ▼                   ▼                   ▼                          │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                  │
│   │ INVOICE     │     │ DISCOUNT    │     │ PAYOUT      │                  │
│   │ GENERATOR   │     │ ENGINE      │     │ PROCESSOR   │                  │
│   └─────────────┘     └─────────────┘     └─────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Pricing Models

### 2.1 Supported Pricing Models

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRICING MODEL MATRIX                                  │
├───────────────────────┬─────────────────────────────────────────────────────┤
│ Model                 │ Description                                          │
├───────────────────────┼─────────────────────────────────────────────────────┤
│                       │                                                      │
│ PER_MINUTE           │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • Rate: $0.50-$10/min │ Charge based on actual session duration              │
│ • Billing: Real-time  │ Timer starts when both parties join                  │
│ • Use case: Quick queries, urgent consultations                              │
│                       │                                                      │
│ PER_HOUR              │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • Rate: $50-$500/hr   │ Fixed hourly rate                                    │
│ • Billing: Per started hour │ Partial hours charged proportionally           │
│ • Use case: Deep consultations, career counseling                            │
│                       │                                                      │
│ PER_SESSION           │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • Rate: $20-$200 fixed│ Fixed price per booked session                       │
│ • Duration: Pre-defined │ Regardless of actual time used                      │
│ • Use case: Astrology readings, structured sessions                          │
│                       │                                                      │
│ PACKAGE               │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • 5 sessions @ $400   │ Bundle of sessions at discounted rate                │
│ • Validity: 30-90 days │ Must be used within validity period                 │
│ • Use case: Coaching programs, therapy sessions                              │
│                       │                                                      │
│ SUBSCRIPTION          │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • Monthly: $29-$199   │ Recurring access                                     │
│ • Includes: X sessions │ Plus discounts, priority, AI features               │
│ • Use case: Regular clients, ongoing support                                 │
│                       │                                                      │
│ CONTENT_ACCESS        │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • Per class: $5-$50   │ One-time purchase of recorded content               │
│ • Subscription only   │ Content available only to subscribers               │
│ • Use case: Recorded classes, ebooks                                         │
│                       │                                                      │
│ TIP                   │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • Amount: 5-20% extra│ Additional payment after session                     │
│ • Optional: User choice │ Goes 100% to consultant                             │
│                       │                                                      │
│ COMBINATION           │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • Subscription + per-minute │ Hybrid models                                   │
│ • Package + subscription │ Bundled offerings                                  │
│                       │                                                      │
└───────────────────────┴─────────────────────────────────────────────────────┘
```

---

### 2.2 Pricing Configuration Schema

```yaml
PricingConfiguration:
  consultant_id: UUID
  vertical_id: UUID
  
  # Base Rates
  base_rates:
    per_minute:
      rate: Decimal
      minimum_minutes: Integer
      currency: String
      enabled: Boolean
    
    per_hour:
      rate: Decimal
      minimum_hours: Decimal
      currency: String
      enabled: Boolean
    
    per_session:
      rates: [
        {
          duration_minutes: Integer
          rate: Decimal
          currency: String
        }
      ]
      enabled: Boolean
  
  # Packages
  packages: [
    {
      id: UUID
      name: String
      description: String
      sessions_count: Integer
      total_price: Decimal
      per_session_price: Decimal
      validity_days: Integer
      session_durations: [Integer]
      currency: String
      discount_percentage: Decimal
      enabled: Boolean
    }
  ]
  
  # Dynamic Pricing
  dynamic_pricing:
    enabled: Boolean
    rules: [
      {
        type: enum[peak_hours, weekend, urgent, first_time, premium_client]
        multiplier: Decimal
        conditions: JSON
        start_time: Time
        end_time: Time
        days: [Integer]
      }
    ]
  
  # Discounts
  discount_rules: [
    {
      type: enum[percentage, fixed_amount]
      value: Decimal
      conditions: {
        min_sessions: Integer
        subscription_tier: String
        first_time_client: Boolean
        promo_code: String
        validity_start: Date
        validity_end: Date
      }
      stackable: Boolean
      max_discount: Decimal
    }
  ]
  
  # Platform Fee
  platform_fee:
    percentage: Decimal  # Default: 15-25%
    minimum_fee: Decimal
    subscription_discount: Decimal  # Lower for subscribers
  
  # Tax Configuration
  tax_config:
    tax_enabled: Boolean
    tax_rate: Decimal
    tax_type: enum[VAT, GST, SalesTax]
    tax_inclusive: Boolean
    regions: [
      {
        region: String
        tax_rate: Decimal
        tax_name: String
      }
    ]
```

---

## 3. Billing Calculation Engine

### 3.1 Calculation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BILLING CALCULATION FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │ SESSION START   │                                                        │
│  └────────────┬────┘                                                        │
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        PRICING MODEL CHECK                              ││
│  │                                                                         ││
│  │  IF subscription:                                                       ││
│  │    → Check subscription limits                                          ││
│  │    → Apply subscription discount                                        ││
│  │    → Track usage against quota                                          ││
│  │                                                                         ││
│  │  IF package:                                                            ││
│  │    → Deduct from package balance                                        ││
│  │    → Check package validity                                             ││
│  │                                                                         ││
│  │  IF per_minute/per_hour:                                                ││
│  │    → Initialize billing timer                                           ││
│  │    → Set up real-time billing                                           ││
│  │                                                                         ││
│  │  IF per_session:                                                        ││
│  │    → Use pre-paid amount                                                ││
│  │    → No additional billing during session                               ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        DYNAMIC PRICING CHECK                            ││
│  │                                                                         ││
│  │  Check conditions:                                                      ││
│  │  ├── Peak hours? → Apply multiplier                                     ││
│  │  ├── Weekend? → Apply weekend rate                                      ││
│  │  ├── Urgent booking? → Apply urgency premium                            ││
│  │  ├── First-time client? → Apply first-time discount                     ││
│  │  ├── Premium client? → Apply loyalty discount                           ││
│  │  ├── Subscription tier? → Apply tier discount                           ││
│  │                                                                         ││
│  │  Calculate final rate = base_rate × dynamic_multiplier                  ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        DISCOUNT CALCULATION                             ││
│  │                                                                         ││
│  │  Apply eligible discounts (stackable or best-only):                     ││
│  │  ├── Promo code discount                                                ││
│  │  ├── Loyalty discount                                                   ││
│  │  ├── Bundle discount                                                    ││
│  │  ├── Referral discount                                                  ││
│  │  ├── Regional discount                                                  ││
│  │                                                                         ││
│  │  final_price = base_price - discounts                                   ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        FEE & TAX CALCULATION                            ││
│  │                                                                         ││
│  │  platform_fee = final_price × platform_fee_percentage                   ││
│  │  consultant_earnings = final_price - platform_fee                       ││
│  │  tax_amount = final_price × tax_rate (if applicable)                    ││
│  │  total_charge = final_price + tax_amount                                ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        CURRENCY CONVERSION                              ││
│  │                                                                         ││
│  │  IF client_currency ≠ consultant_currency:                              ││
│  │    → Get real-time exchange rate                                        ││
│  │    → Convert amounts                                                    ││
│  │    → Apply conversion fee (if applicable)                               ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────┐                                                        │
│  │ CHARGE CLIENT   │                                                        │
│  └────────────┬────┘                                                        │
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        SESSION END                                      ││
│  │                                                                         ││
│  │  IF per_minute/per_hour:                                                ││
│  │    → Calculate final duration                                           ││
│  │    → Generate final bill                                                ││
│  │    → Process payment                                                    ││
│  │                                                                         ││
│  │  IF per_session/package/subscription:                                   ││
│  │    → Finalize pre-payment                                               ││
│  │    → Update usage tracking                                              ││
│  │                                                                         ││
│  │  Generate invoice                                                       ││
│  │  Update consultant earnings                                             ││
│  │  Trigger payout (if threshold met)                                      ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Real-Time Billing for Per-Minute/Per-Hour

```yaml
RealTimeBilling:
  session_id: UUID
  billing_interval: Integer  # Every 60 seconds
  
  BillingCycle:
    every_interval:
      - Calculate elapsed_time
      - Calculate current_charge = elapsed_time × rate
      - Update running_total
      - Send update to client (optional notification)
      - Check prepaid_balance (if applicable)
      
      IF prepaid_balance < running_total:
        - Notify low balance
        - Option to add funds
        - Option to end session
      
      IF session_ends:
        - Final calculation
        - Process payment
        - Generate invoice
  
  BillingRules:
    minimum_charge: Decimal  # Minimum for session to start
    buffer_time_free: Integer # First X seconds free (connection time)
    grace_period: Integer    # Extra time allowed at end
    auto_extend_threshold: Decimal # Warn when approaching limit
```

---

## 4. Subscription Billing

### 4.1 Subscription Plans

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SUBSCRIPTION PLAN CONFIGURATION                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐  │
│  │ PLAN            │ SEEKER_BASIC    │ SEEKER_PREMIUM  │ SEEKER_ELITE    │  │
│  ├─────────────────┼─────────────────┼─────────────────┼─────────────────┤  │
│  │                 │                 │                 │                 │  │
│  │ Price           │ $29/month       │ $99/month       │ $199/month      │  │
│  │                 │                 │                 │                 │  │
│  │ Sessions        │ 5/month         │ Unlimited       │ Unlimited       │  │
│  │                 │                 │                 │                 │  │
│  │ Minutes         │ 120/month       │ Unlimited       │ Unlimited       │  │
│  │                 │                 │                 │                 │  │
│  │ Discount        │ 10%             │ 25%             │ 50%             │  │
│  │                 │                 │                 │                 │  │
│  │ Class Access    │ None            │ All classes     │ All + exclusive │  │
│  │                 │                 │                 │                 │  │
│  │ AI Features     │ Basic matching  │ AI Copilot      │ Full AI suite   │  │
│  │                 │                 │                 │                 │  │
│  │ Priority        │ Normal          │ High            │ Highest         │  │
│  │                 │                 │                 │                 │  │
│  │ Support         │ Email           │ Chat            │ Phone           │  │
│  │                 │                 │                 │                 │  │
│  │ Consultants     │ All             │ Premium+        │ Elite only      │  │
│  │                 │                 │                 │                 │  │
│  │ Recording       │ No              │ Yes             │ Yes + download  │  │
│  │                 │                 │                 │                 │  │
│  └─────────────────┴─────────────────┴─────────────────┴─────────────────┘  │
│                                                                             │
│  ┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐  │
│  │ PLAN            │ CONSULTANT_BASIC│ CONSULTANT_PRO  │ CONSULTANT_ELITE│  │
│  ├─────────────────┼─────────────────┼─────────────────┼─────────────────┤  │
│  │                 │                 │                 │                 │  │
│  │ Price           │ $49/month       │ $99/month       │ $199/month      │  │
│  │                 │                 │                 │                 │  │
│  │ Platform Fee    │ 20%             │ 15%             │ 10%             │  │
│  │                 │                 │                 │                 │  │
│  │ AI Copilot      │ Basic           │ Advanced        │ Full suite      │  │
│  │                 │                 │                 │                 │  │
│  │ Analytics       │ Basic           │ Advanced        │ Enterprise      │  │
│  │                 │                 │                 │                 │  │
│  │ Content Host    │ 5 classes       │ Unlimited       │ Unlimited       │  │
│  │                 │                 │                 │                 │  │
│  │ Custom Brand    │ No              │ Basic           │ Full            │  │
│  │                 │                 │                 │                 │  │
│  │ Priority List   │ No              │ Yes             │ Featured        │  │
│  │                 │                 │                 │                 │  │
│  │ API Access      │ No              │ Basic           │ Full            │  │
│  │                 │                 │                 │                 │  │
│  └─────────────────┴─────────────────┴─────────────────┴─────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Subscription Billing Cycle

```yaml
SubscriptionBillingCycle:
  subscription_id: UUID
  billing_cycle: enum[monthly, quarterly, annual]
  
  CycleFlow:
    on_cycle_start:
      - Generate invoice
      - Send notification
      - Process payment
    
    on_payment_success:
      - Extend subscription period
      - Update usage quotas
      - Activate features
    
    on_payment_failure:
      - Retry payment (3 attempts)
      - Grace period (7 days)
      - Downgrade features
      - Final: suspend subscription
    
    on_cycle_end:
      - Calculate overage (if applicable)
      - Generate usage report
      - Process overage charges
    
    on_cancellation:
      - Calculate refund (if applicable)
      - Process refund
      - Retain access until end of period
```

---

## 5. Payment Gateway Integration

### 5.1 Supported Payment Providers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PAYMENT PROVIDER CONFIGURATION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┬─────────────────────────────────────────────────────┐  │
│  │ Provider        │ Integration Details                               │  │
│  ├─────────────────┼─────────────────────────────────────────────────────┤  │
│  │                 │                                                   │  │
│  │ STRIPE          │ Primary global provider                           │  │
│  │                 │ • Cards, Apple Pay, Google Pay                    │  │
│  │                 │ • 135+ currencies                                 │  │
│  │                 │ • Subscription management                         │  │
│  │                 │ • Webhook events                                  │  │
│  │                 │                                                   │  │
│  │ PAYPAL          │ Secondary global provider                         │  │
│  │                 │ • PayPal, Venmo                                   │  │
│  │                 │ • International                                   │  │
│  │                 │                                                   │  │
│  │ RAZORPAY        │ India-focused                                     │  │
│  │                 │ • UPI, Cards, Wallets                             │  │
│  │                 │ • INR currency                                    │  │
│  │                 │                                                   │  │
│  │ ADYEN           │ Enterprise global                                 │  │
│  │                 │ • Multi-acquirer                                  │  │
│  │                 │ • Local payment methods                           │  │
│  │                 │                                                   │  │
│  │ ALIPAY/WECHAT   │ China-focused                                     │  │
│  │                 │ • Chinese market                                  │  │
│  │                 │                                                   │  │
│  │ CRYPTO          │ Optional                                          │  │
│  │                 │ • Bitcoin, Ethereum                               │  │
│  │                 │ • Via Coinbase Commerce                           │  │
│  │                 │                                                   │  │
│  └─────────────────┴─────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Payment Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PAYMENT PROCESSING FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │ PAYMENT REQUEST │                                                        │
│  └────────────┬────┘                                                        │
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        PRE-PROCESSING                                   ││
│  │                                                                         ││
│  │  • Validate amount                                                      ││
│  │  • Check currency                                                       ││
│  │  • Verify user payment methods                                          ││
│  │  • Calculate fees and taxes                                             ││
│  │  • Apply discounts                                                      ││
│  │  • Fraud risk assessment                                                ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        PROVIDER SELECTION                               ││
│  │                                                                         ││
│  │  IF user_region = India → Razorpay                                     ││
│  │  IF user_region = China → Alipay/WeChat                                ││
│  │  IF payment_method = crypto → Coinbase Commerce                         ││
│  │  DEFAULT → Stripe                                                       ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        PAYMENT INITIALIZATION                           ││
│  │                                                                         ││
│  │  • Create payment intent (Stripe)                                       ││
│  │  • Generate payment URL                                                 ││
│  │  • Set webhook callbacks                                                ││
│  │  • Initialize 3DS if required                                           ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        USER AUTHENTICATION                              ││
│  │                                                                         ││
│  │  • Collect payment details                                              ││
│  │  • 3DS authentication (if required)                                     ││
│  │  • Card verification                                                    ││
│  │  • Wallet authentication                                                ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        PAYMENT PROCESSING                               ││
│  │                                                                         ││
│  │  Provider processes:                                                    ││
│  │  • Charge card/wallet                                                   ││
│  │  • Handle bank authorization                                            ││
│  │  • Return transaction result                                            ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        POST-PROCESSING                                  ││
│  │                                                                         ││
│  │  ON SUCCESS:                                                            ││
│  │  • Record transaction                                                   ││
│  │  • Update booking/subscription                                          ││
│  │  • Update consultant earnings                                           ││
│  │  • Send confirmation email                                              ││
│  │  • Trigger webhook events                                               ││
│  │  • Generate invoice                                                     ││
│  │                                                                         ││
│  │  ON FAILURE:                                                            ││
│  │  • Record failure reason                                                ││
│  │  • Notify user                                                          ││
│  │  • Offer retry or alternative payment                                   ││
│  │  • Log for fraud analysis                                               ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Invoice & Receipt System

### 6.1 Invoice Generation

```yaml
InvoiceConfiguration:
  invoice_format: enum[PDF, HTML, Email]
  invoice_number_format: "INV-{year}-{sequential}"
  
  InvoiceData:
    invoice_id: UUID
    invoice_number: String
    user_id: UUID
    issue_date: Date
    due_date: Date
    
    billing_address:
      name: String
      address_line1: String
      address_line2: String
      city: String
      state: String
      country: String
      postal_code: String
    
    line_items: [
      {
        description: String
        quantity: Integer
        unit_price: Decimal
        total: Decimal
        type: enum[session, subscription, content, discount, tax, fee]
      }
    ]
    
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    platform_fee: Decimal
    total_amount: Decimal
    currency: String
    
    payment_details:
      payment_method: String
      transaction_id: String
      payment_date: Date
    
    notes: String
    terms: String
```

---

## 7. Payout System (Consultant Earnings)

### 7.1 Payout Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONSULTANT PAYOUT SYSTEM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        EARNINGS ACCUMULATION                            ││
│  │                                                                         ││
│  │  Session completed →                                                    ││
│  │  Calculate consultant_earnings = session_amount - platform_fee          ││
│  │  Add to consultant_balance                                              ││
│  │  Log earnings transaction                                               ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        PAYOUT THRESHOLD CHECK                           ││
│  │                                                                         ││
│  │  Payout triggers:                                                       ││
│  │  • Balance > minimum_threshold ($50)                                   ││
│  │  • Scheduled payout day (weekly/monthly)                                ││
│  │  • Manual request by consultant                                         ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        PAYOUT METHOD SELECTION                          ││
│  │                                                                         ││
│  │  Consultant payout methods:                                             ││
│  │  ├── Bank transfer (ACH/Wire)                                          ││
│  │  ├── PayPal                                                             ││
│  │  ├── Stripe Express                                                     ││
│  │  ├── Wise (International)                                               ││
│  │  ├── Crypto (Optional)                                                  ││
│  │  ├── Platform wallet (hold balance)                                     ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        PAYOUT PROCESSING                                ││
│  │                                                                         ││
│  │  • Create payout transaction                                            ││
│  │  • Deduct payout fee (if applicable)                                   ││
│  │  • Initiate transfer to consultant                                      ││
│  │  • Update consultant balance                                            ││
│  │  • Send payout confirmation                                             ││
│  │  • Generate payout receipt                                              ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Discount & Offer System

### 8.1 Discount Types

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DISCOUNT & OFFER TYPES                                │
├───────────────────────┬─────────────────────────────────────────────────────┤
│ Type                  │ Configuration                                        │
├───────────────────────┼─────────────────────────────────────────────────────┤
│                       │                                                      │
│ PROMO CODE            │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • code: "SUMMER25"    │ User enters code at checkout                        │
│ • discount: 25%       │ One-time or reusable                                │
│ • valid_until: Date   │ Can have usage limits                                │
│                       │                                                      │
│ FIRST-TIME CLIENT     │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • discount: 20%       │ Automatically applied for new users                  │
│ • max_sessions: 3     │ First X sessions discounted                          │
│                       │                                                      │
│ LOYALTY DISCOUNT      │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • tiers: [10%, 15%, 20%] │ Based on total sessions completed                 │
│ • thresholds: [5, 20, 50]│ Automatic upgrade                                  │
│                       │                                                      │
│ REFERRAL DISCOUNT     │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • referrer: 15%       │ Both parties get discount                            │
│ • referred: 20%       │ One-time for referred                                │
│                       │                                                      │
│ BUNDLE DISCOUNT       │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • Book 5+ sessions    │ Buy more, pay less                                   │
│ • discount: 15%       │ Auto-applied at checkout                             │
│                       │                                                      │
│ HAPPY HOUR            │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • time: 10AM-12PM     │ Discount during specific hours                       │
│ • discount: 30%       │ Encourage bookings in off-peak                       │
│                       │                                                      │
│ SUBSCRIPTION BONUS    │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • Subscribe → 2 free  │ Extra sessions for subscribers                       │
│ • sessions            │                                                      │
│                       │                                                      │
│ FLASH SALE            │                                                      │
│ ─────────────────────┼─────────────────────────────────────────────────────┤
│ • limited time        │ Time-bound promotional pricing                       │
│ • limited quantity    │ First N users get discount                           │
│                       │                                                      │
└───────────────────────┴─────────────────────────────────────────────────────┘
```

---

## Next Steps

1. See [Payment Entity in Domain Models](../architecture/domain-models.md#26-payment-entity)
2. Review [Service Architecture](../architecture/service-architecture.md) for Billing Service
3. Check [API Specification](../api/api-specification.md) for Billing endpoints

---

**Return to:** [CLAUDE.md](../CLAUDE.md) - Master Architecture Index