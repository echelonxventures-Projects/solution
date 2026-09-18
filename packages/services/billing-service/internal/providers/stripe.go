package providers

import (
	"context"
	"fmt"
	"log"

	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/paymentintent"
	"github.com/stripe/stripe-go/v76/customer"
	"github.com/stripe/stripe-go/v76/subscription"
	"github.com/stripe/stripe-go/v76/refund"
	"github.com/stripe/stripe-go/v76/price"
	"github.com/stripe/stripe-go/v76/product"
	"github.com/stripe/stripe-go/v76/paymentmethod"
	"github.com/stripe/stripe-go/v76/webhook"
)

type StripeProvider struct {
	APIKey       string
	WebhookSecret string
}

func NewStripeProvider(apiKey, webhookSecret string) *StripeProvider {
	stripe.Key = apiKey
	return &StripeProvider{
		APIKey:       apiKey,
		WebhookSecret: webhookSecret,
	}
}

// CreatePaymentIntent creates a Stripe payment intent
func (s *StripeProvider) CreatePaymentIntent(ctx context.Context, amount float64, currency string, metadata map[string]string) (*PaymentIntentResult, error) {
	// Stripe expects amount in cents
	amountCents := int64(amount * 100)

	params := &stripe.PaymentIntentParams{
		Amount:      stripe.Int64(amountCents),
		Currency:    stripe.String(currency),
		Metadata:    metadata,
		AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
			Enabled: stripe.Bool(true),
		},
	}

	pi, err := paymentintent.New(params)
	if err != nil {
		log.Printf("Failed to create payment intent: %v", err)
		return nil, err
	}

	return &PaymentIntentResult{
		ID:           pi.ID,
		ClientSecret: pi.ClientSecret,
		Amount:       float64(pi.Amount) / 100,
		Currency:     string(pi.Currency),
		Status:       string(pi.Status),
	}, nil
}

// ConfirmPaymentIntent confirms a payment intent
func (s *StripeProvider) ConfirmPaymentIntent(ctx context.Context, paymentIntentID string, paymentMethodID string) (*PaymentIntentResult, error) {
	params := &stripe.PaymentIntentConfirmParams{
		PaymentMethod: stripe.String(paymentMethodID),
	}

	pi, err := paymentintent.Confirm(paymentIntentID, params)
	if err != nil {
		return nil, err
	}

	return &PaymentIntentResult{
		ID:       pi.ID,
		Status:   string(pi.Status),
		Amount:   float64(pi.Amount) / 100,
		Currency: string(pi.Currency),
	}, nil
}

// CreateCustomer creates a Stripe customer
func (s *StripeProvider) CreateCustomer(ctx context.Context, email string, name string, metadata map[string]string) (*CustomerResult, error) {
	params := &stripe.CustomerParams{
		Email:    stripe.String(email),
		Name:     stripe.String(name),
		Metadata: metadata,
	}

	cust, err := customer.New(params)
	if err != nil {
		return nil, err
	}

	return &CustomerResult{
		ID:    cust.ID,
		Email: cust.Email,
		Name:  cust.Name,
	}, nil
}

// CreateSubscription creates a Stripe subscription
func (s *StripeProvider) CreateSubscription(ctx context.Context, customerID string, priceID string, metadata map[string]string, trialDays int64) (*SubscriptionResult, error) {
	params := &stripe.SubscriptionParams{
		Customer: stripe.String(customerID),
		Items: []*stripe.SubscriptionItemsParams{
			{
				Price: stripe.String(priceID),
			},
		},
		Metadata: metadata,
	}

	if trialDays > 0 {
		params.TrialPeriodDays = stripe.Int64(trialDays)
	}

	sub, err := subscription.New(params)
	if err != nil {
		return nil, err
	}

	return &SubscriptionResult{
		ID:             sub.ID,
		Status:         string(sub.Status),
		CurrentPeriodStart: sub.CurrentPeriodStart,
		CurrentPeriodEnd:   sub.CurrentPeriodEnd,
		CancelAtPeriodEnd:  sub.CancelAtPeriodEnd,
	}, nil
}

// CancelSubscription cancels a Stripe subscription
func (s *StripeProvider) CancelSubscription(ctx context.Context, subscriptionID string, cancelAtPeriodEnd bool) (*SubscriptionResult, error) {
	_ = cancelAtPeriodEnd
	params := &stripe.SubscriptionCancelParams{}

	sub, err := subscription.Cancel(subscriptionID, params)
	if err != nil {
		return nil, err
	}

	return &SubscriptionResult{
		ID:             sub.ID,
		Status:         string(sub.Status),
		CancelAtPeriodEnd: sub.CancelAtPeriodEnd,
		CancelledAt:    sub.CanceledAt,
	}, nil
}

