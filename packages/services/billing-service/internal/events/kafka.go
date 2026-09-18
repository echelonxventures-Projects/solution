package events

import (
	"context"
	"encoding/json"
	"log"

	"consultancy/billing-service/internal/config"

	"github.com/segmentio/kafka-go"
)

type Producer struct {
	writer *kafka.Writer
	config config.KafkaConfig
}

func NewProducer(cfg config.KafkaConfig) *Producer {
	writer := &kafka.Writer{
		Addr:     kafka.TCP(cfg.Brokers...),
		Topic:    cfg.TopicPrefix + "-billing-events",
		Balancer: &kafka.LeastBytes{},
	}

	return &Producer{writer: writer, config: cfg}
}

func (p *Producer) Close() error {
	return p.writer.Close()
}

type BillingEvent struct {
	EventType string      `json:"eventType"`
	Data      interface{} `json:"data"`
	Source    string      `json:"source"`
	Timestamp string      `json:"timestamp"`
}

func (p *Producer) PublishPaymentCompleted(ctx context.Context, paymentID string, amount float64, currency string) error {
	event := BillingEvent{
		EventType: "payment.completed",
		Data: map[string]interface{}{
			"paymentId": paymentID,
			"amount":    amount,
			"currency":  currency,
		},
		Source:    "billing-service",
		Timestamp: "now",
	}
	return p.publish(ctx, event)
}

func (p *Producer) PublishPaymentFailed(ctx context.Context, paymentID string, reason string) error {
	event := BillingEvent{
		EventType: "payment.failed",
		Data: map[string]interface{}{
			"paymentId":     paymentID,
			"failureReason": reason,
		},
		Source:    "billing-service",
		Timestamp: "now",
	}
	return p.publish(ctx, event)
}

func (p *Producer) PublishPaymentRefunded(ctx context.Context, paymentID string, amount float64, reason string) error {
	event := BillingEvent{
		EventType: "payment.refunded",
		Data: map[string]interface{}{
			"paymentId":    paymentID,
			"refundAmount": amount,
			"reason":       reason,
		},
		Source:    "billing-service",
		Timestamp: "now",
	}
	return p.publish(ctx, event)
}

func (p *Producer) PublishSubscriptionCreated(ctx context.Context, subscriptionID string, seekerID string, planID string) error {
	event := BillingEvent{
		EventType: "subscription.created",
		Data: map[string]interface{}{
			"subscriptionId": subscriptionID,
			"seekerId":       seekerID,
			"planId":         planID,
		},
		Source:    "billing-service",
		Timestamp: "now",
	}
	return p.publish(ctx, event)
}

func (p *Producer) PublishSubscriptionCancelled(ctx context.Context, subscriptionID string, reason string) error {
	event := BillingEvent{
		EventType: "subscription.cancelled",
		Data: map[string]interface{}{
			"subscriptionId": subscriptionID,
			"cancelReason":   reason,
		},
		Source:    "billing-service",
		Timestamp: "now",
	}
	return p.publish(ctx, event)
}

func (p *Producer) PublishInvoicePaid(ctx context.Context, invoiceID string, amount float64, currency string) error {
	event := BillingEvent{
		EventType: "invoice.paid",
		Data: map[string]interface{}{
			"invoiceId": invoiceID,
			"amount":    amount,
			"currency":  currency,
		},
		Source:    "billing-service",
		Timestamp: "now",
	}
	return p.publish(ctx, event)
}

func (p *Producer) publish(ctx context.Context, event BillingEvent) error {
	data, err := json.Marshal(event)
	if err != nil {
		return err
	}

	msg := kafka.Message{
		Key:   []byte(event.EventType),
		Value: data,
	}

	if err := p.writer.WriteMessages(ctx, msg); err != nil {
		log.Printf("Failed to publish event: %v", err)
		return err
	}

	log.Printf("Published event: %s", event.EventType)
	return nil
}

// Get topic names for specific event categories
func (p *Producer) GetPaymentTopic() string {
	return p.config.TopicPrefix + "-payment-events"
}

func (p *Producer) GetSubscriptionTopic() string {
	return p.config.TopicPrefix + "-subscription-events"
}