// Communication Service - WebRTC and real-time communication
// Handles: video/audio sessions, signaling, WebRTC

package main

import (
	"log"
	"os"

	"consultancy/communication-service/internal/config"
	"consultancy/communication-service/internal/database"
	"consultancy/communication-service/internal/events"
	"consultancy/communication-service/internal/routes"
	"consultancy/communication-service/internal/webrtc"
	"consultancy/communication-service/internal/signaling"

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

	// Initialize database
	db, err := database.New(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize Kafka producer
	producer := events.NewProducer(cfg.Kafka)
	defer producer.Close()

	// Initialize WebRTC manager
	rtcManager := webrtc.NewManager(cfg.WebRTC)

	// Initialize signaling server
	sigServer := signaling.NewServer(cfg.Signaling, rtcManager, producer)

	// Setup router
	router := routes.SetupRouter(cfg, db, producer, rtcManager, sigServer)

	// Start signaling WebSocket handler in background
	go sigServer.Start()

	// Start server
	addr := cfg.Server.Host + ":" + cfg.Server.Port
	log.Printf("Communication Service starting on %s", addr)

	if err := fasthttp.ListenAndServe(addr, router.Handler); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}