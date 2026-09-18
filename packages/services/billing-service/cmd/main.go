// Billing Service - Payment and subscription management
// Handles: pricing, payments, subscriptions, payouts

package main

import (
	"log"
	"os"

	"consultancy/billing-service/internal/routes"
	"consultancy/billing-service/internal/config"
	"consultancy/billing-service/internal/database"
	"consultancy/billing-service/internal/events"

	"github.com/valyala/fasthttp"
)

func main() {
	// Load configuration
	cfg, err := config.Load("config.yaml")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Override with environment variables
	if apiKey := os.Getenv("STRIPE_API_KEY"); apiKey != "" {
		cfg.Stripe.APIKey = apiKey
	}
	if webhookSecret := os.Getenv("STRIPE_WEBHOOK_SECRET"); webhookSecret != "" {
		cfg.Stripe.WebhookSecret = webhookSecret
	}
	if clientID := os.Getenv("PAYPAL_CLIENT_ID"); clientID != "" {
		cfg.PayPal.ClientID = clientID
	}
	if clientSecret := os.Getenv("PAYPAL_CLIENT_SECRET"); clientSecret != "" {
		cfg.PayPal.ClientSecret = clientSecret
	}

	// Initialize database
	db, err := database.New(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize Kafka producer
	producer := events.NewProducer(cfg.Kafka)
	defer producer.Close()

	// Setup router
	router := routes.SetupRouter(cfg, db, producer)

	// Start server
	addr := cfg.Server.Host + ":" + cfg.Server.Port
	log.Printf("Billing Service starting on %s", addr)

	if err := fasthttp.ListenAndServe(addr, router.Handler); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}