// CreateRefund creates a Stripe refund
func (s *StripeProvider) CreateRefund(ctx context.Context, paymentIntentID string, amount float64, reason string) (*RefundResult, error) {
	amountCents := int64(amount * 100)

	params := &stripe.RefundParams{
		PaymentIntent: stripe.String(paymentIntentID),
		Amount:        stripe.Int64(amountCents),
		Reason:        stripe.String(string(stripe.RefundReasonRequestedByCustomer)),
		Metadata: map[string]string{
			"reason": reason,
		},
	}

	ref, err := refund.New(params)
	if err != nil {
		return nil, err
	}

	return &RefundResult{
		ID:             ref.ID,
		Amount:         float64(ref.Amount) / 100,
		Status:         string(ref.Status),
		PaymentIntentID: paymentIntentID,
	}, nil
}

// CreatePrice creates a Stripe price for subscription
func (s *StripeProvider) CreatePrice(ctx context.Context, productID string, amount float64, currency string, interval string, intervalCount int64) (*PriceResult, error) {
	amountCents := int64(amount * 100)

	params := &stripe.PriceParams{
		Product:    stripe.String(productID),
		UnitAmount: stripe.Int64(amountCents),
		Currency:   stripe.String(currency),
		Recurring: &stripe.PriceRecurringParams{
			Interval:      stripe.String(interval),
			IntervalCount: stripe.Int64(intervalCount),
		},
	}

	p, err := price.New(params)
	if err != nil {
		return nil, err
	}

	return &PriceResult{
		ID:           p.ID,
		ProductID:    productID,
		Amount:       float64(p.UnitAmount) / 100,
		Currency:     string(p.Currency),
		Interval:     string(p.Recurring.Interval),
		IntervalCount: p.Recurring.IntervalCount,
	}, nil
}

// CreateProduct creates a Stripe product
func (s *StripeProvider) CreateProduct(ctx context.Context, name string, description string, metadata map[string]string) (*ProductResult, error) {
	params := &stripe.ProductParams{
		Name:        stripe.String(name),
		Description: stripe.String(description),
		Metadata:    metadata,
	}

	prod, err := product.New(params)
	if err != nil {
		return nil, err
	}

	return &ProductResult{
		ID:          prod.ID,
		Name:        prod.Name,
		Description: prod.Description,
	}, nil
}

// AttachPaymentMethod attaches a payment method to customer
func (s *StripeProvider) AttachPaymentMethod(ctx context.Context, paymentMethodID string, customerID string) error {
	params := &stripe.PaymentMethodAttachParams{
		Customer: stripe.String(customerID),
	}

	_, err := paymentmethod.Attach(paymentMethodID, params)
	return err
}

// GetPaymentIntent retrieves a payment intent
func (s *StripeProvider) GetPaymentIntent(ctx context.Context, paymentIntentID string) (*PaymentIntentResult, error) {
	pi, err := paymentintent.Get(paymentIntentID, nil)
	if err != nil {
		return nil, err
	}

	return &PaymentIntentResult{
		ID:       pi.ID,
		Amount:   float64(pi.Amount) / 100,
		Currency: string(pi.Currency),
		Status:   string(pi.Status),
	}, nil
}

// Result types
type PaymentIntentResult struct {
	ID           string
	ClientSecret string
	Amount       float64
	Currency     string
	Status       string
}

type CustomerResult struct {
	ID    string
	Email string
	Name  string
}

type SubscriptionResult struct {
	ID               string
	Status           string
	CurrentPeriodStart int64
	CurrentPeriodEnd   int64
	CancelAtPeriodEnd  bool
	CancelledAt       int64
}

type RefundResult struct {
	ID              string
	Amount          float64
	Status          string
	PaymentIntentID string
}

type PriceResult struct {
	ID            string
	ProductID     string
	Amount        float64
	Currency      string
	Interval      string
	IntervalCount int64
}

type ProductResult struct {
	ID          string
	Name        string
	Description string
}

// GetStripeEvent parses Stripe webhook event
func ParseWebhookEvent(payload []byte, signature string, secret string) (*stripe.Event, error) {
	event, err := webhook.ConstructEvent(payload, signature, secret)
	if err != nil {
		return nil, fmt.Errorf("webhook signature verification failed: %v", err)
	}
	return &event, nil
}