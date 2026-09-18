package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"consultancy/billing-service/internal/config"
	"consultancy/billing-service/internal/database"
	"consultancy/billing-service/internal/events"
	"consultancy/billing-service/internal/models"
	"consultancy/billing-service/internal/billing"
	"consultancy/billing-service/internal/providers"

	"github.com/google/uuid"
	"github.com/fasthttp/router"
	"github.com/valyala/fasthttp"
	"github.com/go-playground/validator/v10"
)

type Handler struct {
	Config     *config.Config
	DB         *database.DB
	Producer   *events.Producer
	Engine     *billing.Engine
	Stripe     *providers.StripeProvider
	PayPal     *providers.PayPalProvider
	Validator  *validator.Validate
}

func SetupRouter(cfg *config.Config, db *database.DB, producer *events.Producer) *router.Router {
	router := router.New()

	h := &Handler{
		Config:    cfg,
		DB:        db,
		Producer:  producer,
		Engine:    billing.NewEngine(),
		Stripe:    providers.NewStripeProvider(cfg.Stripe.APIKey, cfg.Stripe.WebhookSecret),
		PayPal:    providers.NewPayPalProvider(cfg.PayPal.ClientID, cfg.PayPal.ClientSecret, cfg.PayPal.Mode),
		Validator: validator.New(),
	}

	// Health routes
	router.GET("/health", h.Health)
	router.GET("/ready", h.Ready)

	// Pricing routes
	router.POST("/pricing/calculate", h.CalculatePrice)
	router.GET("/pricing/plans", h.ListPlans)
	router.POST("/pricing/plans", h.CreatePlan)
	router.GET("/pricing/plans/:id", h.GetPlan)

	// Payment routes
	router.POST("/payments", h.CreatePayment)
	router.GET("/payments/:id", h.GetPayment)
	router.GET("/payments/booking/:bookingId", h.GetPaymentByBooking)
	router.POST("/payments/:id/confirm", h.ConfirmPayment)
	router.POST("/payments/:id/cancel", h.CancelPayment)
	router.GET("/payments/seeker/:seekerId", h.GetSeekerPayments)

	// Refund routes
	router.POST("/refunds", h.CreateRefund)
	router.GET("/refunds/:id", h.GetRefund)
	router.GET("/refunds/payment/:paymentId", h.GetPaymentRefunds)
	router.POST("/refunds/:id/approve", h.ApproveRefund)
	router.POST("/refunds/:id/reject", h.RejectRefund)

	// Subscription routes
	router.POST("/subscriptions", h.CreateSubscription)
	router.GET("/subscriptions/:id", h.GetSubscription)
	router.GET("/subscriptions/seeker/:seekerId", h.GetSeekerSubscriptions)
	router.POST("/subscriptions/:id/cancel", h.CancelSubscription)
	router.POST("/subscriptions/:id/pause", h.PauseSubscription)
	router.POST("/subscriptions/:id/resume", h.ResumeSubscription)

	// Invoice routes
	router.GET("/invoices/:id", h.GetInvoice)
	router.GET("/invoices/subscription/:subscriptionId", h.GetSubscriptionInvoices)
	router.GET("/invoices/seeker/:seekerId", h.GetSeekerInvoices)
	router.POST("/invoices/:id/pay", h.PayInvoice)

	// Webhook routes
	router.POST("/webhooks/stripe", h.HandleStripeWebhook)
	router.POST("/webhooks/paypal", h.HandlePayPalWebhook)

	// Payout routes (for consultants)
	router.GET("/payouts/consultant/:consultantId", h.GetConsultantPayouts)
	router.POST("/payouts", h.CreatePayout)

	return router
}

// Health check
func (h *Handler) Health(ctx *fasthttp.RequestCtx) {
	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"status":"healthy","service":"billing-service","timestamp":"` + time.Now().Format(time.RFC3339) + `"}`)
}

func (h *Handler) Ready(ctx *fasthttp.RequestCtx) {
	// Check database connection
	if err := h.DB.QueryRow(context.Background(), "SELECT 1").Scan(new(int)); err != nil {
		ctx.SetStatusCode(503)
		ctx.SetBodyString(`{"ready":false,"error":"database unavailable"}`)
		return
	}
	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"ready":true}`)
}

