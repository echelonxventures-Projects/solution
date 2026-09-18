package models

import (
	"time"
)

// Session represents a communication session (video/audio)
type Session struct {
	ID              string    `json:"id" validate:"required,uuid"`
	BookingID       string    `json:"bookingId" validate:"required,uuid"`
	ConsultantID    string    `json:"consultantId" validate:"required,uuid"`
	SeekerID        string    `json:"seekerId" validate:"required,uuid"`
	Status          string    `json:"status" validate:"required,oneof=waiting active completed cancelled failed"`
	Type            string    `json:"type" validate:"required,oneof=video audio chat"`
	StartedAt       *time.Time `json:"startedAt"`
	EndedAt         *time.Time `json:"endedAt"`
	DurationMinutes int       `json:"durationMinutes"`
	RecordingID     string    `json:"recordingId"`
	TranscriptionID string    `json:"transcriptionId"`
	RecordingEnabled bool     `json:"recordingEnabled"`
	TranscriptionEnabled bool  `json:"transcriptionEnabled"`
	ParticipantCount int      `json:"participantCount"`
	RoomID          string    `json:"roomId"`
	Quality         string    `json:"quality" validate:"oneof=low medium high auto"`
	EndedReason     string    `json:"endedReason"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// Message represents a chat message
type Message struct {
	ID          string    `json:"id" validate:"required,uuid"`
	SessionID   string    `json:"sessionId" validate:"required,uuid"`
	SenderID    string    `json:"senderId" validate:"required,uuid"`
	SenderRole  string    `json:"senderRole" validate:"required,oneof=consultant seeker system"`
	Content     string    `json:"content" validate:"required"`
	Type        string    `json:"type" validate:"required,oneof=text file image link system"`
	Metadata    map[string]interface{} `json:"metadata"`
	ReadAt      *time.Time `json:"readAt"`
	EditedAt    *time.Time `json:"editedAt"`
	DeletedAt   *time.Time `json:"deletedAt"`
	CreatedAt   time.Time `json:"createdAt"`
}

// Recording represents a session recording
type Recording struct {
	ID            string    `json:"id" validate:"required,uuid"`
	SessionID     string    `json:"sessionId" validate:"required,uuid"`
	Status        string    `json:"status" validate:"required,oneof=recording processing completed failed"`
	StoragePath   string    `json:"storagePath"`
	FileSizeBytes int64     `json:"fileSizeBytes"`
	DurationSeconds int     `json:"durationSeconds"`
	Format        string    `json:"format"`
	ThumbnailURL  string    `json:"thumbnailUrl"`
	DownloadURL   string    `json:"downloadUrl"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// Transcription represents a session transcription
type Transcription struct {
	ID          string    `json:"id" validate:"required,uuid"`
	SessionID   string    `json:"sessionId" validate:"required,uuid"`
	RecordingID string    `json:"recordingId"`
	Status      string    `json:"status" validate:"required,oneof=pending processing completed failed"`
	Language    string    `json:"language"`
	Text        string    `json:"text"`
	Segments    []TranscriptSegment `json:"segments"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// TranscriptSegment represents a segment of transcription
type TranscriptSegment struct {
	ID          string  `json:"id"`
	SpeakerID   string  `json:"speakerId"`
	SpeakerRole string  `json:"speakerRole"`
	Text        string  `json:"text"`
	StartTime   float64 `json:"startTime"`
	EndTime     float64 `json:"endTime"`
	Confidence  float64 `json:"confidence"`
}

// Room represents a WebRTC room
type Room struct {
	ID           string            `json:"id"`
	SessionID    string            `json:"sessionId"`
	Participants []Participant     `json:"participants"`
	ICEServers   []ICEServer       `json:"iceServers"`
	CreatedAt    time.Time         `json:"createdAt"`
	Status       string            `json:"status"`
}

// Participant represents a room participant
type Participant struct {
	ID            string `json:"id"`
	UserID        string `json:"userId"`
	Role          string `json:"role"`
	ConnectionID  string `json:"connectionId"`
	JoinedAt      time.Time `json:"joinedAt"`
	LeftAt        *time.Time `json:"leftAt"`
	IsMuted       bool   `json:"isMuted"`
	IsVideoOff    bool   `json:"isVideoOff"`
	IsSpeaking    bool   `json:"isSpeaking"`
	StreamID      string `json:"streamId"`
}

// ICEServer represents an ICE server configuration
type ICEServer struct {
	URLs     []string `json:"urls"`
	Username string   `json:"username,omitempty"`
	Password string   `json:"password,omitempty"`
}

// SignalingMessage represents a WebSocket signaling message
type SignalingMessage struct {
	Type      string                 `json:"type" validate:"required"`
	SessionID string                 `json:"sessionId"`
	RoomID    string                 `json:"roomId"`
	From      string                 `json:"from"`
	To        string                 `json:"to"`
	Data      map[string]interface{} `json:"data"`
	Timestamp time.Time              `json:"timestamp"`
}

// CreateSessionRequest for creating a session
type CreateSessionRequest struct {
	BookingID           string `json:"bookingId" validate:"required,uuid"`
	ConsultantID        string `json:"consultantId" validate:"required,uuid"`
	SeekerID            string `json:"seekerId" validate:"required,uuid"`
	Type                string `json:"type" validate:"required,oneof=video audio chat"`
	RecordingEnabled    bool   `json:"recordingEnabled"`
	TranscriptionEnabled bool   `json:"transcriptionEnabled"`
	Quality             string `json:"quality"`
}

// JoinSessionRequest for joining a session
type JoinSessionRequest struct {
	SessionID string `json:"sessionId" validate:"required,uuid"`
	UserID    string `json:"userId" validate:"required,uuid"`
	UserRole  string `json:"userRole" validate:"required,oneof=consultant seeker"`
}

// SendMessageRequest for sending a message
type SendMessageRequest struct {
	SessionID string                 `json:"sessionId" validate:"required,uuid"`
	SenderID  string                 `json:"senderId" validate:"required,uuid"`
	Content   string                 `json:"content" validate:"required"`
	Type      string                 `json:"type" validate:"required,oneof=text file image link"`
	Metadata  map[string]interface{} `json:"metadata"`
}

// SessionEvent represents a session lifecycle event
type SessionEvent struct {
	SessionID   string    `json:"sessionId"`
	EventType   string    `json:"eventType"`
	ParticipantID string  `json:"participantId"`
	Data        map[string]interface{} `json:"data"`
	Timestamp   time.Time `json:"timestamp"`
}

// WebRTCOffer represents an SDP offer
type WebRTCOffer struct {
	SessionID string `json:"sessionId"`
	UserID    string `json:"userId"`
	SDP       string `json:"sdp"`
	Type      string `json:"type"`
}

// WebRTCAnswer represents an SDP answer
type WebRTCAnswer struct {
	SessionID string `json:"sessionId"`
	UserID    string `json:"userId"`
	SDP       string `json:"sdp"`
	Type      string `json:"type"`
}

// ICECandidate represents an ICE candidate
type ICECandidate struct {
	SessionID string `json:"sessionId"`
	UserID    string `json:"userId"`
	Candidate string `json:"candidate"`
	SDPMLineIndex int `json:"sdpMLineIndex"`
	SDPMID   string `json:"sdpMid"`
}