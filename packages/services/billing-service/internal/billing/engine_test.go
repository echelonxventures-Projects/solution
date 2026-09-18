package billing

import (
	"math"
	"testing"
)

func TestCalculatePrice_Hourly_NoDiscount_US(t *testing.T) {
	e := NewEngine()
	// $100 hourly, no discount, US (no tax)
	r := e.CalculatePrice(100, "hourly", "US", 0)

	if r.BaseAmount != 100 {
		t.Errorf("BaseAmount = %v, want 100", r.BaseAmount)
	}
	if r.DiscountAmount != 0 {
		t.Errorf("DiscountAmount = %v, want 0", r.DiscountAmount)
	}
	if r.PlatformFeeRate != 0.15 {
		t.Errorf("PlatformFeeRate = %v, want 0.15", r.PlatformFeeRate)
	}
	if r.PlatformFee != 15 {
		t.Errorf("PlatformFee = %v, want 15", r.PlatformFee)
	}
	if r.ConsultantEarnings != 85 {
		t.Errorf("ConsultantEarnings = %v, want 85", r.ConsultantEarnings)
	}
	if r.TaxRate != 0 {
		t.Errorf("TaxRate = %v, want 0", r.TaxRate)
	}
	if r.TaxAmount != 0 {
		t.Errorf("TaxAmount = %v, want 0", r.TaxAmount)
	}
	if r.TotalAmount != 100 {
		t.Errorf("TotalAmount = %v, want 100", r.TotalAmount)
	}
}

func TestCalculatePrice_WithTax_EU(t *testing.T) {
	e := NewEngine()
	// $100 flat, EU 20% tax
	r := e.CalculatePrice(100, "flat", "EU", 0)

	if r.PlatformFeeRate != 0.12 {
		t.Errorf("PlatformFeeRate = %v, want 0.12", r.PlatformFeeRate)
	}
	if r.PlatformFee != 12 {
		t.Errorf("PlatformFee = %v, want 12", r.PlatformFee)
	}
	if r.TaxRate != 0.20 {
		t.Errorf("TaxRate = %v, want 0.20", r.TaxRate)
	}
	if r.TaxAmount != 20 {
		t.Errorf("TaxAmount = %v, want 20", r.TaxAmount)
	}
	if r.TotalAmount != 120 {
		t.Errorf("TotalAmount = %v, want 120", r.TotalAmount)
	}
	if r.ConsultantEarnings != 88 {
		t.Errorf("ConsultantEarnings = %v, want 88", r.ConsultantEarnings)
	}
}

func TestCalculatePrice_WithDiscount(t *testing.T) {
	e := NewEngine()
	// $100 subscription, 10% discount, US
	r := e.CalculatePrice(100, "subscription", "US", 0.10)

	if r.DiscountAmount != 10 {
		t.Errorf("DiscountAmount = %v, want 10", r.DiscountAmount)
	}
	if r.DiscountedAmount != 90 {
		t.Errorf("DiscountedAmount = %v, want 90", r.DiscountedAmount)
	}
	if r.PlatformFeeRate != 0.10 {
		t.Errorf("PlatformFeeRate = %v, want 0.10", r.PlatformFeeRate)
	}
	if r.PlatformFee != 9 {
		t.Errorf("PlatformFee = %v, want 9", r.PlatformFee)
	}
	if r.ConsultantEarnings != 81 {
		t.Errorf("ConsultantEarnings = %v, want 81", r.ConsultantEarnings)
	}
}

func TestCalculatePrice_UnknownRegionUsesDefault(t *testing.T) {
	e := NewEngine()
	r := e.CalculatePrice(100, "hourly", "XX-UNKNOWN", 0)

	if r.TaxRate != 0 {
		t.Errorf("TaxRate = %v, want default 0", r.TaxRate)
	}
	if r.TaxAmount != 0 {
		t.Errorf("TaxAmount = %v, want 0", r.TaxAmount)
	}
}

func TestCalculateHourlyPrice(t *testing.T) {
	e := NewEngine()
	// $60/hour for 90 minutes = $90 base
	r := e.CalculateHourlyPrice(60, 90, "US", 0)

	if r.BaseAmount != 90 {
		t.Errorf("BaseAmount = %v, want 90", r.BaseAmount)
	}
	if r.PlatformFee != 13.5 {
		t.Errorf("PlatformFee = %v, want 13.5", r.PlatformFee)
	}
	if r.ConsultantEarnings != 76.5 {
		t.Errorf("ConsultantEarnings = %v, want 76.5", r.ConsultantEarnings)
	}
}

func TestCalculateHourlyPrice_30Minutes(t *testing.T) {
	e := NewEngine()
	// $100/hour for 30 minutes = $50 base
	r := e.CalculateHourlyPrice(100, 30, "US", 0)

	if r.BaseAmount != 50 {
		t.Errorf("BaseAmount = %v, want 50", r.BaseAmount)
	}
}

func TestCalculateSubscriptionPrice(t *testing.T) {
	e := NewEngine()
	r := e.CalculateSubscriptionPrice(50, "US", 0)

	if r.BaseAmount != 50 {
		t.Errorf("BaseAmount = %v, want 50", r.BaseAmount)
	}
	if r.PlatformFeeRate != 0.10 {
		t.Errorf("PlatformFeeRate = %v, want 0.10", r.PlatformFeeRate)
	}
	if r.PlatformFee != 5 {
		t.Errorf("PlatformFee = %v, want 5", r.PlatformFee)
	}
}

