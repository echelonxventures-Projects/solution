// Search Service - Elasticsearch-based search
// Handles: search indexing, query, event consumption

package main

import (
	"log"
	"os"

	"consultancy/search-service/internal/config"
	"consultancy/search-service/internal/database"
	"consultancy/search-service/internal/events"
	"consultancy/search-service/internal/elasticsearch"
	"consultancy/search-service/internal/routes"

	"github.com/valyala/fasthttp"
)

func main() {
	// Load configuration
	cfg, err := config.Load("config.yaml")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Override with environment variables
	if port := os.Getenv("SERVER_PORT"); port != "" {
		cfg.Server.Port = port
	}
	if esURL := os.Getenv("ELASTICSEARCH_URL"); esURL != "" {
		cfg.Elasticsearch.URLs = []string{esURL}
	}

	// Initialize database
	db, err := database.New(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize Elasticsearch client
	esClient, err := elasticsearch.NewClient(cfg.Elasticsearch, cfg.Search, cfg.Autocomplete)
	if err != nil {
		log.Fatalf("Failed to connect to Elasticsearch: %v", err)
	}

	// Initialize Kafka consumer for indexing
	consumer := events.NewConsumer(cfg.Kafka)
	defer consumer.Close()

	// Start event indexer in background
	go consumer.StartIndexer(esClient)

	// Setup router
	router := routes.SetupRouter(cfg, db, esClient)

	// Start server
	addr := cfg.Server.Host + ":" + cfg.Server.Port
	log.Printf("Search Service starting on %s", addr)

	if err := fasthttp.ListenAndServe(addr, router.Handler); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}