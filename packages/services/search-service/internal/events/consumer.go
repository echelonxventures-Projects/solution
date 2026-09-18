package events

import (
	"context"
	"encoding/json"
	"log"

	"consultancy/search-service/internal/config"
	"consultancy/search-service/internal/elasticsearch"
	"consultancy/search-service/internal/models"

	"github.com/segmentio/kafka-go"
)

type Consumer struct {
	reader  *kafka.Reader
	config  config.KafkaConfig
	es      *elasticsearch.Client
}

func NewConsumer(cfg config.KafkaConfig) *Consumer {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  cfg.Brokers,
		Topic:    cfg.TopicPrefix + "-search-events",
		GroupID:  "search-service",
		MinBytes: 1e3,
		MaxBytes: 10e6,
	})

	return &Consumer{
		reader: reader,
		config: cfg,
	}
}

func (c *Consumer) Close() error {
	return c.reader.Close()
}

// StartIndexer starts consuming events for indexing
func (c *Consumer) StartIndexer(es *elasticsearch.Client) {
	c.es = es

	for {
		msg, err := c.reader.ReadMessage(context.Background())
		if err != nil {
			log.Printf("Failed to read message: %v", err)
			continue
		}

		// Parse event
		var event SearchEvent
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			log.Printf("Failed to parse event: %v", err)
			continue
		}

		// Handle event
		c.handleEvent(event)
	}
}

type SearchEvent struct {
	EventType string                 `json:"eventType"`
	Data      map[string]interface{} `json:"data"`
	Source    string                 `json:"source"`
	Timestamp string                 `json:"timestamp"`
}

func (c *Consumer) handleEvent(event SearchEvent) {
	ctx := context.Background()

	switch event.EventType {
	case "consultant.created":
		c.indexConsultant(ctx, event.Data)

	case "consultant.updated":
		c.indexConsultant(ctx, event.Data)

	case "consultant.deleted":
		if id, ok := event.Data["id"].(string); ok {
			c.es.DeleteDocument(ctx, id, "consultants")
		}

	case "content.created":
		c.indexContent(ctx, event.Data)

	case "content.updated":
		c.indexContent(ctx, event.Data)

	case "content.deleted":
		if id, ok := event.Data["id"].(string); ok {
			c.es.DeleteDocument(ctx, id, "content")
		}

	default:
		log.Printf("Unhandled event type: %s", event.EventType)
	}
}

func (c *Consumer) indexConsultant(ctx context.Context, data map[string]interface{}) {
	doc := models.ConsultantDocument{
		ID:          data["id"].(string),
		Name:        getString(data, "name"),
		Title:       getString(data, "title"),
		Bio:         getString(data, "bio"),
		Rating:      getFloat(data, "rating"),
		ReviewCount: getInt(data, "reviewCount"),
		HourlyRate:  getFloat(data, "hourlyRate"),
		Currency:    getString(data, "currency"),
		Location:    getString(data, "location"),
		Available:   getBool(data, "available"),
		Verified:    getBool(data, "verified"),
		Status:      getString(data, "status"),
	}

	// Handle arrays
	if verticals, ok := data["verticals"].([]interface{}); ok {
		doc.Verticals = interfacesToStrings(verticals)
	}
	if subVerticals, ok := data["subVerticals"].([]interface{}); ok {
		doc.SubVerticals = interfacesToStrings(subVerticals)
	}
	if skills, ok := data["skills"].([]interface{}); ok {
		doc.Skills = interfacesToStrings(skills)
	}
	if languages, ok := data["languages"].([]interface{}); ok {
		doc.Languages = interfacesToStrings(languages)
	}

	if err := c.es.IndexConsultant(ctx, doc); err != nil {
		log.Printf("Failed to index consultant: %v", err)
	} else {
		log.Printf("Indexed consultant: %s", doc.ID)
	}
}

func (c *Consumer) indexContent(ctx context.Context, data map[string]interface{}) {
	doc := models.ContentDocument{
		ID:          data["id"].(string),
		Title:       getString(data, "title"),
		Description: getString(data, "description"),
		Type:        getString(data, "type"),
		Author:      getString(data, "author"),
		AuthorID:    getString(data, "authorId"),
		Duration:    getInt(data, "duration"),
		Price:       getFloat(data, "price"),
		Currency:    getString(data, "currency"),
		Thumbnail:   getString(data, "thumbnail"),
		ViewCount:   getInt(data, "viewCount"),
		Status:      getString(data, "status"),
	}

	if verticals, ok := data["verticals"].([]interface{}); ok {
		doc.Verticals = interfacesToStrings(verticals)
	}
	if tags, ok := data["tags"].([]interface{}); ok {
		doc.Tags = interfacesToStrings(tags)
	}

	if err := c.es.IndexContent(ctx, doc); err != nil {
		log.Printf("Failed to index content: %v", err)
	} else {
		log.Printf("Indexed content: %s", doc.ID)
	}
}

// Helper functions
func getString(data map[string]interface{}, key string) string {
	if val, ok := data[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

func getFloat(data map[string]interface{}, key string) float64 {
	if val, ok := data[key]; ok {
		if fl, ok := val.(float64); ok {
			return fl
		}
	}
	return 0
}

func getInt(data map[string]interface{}, key string) int {
	if val, ok := data[key]; ok {
		if fl, ok := val.(float64); ok {
			return int(fl)
		}
	}
	return 0
}

func getBool(data map[string]interface{}, key string) bool {
	if val, ok := data[key]; ok {
		if b, ok := val.(bool); ok {
			return b
		}
	}
	return false
}

func interfacesToStrings(arr []interface{}) []string {
	result := []string{}
	for _, item := range arr {
		if str, ok := item.(string); ok {
			result = append(result, str)
		}
	}
	return result
}