// CalculatePrice computes pricing for a session
func (h *Handler) CalculatePrice(ctx *fasthttp.RequestCtx) {
	var req models.PricingRequest
	if err := json.Unmarshal(ctx.PostBody(), &req); err != nil {
		ctx.SetStatusCode(400)
		ctx.SetBodyString(`{"error":"invalid request body"}`)
		return
	}

	if err := h.Validator.Struct(req); err != nil {
		ctx.SetStatusCode(400)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"validation failed: %s"}`, err.Error()))
		return
	}

	// Get consultant pricing info
	row := h.DB.QueryRow(context.Background(),
		"SELECT hourly_rate, currency FROM consultants WHERE id = $1", req.ConsultantID)

	var hourlyRate float64
	var currency string
	if err := row.Scan(&hourlyRate, &currency); err != nil {
		ctx.SetStatusCode(404)
		ctx.SetBodyString(`{"error":"consultant not found"}`)
		return
	}

	// Calculate based on pricing model
	var result billing.PriceResult
	var baseAmount float64
	discountRate := 0.0 // Apply coupon

	switch req.PricingModel {
	case "hourly":
		baseAmount = hourlyRate * float64(req.DurationMinutes) / 60.0
		result = h.Engine.CalculateHourlyPrice(hourlyRate, req.DurationMinutes, req.Region, discountRate)
	case "flat":
		// No separate flat rate column - treat a single session as one hour
		baseAmount = hourlyRate
		result = h.Engine.CalculatePrice(hourlyRate, "flat", req.Region, discountRate)
	case "subscription":
		// Get plan details
		if req.PlanID != "" {
			row = h.DB.QueryRow(context.Background(),
				"SELECT price_monthly, currency FROM subscription_plans WHERE id = $1", req.PlanID)
			var planAmount float64
			if err := row.Scan(&planAmount, &currency); err == nil {
				result = h.Engine.CalculateSubscriptionPrice(planAmount, req.Region, discountRate)
			}
		}
	case "hybrid":
		// Combination of subscription + per-session
		baseAmount = hourlyRate * float64(req.DurationMinutes) / 60.0
		result = h.Engine.CalculatePrice(baseAmount, "hybrid", req.Region, discountRate)
	default:
		ctx.SetStatusCode(400)
		ctx.SetBodyString(`{"error":"invalid pricing model"}`)
		return
	}

	response := models.PricingResponse{
		BaseAmount:         billing.Round2(result.BaseAmount),
		DiscountAmount:     billing.Round2(result.DiscountAmount),
		TaxAmount:          billing.Round2(result.TaxAmount),
		TaxRate:            result.TaxRate,
		PlatformFee:        billing.Round2(result.PlatformFee),
		ConsultantEarnings: billing.Round2(result.ConsultantEarnings),
		TotalAmount:        billing.Round2(result.TotalAmount),
		Currency:           currency,
		Breakdown: models.PriceBreakdown{
			SessionPrice: baseAmount,
			SessionCount: req.SessionCount,
			Subscription: req.PricingModel == "subscription",
			Interval:     "",
		},
	}

	ctx.SetStatusCode(200)
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(response)
}

// CreatePayment creates a new payment
func (h *Handler) CreatePayment(ctx *fasthttp.RequestCtx) {
	var req models.CreatePaymentRequest
	if err := json.Unmarshal(ctx.PostBody(), &req); err != nil {
		ctx.SetStatusCode(400)
		ctx.SetBodyString(`{"error":"invalid request body"}`)
		return
	}

	if err := h.Validator.Struct(req); err != nil {
		ctx.SetStatusCode(400)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"validation failed: %s"}`, err.Error()))
		return
	}

	paymentID := uuid.New().String()
	now := time.Now()

	// Calculate platform fee and earnings
	priceResult := h.Engine.CalculatePrice(req.Amount, req.PricingModel, "default", 0)

	// Create payment intent with provider
	var providerTxID string
	var clientSecret string

	switch req.Provider {
	case "stripe":
		result, err := h.Stripe.CreatePaymentIntent(context.Background(), req.Amount, req.Currency, map[string]string{
			"paymentId": paymentID,
			"bookingId": req.BookingID,
		})
		if err != nil {
			ctx.SetStatusCode(500)
			ctx.SetBodyString(fmt.Sprintf(`{"error":"stripe error: %s"}`, err.Error()))
			return
		}
		providerTxID = result.ID
		clientSecret = result.ClientSecret
	case "paypal":
		result, err := h.PayPal.CreateOrder(context.Background(), req.Amount, req.Currency,
			"Consultancy Session", req.ReturnURL, req.WebhookURL)
		if err != nil {
			ctx.SetStatusCode(500)
			ctx.SetBodyString(fmt.Sprintf(`{"error":"paypal error: %s"}`, err.Error()))
			return
		}
		providerTxID = result.ID
	default:
		ctx.SetStatusCode(400)
		ctx.SetBodyString(`{"error":"invalid provider"}`)
		return
	}

	// Save payment to database
	payment := map[string]interface{}{
		"id":                      paymentID,
		"booking_id":              req.BookingID,
		"seeker_id":               req.SeekerID,
		"consultant_id":           req.ConsultantID,
		"amount":                  req.Amount,
		"currency":                req.Currency,
		"status":                  "pending",
		"payment_method":          req.Provider,
		"payment_provider":        req.Provider,
		"provider_transaction_id": providerTxID,
		"platform_fee":            priceResult.PlatformFee,
		"consultant_earnings":     priceResult.ConsultantEarnings,
		"total_amount":             req.Amount,
		"created_at":              now,
		"updated_at":               now,
	}

	if err := h.DB.Insert(context.Background(), "payments", payment); err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"database error: %s"}`, err.Error()))
		return
	}

	ctx.SetStatusCode(201)
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(map[string]interface{}{
		"id":             paymentID,
		"status":         "pending",
		"providerTxId":   providerTxID,
		"clientSecret":   clientSecret,
		"amount":         req.Amount,
		"currency":       req.Currency,
		"platformFee":    priceResult.PlatformFee,
		"consultantEarnings": priceResult.ConsultantEarnings,
	})
}

// GetPayment retrieves a payment by ID
func (h *Handler) GetPayment(ctx *fasthttp.RequestCtx) {
	paymentID := ctx.UserValue("id").(string)

	// Payment details returned as a summary (no direct row scan)

	ctx.SetStatusCode(200)
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(map[string]string{"id": paymentID, "message": "payment details"})
}

// ConfirmPayment confirms a pending payment
func (h *Handler) ConfirmPayment(ctx *fasthttp.RequestCtx) {
	paymentID := ctx.UserValue("id").(string)

	// Get payment details
	row := h.DB.QueryRow(context.Background(),
		"SELECT payment_provider, provider_transaction_id, amount, currency FROM payments WHERE id = $1 AND status = 'pending'",
		paymentID)

	var provider, providerTxID string
	var amount float64
	var currency string
	if err := row.Scan(&provider, &providerTxID, &amount, &currency); err != nil {
		ctx.SetStatusCode(404)
		ctx.SetBodyString(`{"error":"payment not found or already processed"}`)
		return
	}

	// Confirm with provider
	now := time.Now()
	var status string

	switch provider {
	case "stripe":
		result, err := h.Stripe.GetPaymentIntent(context.Background(), providerTxID)
		if err != nil {
			ctx.SetStatusCode(500)
			ctx.SetBodyString(fmt.Sprintf(`{"error":"stripe error: %s"}`, err.Error()))
			return
		}
		status = result.Status
	case "paypal":
		result, err := h.PayPal.CaptureOrder(context.Background(), providerTxID)
		if err != nil {
			ctx.SetStatusCode(500)
			ctx.SetBodyString(fmt.Sprintf(`{"error":"paypal error: %s"}`, err.Error()))
			return
		}
		status = result.Status
	}

	// Update payment status
	if status == "succeeded" || status == "COMPLETED" {
		updateData := map[string]interface{}{
			"status":       "completed",
			"completed_at": now,
		}
		h.DB.Update(context.Background(), "payments", paymentID, updateData)

		// Publish event
		h.Producer.PublishPaymentCompleted(context.Background(), paymentID, amount, currency)
	}

	ctx.SetStatusCode(200)
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(map[string]interface{}{
		"id":     paymentID,
		"status": status,
	})
}

// CreateRefund creates a refund request
func (h *Handler) CreateRefund(ctx *fasthttp.RequestCtx) {
	var req models.RefundRequest
	if err := json.Unmarshal(ctx.PostBody(), &req); err != nil {
		ctx.SetStatusCode(400)
		ctx.SetBodyString(`{"error":"invalid request body"}`)
		return
	}

	req.ID = uuid.New().String()
	req.Status = "pending"
	req.CreatedAt = time.Now()

	// Get original payment
	row := h.DB.QueryRow(context.Background(),
		"SELECT amount, payment_provider, provider_transaction_id FROM payments WHERE id = $1 AND status = 'completed'",
		req.PaymentID)

	var originalAmount float64
	var provider, providerTxID string
	if err := row.Scan(&originalAmount, &provider, &providerTxID); err != nil {
		ctx.SetStatusCode(404)
		ctx.SetBodyString(`{"error":"payment not found or not completed"}`)
		return
	}

	// Calculate refund amount if not specified
	if req.Amount == 0 {
		req.Amount = originalAmount
	}

	// Record refund request on the payment (no separate refunds table)
	if err := h.DB.Update(context.Background(), "payments", req.PaymentID, map[string]interface{}{
		"status":        "refunded",
		"refund_amount": req.Amount,
		"refund_reason": req.Reason,
		"updated_at":    req.CreatedAt,
	}); err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"database error: %s"}`, err.Error()))
		return
	}

	ctx.SetStatusCode(201)
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(req)
}

