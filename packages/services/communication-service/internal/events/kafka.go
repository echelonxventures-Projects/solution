package events

import (
	"context"
	"encoding/json"
	"log"

	"consultancy/communication-service/internal/config"

	"github.com/segmentio/kafka-go"
)

type Producer struct {
	writer *kafka.Writer
	config config.KafkaConfig
}

func NewProducer(cfg config.KafkaConfig) *Producer {
	writer := &kafka.Writer{
		Addr:     kafka.TCP(cfg.Brokers...),
		Topic:    cfg.TopicPrefix + "-session-events",
		Balancer: &kafka.LeastBytes{},
	}

	return &Producer{writer: writer, config: cfg}
}

func (p *Producer) Close() error {
	return p.writer.Close()
}

type SessionEvent struct {
	EventType string      `json:"eventType"`
	Data      interface{} `json:"data"`
	Source    string      `json:"source"`
	Timestamp string      `json:"timestamp"`
}

func (p *Producer) PublishSessionStarted(ctx context.Context, sessionID string, bookingID string, consultantID string, seekerID string, sessionType string) error {
	event := SessionEvent{
		EventType: "session.started",
		Data: map[string]interface{}{
			"sessionId":    sessionID,
			"bookingId":    bookingID,
			"consultantId": consultantID,
			"seekerId":     seekerID,
			"sessionType":  sessionType,
		},
		Source:    "communication-service",
		Timestamp: "now",
	}
	return p.publish(ctx, event)
}

func (p *Producer) PublishSessionEnded(ctx context.Context, sessionID string, durationMinutes int, endedReason string) error {
	event := SessionEvent{
		EventType: "session.ended",
		Data: map[string]interface{}{
			"sessionId":       sessionID,
			"durationMinutes": durationMinutes,
			"endedReason":     endedReason,
		},
		Source:    "communication-service",
		Timestamp: "now",
	}
	return p.publish(ctx, event)
}

func (p *Producer) PublishParticipantJoined(ctx context.Context, sessionID string, userID string, userRole string) error {
	event := SessionEvent{
		EventType: "session.participant.joined",
		Data: map[string]interface{}{
			"sessionId": sessionID,
			"userId":    userID,
			"userRole":  userRole,
		},
		Source:    "communication-service",
		Timestamp: "now",
	}
	return p.publish(ctx, event)
}

func (p *Producer) PublishParticipantLeft(ctx context.Context, sessionID string, userID string, userRole string) error {
	event := SessionEvent{
		EventType: "session.participant.left",
		Data: map[string]interface{}{
			"sessionId": sessionID,
			"userId":    userID,
			"userRole":  userRole,
		},
		Source:    "communication-service",
		Timestamp: "now",
	}
	return p.publish(ctx, event)
}

func (p *Producer) PublishRecordingStarted(ctx context.Context, recordingID string, sessionID string) error {
	event := SessionEvent{
		EventType: "session.recording.started",
		Data: map[string]interface{}{
			"recordingId": recordingID,
			"sessionId":   sessionID,
		},
		Source:    "communication-service",
		Timestamp: "now",
	}
	return p.publish(ctx, event)
}

func (p *Producer) PublishRecordingCompleted(ctx context.Context, recordingID string, sessionID string, fileSize int64, durationSeconds int) error {
	event := SessionEvent{
		EventType: "session.recording.completed",
		Data: map[string]interface{}{
			"recordingId":     recordingID,
			"sessionId":       sessionID,
			"fileSizeBytes":   fileSize,
			"durationSeconds": durationSeconds,
		},
		Source:    "communication-service",
		Timestamp: "now",
	}
	return p.publish(ctx, event)
}

func (p *Producer) PublishTranscriptionCompleted(ctx context.Context, transcriptionID string, sessionID string, language string) error {
	event := SessionEvent{
		EventType: "session.transcription.completed",
		Data: map[string]interface{}{
			"transcriptionId": transcriptionID,
			"sessionId":       sessionID,
			"language":        language,
		},
		Source:    "communication-service",
		Timestamp: "now",
	}
	return p.publish(ctx, event)
}

func (p *Producer) PublishMessageSent(ctx context.Context, sessionID string, messageID string, senderID string) error {
	event := SessionEvent{
		EventType: "session.message.sent",
		Data: map[string]interface{}{
			"sessionId": sessionID,
			"messageId": messageID,
			"senderId":  senderID,
		},
		Source:    "communication-service",
		Timestamp: "now",
	}
	return p.publish(ctx, event)
}

func (p *Producer) publish(ctx context.Context, event SessionEvent) error {
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