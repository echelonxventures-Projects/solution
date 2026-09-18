package billing

import (
	"math"
)

// Platform fee percentages by pricing model
var PlatformFeeRates = map[string]float64{
	"hourly":      0.15,
	"flat":        0.12,
	"subscription": 0.10,
	"hybrid":      0.12,
}

// Tax rates by region
var TaxRates = map[string]float64{
	"US": 0.0,
	"US-CA": 0.0725,
	"US-NY": 0.08,
	"US-TX": 0.0625,
	"EU": 0.20,
	"UK": 0.20,
	"IN": 0.18,
	"AU": 0.10,
	"CA": 0.05,
	"default": 0.0,
}

// Engine handles billing calculations
type Engine struct{}

func NewEngine() *Engine {
	return &Engine{}
}

// CalculatePrice computes the total price for a session or subscription
func (e *Engine) CalculatePrice(baseAmount float64, pricingModel string, region string, discountRate float64) PriceResult {
	platformFeeRate := PlatformFeeRates[pricingModel]
	taxRate := TaxRates["default"]
	if rate, ok := TaxRates[region]; ok {
		taxRate = rate
	}

	// Apply discount
	discountAmount := baseAmount * discountRate
	discountedAmount := baseAmount - discountAmount

	// Calculate platform fee
	platformFee := discountedAmount * platformFeeRate

	// Calculate consultant earnings (before tax)
	consultantGross := discountedAmount - platformFee

	// Calculate tax on total
	taxAmount := discountedAmount * taxRate

	// Total amount seeker pays
	totalAmount := discountedAmount + taxAmount

	// Consultant receives amount minus platform fee (tax is paid by seeker)
	consultantEarnings := consultantGross

	return PriceResult{
		BaseAmount:         baseAmount,
		DiscountAmount:     discountAmount,
		DiscountedAmount:   discountedAmount,
		PlatformFee:        platformFee,
		PlatformFeeRate:    platformFeeRate,
		TaxAmount:          taxAmount,
		TaxRate:            taxRate,
		ConsultantEarnings: consultantEarnings,
		TotalAmount:        totalAmount,
	}
}

// CalculateHourlyPrice calculates price for hourly sessions
func (e *Engine) CalculateHourlyPrice(ratePerHour float64, durationMinutes int, region string, discountRate float64) PriceResult {
	hours := float64(durationMinutes) / 60.0
	baseAmount := ratePerHour * hours
	return e.CalculatePrice(baseAmount, "hourly", region, discountRate)
}

// CalculateSubscriptionPrice calculates subscription pricing
func (e *Engine) CalculateSubscriptionPrice(monthlyAmount float64, region string, discountRate float64) PriceResult {
	return e.CalculatePrice(monthlyAmount, "subscription", region, discountRate)
}

// CalculateRefund calculates refund amount based on timing
func (e *Engine) CalculateRefund(originalAmount float64, sessionStarted bool, completedPercentage float64) RefundResult {
	var refundPercentage float64

	if !sessionStarted {
		refundPercentage = 1.0
	} else if completedPercentage < 0.25 {
		refundPercentage = 0.75
	} else if completedPercentage < 0.50 {
		refundPercentage = 0.50
	} else if completedPercentage < 0.75 {
		refundPercentage = 0.25
	} else {
		refundPercentage = 0.0
	}

	refundAmount := originalAmount * refundPercentage
	platformRefund := refundAmount * 0.15
	consultantRefund := refundAmount - platformRefund

	return RefundResult{
		OriginalAmount:     originalAmount,
		RefundAmount:       refundAmount,
		RefundPercentage:   refundPercentage,
		PlatformRefund:     platformRefund,
		ConsultantRefund:   consultantRefund,
		Refundable:         refundPercentage > 0,
	}
}

// CalculatePayout calculates consultant payout
func (e *Engine) CalculatePayout(earnings float64, payoutMethod string) PayoutResult {
	var processingFee float64
	switch payoutMethod {
	case "bank_transfer":
		processingFee = 2.50
	case "paypal":
		processingFee = earnings * 0.02
	case "stripe":
		processingFee = earnings * 0.01
	default:
		processingFee = 0
	}

	netAmount := earnings - processingFee

	return PayoutResult{
		GrossEarnings:    earnings,
		ProcessingFee:    processingFee,
		PayoutMethod:     payoutMethod,
		NetPayoutAmount:  netAmount,
	}
}

// PriceResult holds calculated pricing details
type PriceResult struct {
	BaseAmount         float64
	DiscountAmount     float64
	DiscountedAmount   float64
	PlatformFee        float64
	PlatformFeeRate    float64
	TaxAmount          float64
	TaxRate            float64
	ConsultantEarnings float64
	TotalAmount        float64
}

// RefundResult holds refund calculation details
type RefundResult struct {
	OriginalAmount     float64
	RefundAmount       float64
	RefundPercentage   float64
	PlatformRefund     float64
	ConsultantRefund   float64
	Refundable         bool
}

// PayoutResult holds payout calculation details
type PayoutResult struct {
	GrossEarnings   float64
	ProcessingFee   float64
	PayoutMethod    string
	NetPayoutAmount float64
}

// Round2 rounds to 2 decimal places
func Round2(val float64) float64 {
	return math.Round(val*100) / 100
}