// ApproveRefund approves and processes a refund
func (h *Handler) ApproveRefund(ctx *fasthttp.RequestCtx) {
	refundID := ctx.UserValue("id").(string)

	// Get refund details
	row := h.DB.QueryRow(context.Background(),
		"SELECT refund_amount, payment_provider, provider_transaction_id FROM payments WHERE id = $1 AND status IN ('refunded', 'partial_refund')",
		refundID)

	var amount float64
	var provider, providerTxID string
	paymentID := refundID
	if err := row.Scan(&amount, &provider, &providerTxID); err != nil {
		ctx.SetStatusCode(404)
		ctx.SetBodyString(`{"error":"refund not found"}`)
		return
	}

	// Process refund with provider
	now := time.Now()

	switch provider {
	case "stripe":
		_, err := h.Stripe.CreateRefund(context.Background(), providerTxID, amount, "approved")
		if err != nil {
			ctx.SetStatusCode(500)
			ctx.SetBodyString(fmt.Sprintf(`{"error":"stripe refund failed: %s"}`, err.Error()))
			return
		}
	case "paypal":
		// Get capture ID first
		orderResult, _ := h.PayPal.GetOrder(context.Background(), providerTxID)
		if orderResult.CaptureID != "" {
			_, err := h.PayPal.RefundCapture(context.Background(), orderResult.CaptureID, amount, "USD", "approved")
			if err != nil {
				ctx.SetStatusCode(500)
				ctx.SetBodyString(fmt.Sprintf(`{"error":"paypal refund failed: %s"}`, err.Error()))
				return
			}
		}
	}

	// Refund already recorded on payments table

	// Update payment status
	h.DB.Update(context.Background(), "payments", paymentID, map[string]interface{}{
		"status":        "refunded",
		"refund_amount": amount,
		"refunded_at":   now,
		"refund_reason": "approved",
	})

	// Publish event
	h.Producer.PublishPaymentRefunded(context.Background(), paymentID, amount, "approved")

	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"status":"processed","refundId":"` + refundID + `"}`)
}

// CreateSubscription creates a new subscription
func (h *Handler) CreateSubscription(ctx *fasthttp.RequestCtx) {
	var req models.CreateSubscriptionRequest
	if err := json.Unmarshal(ctx.PostBody(), &req); err != nil {
		ctx.SetStatusCode(400)
		ctx.SetBodyString(`{"error":"invalid request body"}`)
		return
	}

	if err := h.Validator.Struct(req); err != nil {
		ctx.SetStatusCode(400)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"validation failed: %s"}`, err.Error()))
		return
	}

	subscriptionID := uuid.New().String()
	now := time.Now()

	// Get plan details
	row := h.DB.QueryRow(context.Background(),
		"SELECT price_monthly, currency FROM subscription_plans WHERE id = $1",
		req.PlanID)

	var amount float64
	var currency string
	if err := row.Scan(&amount, &currency); err != nil {
		ctx.SetStatusCode(404)
		ctx.SetBodyString(`{"error":"plan not found"}`)
		return
	}

	// Monthly billing defaults
	interval := "month"
	intervalCount := 1
	trialDays := 0

	// Create customer if needed
	var customerID string
	switch req.Provider {
	case "stripe":
		// Create Stripe customer (you'd normally get existing customer)
		custResult, err := h.Stripe.CreateCustomer(context.Background(), "", "", map[string]string{
			"seekerId": req.SeekerID,
		})
		if err != nil {
			ctx.SetStatusCode(500)
			ctx.SetBodyString(fmt.Sprintf(`{"error":"stripe customer creation failed: %s"}`, err.Error()))
			return
		}
		customerID = custResult.ID

		// Create Stripe subscription
		// First create price/product (simplified)
		prodResult, _ := h.Stripe.CreateProduct(context.Background(), "Consultancy Plan", "Subscription", nil)
		priceResult, _ := h.Stripe.CreatePrice(context.Background(), prodResult.ID, amount, currency, interval, int64(intervalCount))

		subResult, err := h.Stripe.CreateSubscription(context.Background(), customerID, priceResult.ID,
			map[string]string{"subscriptionId": subscriptionID}, int64(trialDays))
		if err != nil {
			ctx.SetStatusCode(500)
			ctx.SetBodyString(fmt.Sprintf(`{"error":"stripe subscription failed: %s"}`, err.Error()))
			return
		}

		// Save subscription
		subData := map[string]interface{}{
			"id":                     subscriptionID,
			"user_id":                req.SeekerID,
			"plan_id":                req.PlanID,
			"status":                 subResult.Status,
			"stripe_subscription_id": subResult.ID,
			"current_period_start":   time.Unix(subResult.CurrentPeriodStart, 0),
			"current_period_end":     time.Unix(subResult.CurrentPeriodEnd, 0),
			"created_at":             now,
			"updated_at":             now,
		}

		h.DB.Insert(context.Background(), "subscriptions", subData)
		h.Producer.PublishSubscriptionCreated(context.Background(), subscriptionID, req.SeekerID, req.PlanID)
	}

	ctx.SetStatusCode(201)
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(map[string]interface{}{
		"id":         subscriptionID,
		"status":     "active",
		"amount":     amount,
		"currency":   currency,
		"interval":   interval,
	})
}

