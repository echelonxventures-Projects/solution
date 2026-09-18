package models

import (
	"time"
)

// Payment represents a payment transaction
type Payment struct {
	ID              string    `json:"id" validate:"required,uuid"`
	BookingID       string    `json:"bookingId" validate:"required,uuid"`
	SeekerID        string    `json:"seekerId" validate:"required,uuid"`
	ConsultantID    string    `json:"consultantId" validate:"required,uuid"`
	Amount          float64   `json:"amount" validate:"required,gt=0"`
	Currency        string    `json:"currency" validate:"required,len=3"`
	PricingModel    string    `json:"pricingModel" validate:"required,oneof=hourly flat subscription hybrid"`
	Status          string    `json:"status" validate:"required,oneof=pending processing completed failed refunded cancelled"`
	Provider        string    `json:"provider" validate:"required,oneof=stripe paypal wallet"`
	ProviderTxID    string    `json:"providerTxId"`
	PlatformFee     float64   `json:"platformFee"`
	ConsultantEarnings float64 `json:"consultantEarnings"`
	TaxAmount       float64   `json:"taxAmount"`
	TaxRate         float64   `json:"taxRate"`
	RefundAmount    float64   `json:"refundAmount"`
	RefundReason    string    `json:"refundReason"`
	RefundedAt      *time.Time `json:"refundedAt"`
	FailureReason   string    `json:"failureReason"`
	CompletedAt     *time.Time `json:"completedAt"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// Subscription represents a recurring subscription
type Subscription struct {
	ID               string    `json:"id" validate:"required,uuid"`
	SeekerID         string    `json:"seekerId" validate:"required,uuid"`
	ConsultantID     string    `json:"consultantId" validate:"required,uuid"`
	PlanID           string    `json:"planId" validate:"required,uuid"`
	Status           string    `json:"status" validate:"required,oneof=active paused cancelled expired pending"`
	Provider         string    `json:"provider" validate:"required,oneof=stripe paypal"`
	ProviderSubID    string    `json:"providerSubId"`
	CurrentPeriodStart time.Time `json:"currentPeriodStart"`
	CurrentPeriodEnd   time.Time `json:"currentPeriodEnd"`
	CancelAtPeriodEnd  bool      `json:"cancelAtPeriodEnd"`
	CancelledAt        *time.Time `json:"cancelledAt"`
	CancelReason       string    `json:"cancelReason"`
	TrialStart         *time.Time `json:"trialStart"`
	TrialEnd           *time.Time `json:"trialEnd"`
	Amount             float64   `json:"amount" validate:"required,gt=0"`
	Currency           string    `json:"currency" validate:"required,len=3"`
	Interval           string    `json:"interval" validate:"required,oneof=day week month year"`
	IntervalCount      int       `json:"intervalCount" validate:"required,gt=0"`
	TotalPayments      int       `json:"totalPayments"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

// SubscriptionPlan represents available subscription plans
type SubscriptionPlan struct {
	ID             string    `json:"id" validate:"required,uuid"`
	Name           string    `json:"name" validate:"required"`
	Description    string    `json:"description"`
	ConsultantID   string    `json:"consultantId"` // null for platform-wide plans
	Amount         float64   `json:"amount" validate:"required,gt=0"`
	Currency       string    `json:"currency" validate:"required,len=3"`
	Interval       string    `json:"interval" validate:"required,oneof=day week month year"`
	IntervalCount  int       `json:"intervalCount" validate:"required,gt=0"`
	TrialDays      int       `json:"trialDays"`
	Features       []string  `json:"features"`
	SessionLimit   int       `json:"sessionLimit"` // -1 for unlimited
	IsActive       bool      `json:"isActive"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// Invoice represents a billing invoice
type Invoice struct {
	ID              string    `json:"id" validate:"required,uuid"`
	SubscriptionID  string    `json:"subscriptionId" validate:"required,uuid"`
	SeekerID        string    `json:"seekerId" validate:"required,uuid"`
	Number          string    `json:"number"`
	Status          string    `json:"status" validate:"required,oneof=draft open paid void uncollectible"`
	Amount          float64   `json:"amount" validate:"required,gte=0"`
	Currency        string    `json:"currency" validate:"required,len=3"`
	TaxAmount       float64   `json:"taxAmount"`
	TotalAmount     float64   `json:"totalAmount"`
	DueDate         time.Time `json:"dueDate"`
	PaidAt          *time.Time `json:"paidAt"`
	ProviderInvoiceID string  `json:"providerInvoiceId"`
	Items           []InvoiceItem `json:"items"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// InvoiceItem represents a line item in an invoice
type InvoiceItem struct {
	ID          string    `json:"id"`
	InvoiceID   string    `json:"invoiceId"`
	Description string    `json:"description"`
	Amount      float64   `json:"amount"`
	Quantity    int       `json:"quantity"`
	PeriodStart time.Time `json:"periodStart"`
	PeriodEnd   time.Time `json:"periodEnd"`
}

// RefundRequest represents a refund request
type RefundRequest struct {
	ID           string    `json:"id" validate:"required,uuid"`
	PaymentID    string    `json:"paymentId" validate:"required,uuid"`
	SeekerID     string    `json:"seekerId" validate:"required,uuid"`
	Amount       float64   `json:"amount" validate:"required,gt=0"`
	Reason       string    `json:"reason" validate:"required"`
	Status       string    `json:"status" validate:"required,oneof=pending approved rejected processed"`
	ProcessedAt  *time.Time `json:"processedAt"`
	ProcessedBy  string    `json:"processedBy"`
	RejectReason string    `json:"rejectReason"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// PricingRequest for calculating prices
type PricingRequest struct {
	ConsultantID    string  `json:"consultantId" validate:"required,uuid"`
	PricingModel    string  `json:"pricingModel" validate:"required,oneof=hourly flat subscription hybrid"`
	DurationMinutes int     `json:"durationMinutes"` // for hourly
	SessionCount    int     `json:"sessionCount"`    // for subscription
	PlanID          string  `json:"planId"`          // for subscription
	CouponCode      string  `json:"couponCode"`
	Region          string  `json:"region"` // for tax calculation
}

// PricingResponse for calculated pricing
type PricingResponse struct {
	BaseAmount       float64 `json:"baseAmount"`
	DiscountAmount   float64 `json:"discountAmount"`
	TaxAmount        float64 `json:"taxAmount"`
	TaxRate          float64 `json:"taxRate"`
	PlatformFee      float64 `json:"platformFee"`
	ConsultantEarnings float64 `json:"consultantEarnings"`
	TotalAmount      float64 `json:"totalAmount"`
	Currency         string  `json:"currency"`
	Breakdown        PriceBreakdown `json:"breakdown"`
}

// PriceBreakdown detailed price components
type PriceBreakdown struct {
	SessionPrice   float64 `json:"sessionPrice"`
	SessionCount   int     `json:"sessionCount"`
	Subscription   bool    `json:"subscription"`
	Interval       string  `json:"interval"`
}

// CreatePaymentRequest for creating a payment
type CreatePaymentRequest struct {
	BookingID       string `json:"bookingId" validate:"required,uuid"`
	SeekerID        string `json:"seekerId" validate:"required,uuid"`
	ConsultantID    string `json:"consultantId" validate:"required,uuid"`
	Amount          float64 `json:"amount" validate:"required,gt=0"`
	Currency        string `json:"currency" validate:"required,len=3"`
	PricingModel    string `json:"pricingModel" validate:"required,oneof=hourly flat subscription hybrid"`
	Provider        string `json:"provider" validate:"required,oneof=stripe paypal"`
	ReturnURL       string `json:"returnUrl"`
	WebhookURL      string `json:"webhookUrl"`
	SavePaymentMethod bool  `json:"savePaymentMethod"`
}

// CreateSubscriptionRequest for creating a subscription
type CreateSubscriptionRequest struct {
	SeekerID        string `json:"seekerId" validate:"required,uuid"`
	ConsultantID    string `json:"consultantId" validate:"required,uuid"`
	PlanID          string `json:"planId" validate:"required,uuid"`
	Provider        string `json:"provider" validate:"required,oneof=stripe paypal"`
	CouponCode      string `json:"couponCode"`
	TrialDays       int    `json:"trialDays"`
	PaymentMethodID string `json:"paymentMethodId"`
}