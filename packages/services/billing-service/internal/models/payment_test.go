package models

import (
	"testing"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

func validPaymentRequest() CreatePaymentRequest {
	return CreatePaymentRequest{
		BookingID:    "550e8400-e29b-41d4-a716-446655440000",
		SeekerID:     "550e8400-e29b-41d4-a716-446655440001",
		ConsultantID: "550e8400-e29b-41d4-a716-446655440002",
		Amount:       100,
		Currency:     "USD",
		PricingModel: "hourly",
		Provider:     "stripe",
	}
}

func TestCreatePaymentRequest_Valid(t *testing.T) {
	req := validPaymentRequest()
	if err := validate.Struct(req); err != nil {
		t.Errorf("expected valid request, got error: %v", err)
	}
}

func TestCreatePaymentRequest_AllPricingModels(t *testing.T) {
	for _, model := range []string{"hourly", "flat", "subscription", "hybrid"} {
		req := validPaymentRequest()
		req.PricingModel = model
		if err := validate.Struct(req); err != nil {
			t.Errorf("pricing model %q should be valid: %v", model, err)
		}
	}
}

func TestCreatePaymentRequest_AllProviders(t *testing.T) {
	for _, provider := range []string{"stripe", "paypal"} {
		req := validPaymentRequest()
		req.Provider = provider
		if err := validate.Struct(req); err != nil {
			t.Errorf("provider %q should be valid: %v", provider, err)
		}
	}
}

func TestCreatePaymentRequest_InvalidPricingModel(t *testing.T) {
	req := validPaymentRequest()
	req.PricingModel = "unknown"
	if err := validate.Struct(req); err == nil {
		t.Error("expected error for invalid pricing model, got nil")
	}
}

func TestCreatePaymentRequest_InvalidProvider(t *testing.T) {
	req := validPaymentRequest()
	req.Provider = "unknown"
	if err := validate.Struct(req); err == nil {
		t.Error("expected error for invalid provider, got nil")
	}
}

func TestCreatePaymentRequest_ZeroAmount(t *testing.T) {
	req := validPaymentRequest()
	req.Amount = 0
	if err := validate.Struct(req); err == nil {
		t.Error("expected error for zero amount, got nil")
	}
}

func TestCreatePaymentRequest_NegativeAmount(t *testing.T) {
	req := validPaymentRequest()
	req.Amount = -10
	if err := validate.Struct(req); err == nil {
		t.Error("expected error for negative amount, got nil")
	}
}

func TestCreatePaymentRequest_InvalidCurrency(t *testing.T) {
	cases := []string{"", "US", "USDD"}
	for _, currency := range cases {
		req := validPaymentRequest()
		req.Currency = currency
		if err := validate.Struct(req); err == nil {
			t.Errorf("expected error for currency %q, got nil", currency)
		}
	}
}

func TestCreatePaymentRequest_InvalidUUID(t *testing.T) {
	req := validPaymentRequest()
	req.BookingID = "not-a-uuid"
	if err := validate.Struct(req); err == nil {
		t.Error("expected error for invalid booking ID, got nil")
	}
}

func TestCreatePaymentRequest_MissingIDs(t *testing.T) {
	req := validPaymentRequest()
	req.SeekerID = ""
	if err := validate.Struct(req); err == nil {
		t.Error("expected error for missing seeker ID, got nil")
	}
}

func TestCreateSubscriptionRequest_Valid(t *testing.T) {
	req := CreateSubscriptionRequest{
		SeekerID:     "550e8400-e29b-41d4-a716-446655440001",
		ConsultantID: "550e8400-e29b-41d4-a716-446655440002",
		PlanID:       "550e8400-e29b-41d4-a716-446655440003",
		Provider:     "stripe",
	}
	if err := validate.Struct(req); err != nil {
		t.Errorf("expected valid subscription request, got error: %v", err)
	}
}

func TestCreateSubscriptionRequest_InvalidProvider(t *testing.T) {
	req := CreateSubscriptionRequest{
		SeekerID:     "550e8400-e29b-41d4-a716-446655440001",
		ConsultantID: "550e8400-e29b-41d4-a716-446655440002",
		PlanID:       "550e8400-e29b-41d4-a716-446655440003",
		Provider:     "wallet",
	}
	if err := validate.Struct(req); err == nil {
		t.Error("expected error for invalid subscription provider, got nil")
	}
}

func TestPayment_Valid(t *testing.T) {
	p := Payment{
		ID:           "550e8400-e29b-41d4-a716-446655440000",
		BookingID:    "550e8400-e29b-41d4-a716-446655440001",
		SeekerID:     "550e8400-e29b-41d4-a716-446655440002",
		ConsultantID: "550e8400-e29b-41d4-a716-446655440003",
		Amount:       100,
		Currency:     "USD",
		PricingModel: "flat",
		Status:       "pending",
		Provider:     "paypal",
	}
	if err := validate.Struct(p); err != nil {
		t.Errorf("expected valid payment, got error: %v", err)
	}
}

func TestPayment_InvalidStatus(t *testing.T) {
	p := Payment{
		ID:           "550e8400-e29b-41d4-a716-446655440000",
		BookingID:    "550e8400-e29b-41d4-a716-446655440001",
		SeekerID:     "550e8400-e29b-41d4-a716-446655440002",
		ConsultantID: "550e8400-e29b-41d4-a716-446655440003",
		Amount:       100,
		Currency:     "USD",
		PricingModel: "flat",
		Status:       "unknown",
		Provider:     "paypal",
	}
	if err := validate.Struct(p); err == nil {
		t.Error("expected error for invalid payment status, got nil")
	}
}