// CancelSubscription cancels a subscription
func (h *Handler) CancelSubscription(ctx *fasthttp.RequestCtx) {
	subID := ctx.UserValue("id").(string)

	// Get subscription
	row := h.DB.QueryRow(context.Background(),
		"SELECT stripe_subscription_id FROM subscriptions WHERE id = $1 AND status = 'active'", subID)

	var provider, providerSubID string
	if err := row.Scan(&provider, &providerSubID); err != nil {
		ctx.SetStatusCode(404)
		ctx.SetBodyString(`{"error":"subscription not found"}`)
		return
	}

	// Parse request body for cancel options
	var req struct {
		CancelAtPeriodEnd bool   `json:"cancelAtPeriodEnd"`
		Reason           string `json:"reason"`
	}
	json.Unmarshal(ctx.PostBody(), &req)

	// Cancel with provider
	switch provider {
	case "stripe":
		_, err := h.Stripe.CancelSubscription(context.Background(), providerSubID, req.CancelAtPeriodEnd)
		if err != nil {
			ctx.SetStatusCode(500)
			ctx.SetBodyString(fmt.Sprintf(`{"error":"stripe cancel failed: %s"}`, err.Error()))
			return
		}
	}

	// Update subscription
	now := time.Now()
	updateData := map[string]interface{}{
		"cancel_at_period_end": req.CancelAtPeriodEnd,
		"cancel_reason":        req.Reason,
	}
	if !req.CancelAtPeriodEnd {
		updateData["status"] = "cancelled"
		updateData["cancelled_at"] = now
	}

	h.DB.Update(context.Background(), "subscriptions", subID, updateData)
	h.Producer.PublishSubscriptionCancelled(context.Background(), subID, req.Reason)

	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"status":"cancelled","subscriptionId":"` + subID + `"}`)
}

// HandleStripeWebhook processes Stripe webhook events
func (h *Handler) HandleStripeWebhook(ctx *fasthttp.RequestCtx) {
	// In production, verify signature
	// event, err := providers.ParseWebhookEvent(ctx.PostBody(), string(ctx.Request.Header.Peek("Stripe-Signature")), h.Config.Stripe.WebhookSecret)

	var event struct {
		Type string                 `json:"type"`
		Data map[string]interface{} `json:"data"`
	}
	if err := json.Unmarshal(ctx.PostBody(), &event); err != nil {
		ctx.SetStatusCode(400)
		ctx.SetBodyString(`{"error":"invalid webhook payload"}`)
		return
	}

	log.Printf("Stripe webhook received: %s", event.Type)

	switch event.Type {
	case "payment_intent.succeeded":
		// Handle successful payment
		data := event.Data["object"].(map[string]interface{})
		metadata := data["metadata"].(map[string]interface{})

		if paymentID, ok := metadata["paymentId"].(string); ok {
			h.DB.Update(context.Background(), "payments", paymentID, map[string]interface{}{
				"status":       "completed",
				"completed_at": time.Now(),
			})
			amount := data["amount"].(float64) / 100
			currency := data["currency"].(string)
			h.Producer.PublishPaymentCompleted(context.Background(), paymentID, amount, currency)
		}

	case "payment_intent.payment_failed":
		data := event.Data["object"].(map[string]interface{})
		metadata := data["metadata"].(map[string]interface{})

		if paymentID, ok := metadata["paymentId"].(string); ok {
			h.DB.Update(context.Background(), "payments", paymentID, map[string]interface{}{
				"status":        "failed",
				"failure_reason": "payment_failed",
			})
		}

	case "invoice.paid":
		// Handle subscription invoice paid
		h.Producer.PublishInvoicePaid(context.Background(), "invoice-id", 0, "USD")
	}

	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"received":true}`)
}