func TestCalculateRefund_NotStarted(t *testing.T) {
	e := NewEngine()
	r := e.CalculateRefund(100, false, 0)

	if !r.Refundable {
		t.Error("Refundable = false, want true")
	}
	if r.RefundPercentage != 1.0 {
		t.Errorf("RefundPercentage = %v, want 1.0", r.RefundPercentage)
	}
	if r.RefundAmount != 100 {
		t.Errorf("RefundAmount = %v, want 100", r.RefundAmount)
	}
	if r.PlatformRefund != 15 {
		t.Errorf("PlatformRefund = %v, want 15", r.PlatformRefund)
	}
	if r.ConsultantRefund != 85 {
		t.Errorf("ConsultantRefund = %v, want 85", r.ConsultantRefund)
	}
}

func TestCalculateRefund_StartedBelow25Percent(t *testing.T) {
	e := NewEngine()
	r := e.CalculateRefund(100, true, 0.10)

	if !r.Refundable {
		t.Error("Refundable = false, want true")
	}
	if r.RefundPercentage != 0.75 {
		t.Errorf("RefundPercentage = %v, want 0.75", r.RefundPercentage)
	}
	if r.RefundAmount != 75 {
		t.Errorf("RefundAmount = %v, want 75", r.RefundAmount)
	}
}

func TestCalculateRefund_HalfCompleted(t *testing.T) {
	e := NewEngine()
	r := e.CalculateRefund(100, true, 0.40)

	if r.RefundPercentage != 0.50 {
		t.Errorf("RefundPercentage = %v, want 0.50", r.RefundPercentage)
	}
	if r.RefundAmount != 50 {
		t.Errorf("RefundAmount = %v, want 50", r.RefundAmount)
	}
}

func TestCalculateRefund_75PercentCompleted(t *testing.T) {
	e := NewEngine()
	r := e.CalculateRefund(100, true, 0.60)

	if r.RefundPercentage != 0.25 {
		t.Errorf("RefundPercentage = %v, want 0.25", r.RefundPercentage)
	}
	if r.RefundAmount != 25 {
		t.Errorf("RefundAmount = %v, want 25", r.RefundAmount)
	}
}

func TestCalculateRefund_NearlyComplete_NotRefundable(t *testing.T) {
	e := NewEngine()
	r := e.CalculateRefund(100, true, 0.90)

	if r.Refundable {
		t.Error("Refundable = true, want false")
	}
	if r.RefundPercentage != 0 {
		t.Errorf("RefundPercentage = %v, want 0", r.RefundPercentage)
	}
	if r.RefundAmount != 0 {
		t.Errorf("RefundAmount = %v, want 0", r.RefundAmount)
	}
}

func TestCalculatePayout_BankTransfer(t *testing.T) {
	e := NewEngine()
	r := e.CalculatePayout(100, "bank_transfer")

	if r.ProcessingFee != 2.50 {
		t.Errorf("ProcessingFee = %v, want 2.50", r.ProcessingFee)
	}
	if r.NetPayoutAmount != 97.50 {
		t.Errorf("NetPayoutAmount = %v, want 97.50", r.NetPayoutAmount)
	}
}

func TestCalculatePayout_PayPal(t *testing.T) {
	e := NewEngine()
	r := e.CalculatePayout(100, "paypal")

	if r.ProcessingFee != 2 {
		t.Errorf("ProcessingFee = %v, want 2", r.ProcessingFee)
	}
	if r.NetPayoutAmount != 98 {
		t.Errorf("NetPayoutAmount = %v, want 98", r.NetPayoutAmount)
	}
}

func TestCalculatePayout_Stripe(t *testing.T) {
	e := NewEngine()
	r := e.CalculatePayout(100, "stripe")

	if r.ProcessingFee != 1 {
		t.Errorf("ProcessingFee = %v, want 1", r.ProcessingFee)
	}
	if r.NetPayoutAmount != 99 {
		t.Errorf("NetPayoutAmount = %v, want 99", r.NetPayoutAmount)
	}
}

func TestCalculatePayout_UnknownMethod_NoFee(t *testing.T) {
	e := NewEngine()
	r := e.CalculatePayout(100, "unknown")

	if r.ProcessingFee != 0 {
		t.Errorf("ProcessingFee = %v, want 0", r.ProcessingFee)
	}
	if r.NetPayoutAmount != 100 {
		t.Errorf("NetPayoutAmount = %v, want 100", r.NetPayoutAmount)
	}
}

func TestRound2(t *testing.T) {
	cases := []struct {
		in   float64
		want float64
	}{
		{1.234, 1.23},
		{1.235, 1.24},
		{1.5, 1.5},
		{2.345, 2.35},
		{0, 0},
	}
	for _, c := range cases {
		got := Round2(c.in)
		if math.Abs(got-c.want) > 1e-9 {
			t.Errorf("Round2(%v) = %v, want %v", c.in, got, c.want)
		}
	}
}

func TestPlatformFeeRates(t *testing.T) {
	want := map[string]float64{
		"hourly":       0.15,
		"flat":         0.12,
		"subscription": 0.10,
		"hybrid":       0.12,
	}
	for k, v := range want {
		if got := PlatformFeeRates[k]; got != v {
			t.Errorf("PlatformFeeRates[%q] = %v, want %v", k, got, v)
		}
	}
}

func TestTaxRates(t *testing.T) {
	want := map[string]float64{
		"US":    0.0,
		"US-CA": 0.0725,
		"US-NY": 0.08,
		"EU":    0.20,
		"UK":    0.20,
		"IN":    0.18,
	}
	for k, v := range want {
		if got := TaxRates[k]; got != v {
			t.Errorf("TaxRates[%q] = %v, want %v", k, got, v)
		}
	}
}