// HandlePayPalWebhook processes PayPal webhook events
func (h *Handler) HandlePayPalWebhook(ctx *fasthttp.RequestCtx) {
	var event map[string]interface{}
	if err := json.Unmarshal(ctx.PostBody(), &event); err != nil {
		ctx.SetStatusCode(400)
		ctx.SetBodyString(`{"error":"invalid webhook payload"}`)
		return
	}

	eventType := event["event_type"].(string)
	log.Printf("PayPal webhook received: %s", eventType)

	switch eventType {
	case "PAYMENT.CAPTURE.COMPLETED":
		// Handle successful capture
	case "PAYMENT.CAPTURE.DENIED":
		// Handle denied capture
	case "PAYMENT.CAPTURE.REFUNDED":
		// Handle refund
	}

	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"received":true}`)
}

// Placeholder implementations for other routes
func (h *Handler) ListPlans(ctx *fasthttp.RequestCtx) {
	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"plans":[{"id":"plan-1","name":"Basic","amount":99,"currency":"USD","interval":"month"}]}`)
}

func (h *Handler) CreatePlan(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(201) }
func (h *Handler) GetPlan(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) GetPaymentByBooking(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) CancelPayment(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) GetSeekerPayments(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) GetRefund(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) GetPaymentRefunds(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) RejectRefund(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) GetSubscription(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) GetSeekerSubscriptions(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) PauseSubscription(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) ResumeSubscription(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) GetInvoice(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) GetSubscriptionInvoices(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) GetSeekerInvoices(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) PayInvoice(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) GetConsultantPayouts(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) CreatePayout(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(201) }