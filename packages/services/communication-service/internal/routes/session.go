package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"consultancy/communication-service/internal/config"
	"consultancy/communication-service/internal/database"
	"consultancy/communication-service/internal/events"
	"consultancy/communication-service/internal/models"
	"consultancy/communication-service/internal/webrtc"
	"consultancy/communication-service/internal/signaling"

	"github.com/google/uuid"
	"github.com/fasthttp/router"
	"github.com/valyala/fasthttp"
	"github.com/go-playground/validator/v10"
)

type Handler struct {
	Config    *config.Config
	DB        *database.DB
	Producer  *events.Producer
	Manager   *webrtc.Manager
	Signaling *signaling.Server
	Validator *validator.Validate
}

func SetupRouter(cfg *config.Config, db *database.DB, producer *events.Producer, manager *webrtc.Manager, sigServer *signaling.Server) *router.Router {
	router := router.New()

	h := &Handler{
		Config:    cfg,
		DB:        db,
		Producer:  producer,
		Manager:   manager,
		Signaling: sigServer,
		Validator: validator.New(),
	}

	// Health routes
	router.GET("/health", h.Health)
	router.GET("/ready", h.Ready)

	// Session routes
	router.POST("/sessions", h.CreateSession)
	router.GET("/sessions/:id", h.GetSession)
	router.POST("/sessions/:id/start", h.StartSession)
	router.POST("/sessions/:id/end", h.EndSession)
	router.GET("/sessions/booking/:bookingId", h.GetSessionByBooking)
	router.GET("/sessions/active/:userId", h.GetActiveSessions)

	// Room routes
	router.POST("/rooms", h.CreateRoom)
	router.GET("/rooms/:id", h.GetRoom)
	router.GET("/rooms/:id/participants", h.GetRoomParticipants)
	router.POST("/rooms/:id/join", h.JoinRoom)
	router.POST("/rooms/:id/leave", h.LeaveRoom)

	// WebSocket signaling
	router.GET("/ws", h.HandleWebSocket)

	// Chat routes
	router.POST("/messages", h.SendMessage)
	router.GET("/messages/:sessionId", h.GetMessages)
	router.POST("/messages/:id/read", h.MarkMessageRead)

	// Recording routes
	router.POST("/recordings/start", h.StartRecording)
	router.POST("/recordings/:id/stop", h.StopRecording)
	router.GET("/recordings/:id", h.GetRecording)
	router.GET("/recordings/session/:sessionId", h.GetSessionRecordings)
	router.GET("/recordings/:id/download", h.DownloadRecording)

	// Transcription routes
	router.POST("/transcriptions/start", h.StartTranscription)
	router.GET("/transcriptions/:id", h.GetTranscription)
	router.GET("/transcriptions/session/:sessionId", h.GetSessionTranscriptions)

	// ICE servers
	router.GET("/ice-servers", h.GetICEServers)

	return router
}

// Health check
func (h *Handler) Health(ctx *fasthttp.RequestCtx) {
	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"status":"healthy","service":"communication-service","timestamp":"` + time.Now().Format(time.RFC3339) + `"}`)
}

func (h *Handler) Ready(ctx *fasthttp.RequestCtx) {
	if err := h.DB.QueryRow(context.Background(), "SELECT 1").Scan(new(int)); err != nil {
		ctx.SetStatusCode(503)
		ctx.SetBodyString(`{"ready":false,"error":"database unavailable"}`)
		return
	}
	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"ready":true}`)
}

// CreateSession creates a new communication session
func (h *Handler) CreateSession(ctx *fasthttp.RequestCtx) {
	var req models.CreateSessionRequest
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

	sessionID := uuid.New().String()
	now := time.Now()

	// Apply default settings
	if req.Quality == "" {
		req.Quality = "auto"
	}
	recordingEnabled := req.RecordingEnabled && h.Config.Recording.Enabled
	transcriptionEnabled := req.TranscriptionEnabled && h.Config.Transcription.Enabled

	// Create session in database
	session := map[string]interface{}{
		"id":                    sessionID,
		"booking_id":            req.BookingID,
		"room_id":               "pending-" + sessionID,
		"status":                "pending",
		"recording_enabled":     recordingEnabled,
		"transcription_enabled": transcriptionEnabled,
		"created_at":            now,
	}

	if err := h.DB.Insert(context.Background(), "sessions", session); err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"database error: %s"}`, err.Error()))
		return
	}

	// Create WebRTC room
	room, err := h.Manager.CreateRoom(sessionID)
	if err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"failed to create room: %s"}`, err.Error()))
		return
	}

	// Update session with room ID
	h.DB.Update(context.Background(), "sessions", sessionID, map[string]interface{}{
		"room_id": room.ID,
	})

	ctx.SetStatusCode(201)
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(map[string]interface{}{
		"id":                sessionID,
		"roomId":            room.ID,
		"status":            "waiting",
		"type":              req.Type,
		"recordingEnabled":  recordingEnabled,
		"transcriptionEnabled": transcriptionEnabled,
		"iceServers":        h.Manager.GetICEServers(),
	})
}

// GetSession retrieves a session by ID
func (h *Handler) GetSession(ctx *fasthttp.RequestCtx) {
	sessionID := ctx.UserValue("id").(string)

	row := h.DB.QueryRow(context.Background(),
		"SELECT id, booking_id, status, room_id, started_at, ended_at, duration_seconds FROM sessions WHERE id = $1",
		sessionID)

	var session models.Session
	err := row.Scan(&session.ID, &session.BookingID, &session.Status, &session.RoomID,
		&session.StartedAt, &session.EndedAt, &session.DurationMinutes)
	if err != nil {
		ctx.SetStatusCode(404)
		ctx.SetBodyString(`{"error":"session not found"}`)
		return
	}

	// Get room info if active
	roomInfo, _ := h.Manager.GetRoomInfo(session.RoomID)

	ctx.SetStatusCode(200)
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(map[string]interface{}{
		"session":    session,
		"room":       roomInfo,
	})
}

// StartSession starts a session
func (h *Handler) StartSession(ctx *fasthttp.RequestCtx) {
	sessionID := ctx.UserValue("id").(string)

	now := time.Now()
	err := h.DB.Update(context.Background(), "sessions", sessionID, map[string]interface{}{
		"status":     "active",
		"started_at": now,
	})
	if err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"failed to update: %s"}`, err.Error()))
		return
	}

	// Get session details for event
	row := h.DB.QueryRow(context.Background(),
		"SELECT booking_id, room_id, room_id FROM sessions WHERE id = $1", sessionID)
	var bookingID, consultantID, seekerID, sessionType string
	row.Scan(&bookingID, &consultantID, &seekerID)
	sessionType = "video"

	// Publish event
	h.Producer.PublishSessionStarted(context.Background(), sessionID, bookingID, consultantID, seekerID, sessionType)

	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"status":"active","startedAt":"` + now.Format(time.RFC3339) + `"}`)
}

// EndSession ends a session
func (h *Handler) EndSession(ctx *fasthttp.RequestCtx) {
	sessionID := ctx.UserValue("id").(string)

	// Parse request for reason
	var req struct {
		Reason string `json:"reason"`
	}
	json.Unmarshal(ctx.PostBody(), &req)

	now := time.Now()

	// Get start time to calculate duration
	row := h.DB.QueryRow(context.Background(),
		"SELECT started_at, room_id FROM sessions WHERE id = $1", sessionID)
	var startedAt time.Time
	var roomID string
	err := row.Scan(&startedAt, &roomID)
	if err != nil {
		ctx.SetStatusCode(404)
		ctx.SetBodyString(`{"error":"session not found"}`)
		return
	}

	durationMinutes := int(now.Sub(startedAt).Minutes())

	// Update session
	h.DB.Update(context.Background(), "sessions", sessionID, map[string]interface{}{
		"status":           "completed",
		"ended_at":         now,
		"duration_minutes": durationMinutes,
		"ended_reason":     req.Reason,
	})

	// Close WebRTC room
	if roomID != "" {
		h.Manager.CloseRoom(roomID)
	}

	// Publish event
	h.Producer.PublishSessionEnded(context.Background(), sessionID, durationMinutes, req.Reason)

	ctx.SetStatusCode(200)
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(map[string]interface{}{
		"status":           "completed",
		"endedAt":          now,
		"durationMinutes":  durationMinutes,
	})
}

// CreateRoom creates a new WebRTC room
func (h *Handler) CreateRoom(ctx *fasthttp.RequestCtx) {
	var req struct {
		SessionID string `json:"sessionId" validate:"required"`
	}
	json.Unmarshal(ctx.PostBody(), &req)

	room, err := h.Manager.CreateRoom(req.SessionID)
	if err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"failed to create room: %s"}`, err.Error()))
		return
	}

	ctx.SetStatusCode(201)
	json.NewEncoder(ctx).Encode(map[string]interface{}{
		"roomId":    room.ID,
		"sessionId": room.SessionID,
		"status":    room.Status,
		"iceServers": h.Manager.GetICEServers(),
	})
}

// GetRoom retrieves room information
func (h *Handler) GetRoom(ctx *fasthttp.RequestCtx) {
	roomID := ctx.UserValue("id").(string)

	roomInfo, err := h.Manager.GetRoomInfo(roomID)
	if err != nil {
		ctx.SetStatusCode(404)
		ctx.SetBodyString(`{"error":"room not found"}`)
		return
	}

	ctx.SetStatusCode(200)
	json.NewEncoder(ctx).Encode(roomInfo)
}

// JoinRoom handles joining a room via HTTP (alternative to WebSocket)
func (h *Handler) JoinRoom(ctx *fasthttp.RequestCtx) {
	roomID := ctx.UserValue("id").(string)

	var req models.JoinSessionRequest
	json.Unmarshal(ctx.PostBody(), &req)

	participant, pc, err := h.Manager.JoinRoom(roomID, req.UserID, req.UserRole)
	if err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"failed to join: %s"}`, err.Error()))
		return
	}
	_ = pc

	// Create offer
	offer, err := h.Manager.CreateOffer(participant.ID)
	if err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(`{"error":"failed to create offer"}`)
		return
	}

	ctx.SetStatusCode(200)
	json.NewEncoder(ctx).Encode(map[string]interface{}{
		"participantId": participant.ID,
		"offer":         offer,
		"iceServers":    h.Manager.GetICEServers(),
	})
}

// LeaveRoom handles leaving a room
func (h *Handler) LeaveRoom(ctx *fasthttp.RequestCtx) {
	roomID := ctx.UserValue("id").(string)

	var req struct {
		ParticipantID string `json:"participantId"`
	}
	json.Unmarshal(ctx.PostBody(), &req)

	err := h.Manager.LeaveRoom(roomID, req.ParticipantID)
	if err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"failed to leave: %s"}`, err.Error()))
		return
	}

	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"status":"left"}`)
}

// HandleWebSocket handles WebSocket connections for signaling
// Note: fasthttp does not support gorilla/websocket upgrades directly.
// Signaling runs on its own net/http server (see signaling.Server).
func (h *Handler) HandleWebSocket(ctx *fasthttp.RequestCtx) {
	ctx.SetStatusCode(501)
	ctx.SetContentType("application/json")
	ctx.SetBodyString(`{"error":"WebSocket signaling is served by the dedicated signaling server; use ws://<host>:<signaling-port>/ws"}`)
}

// SendMessage sends a chat message
func (h *Handler) SendMessage(ctx *fasthttp.RequestCtx) {
	var req models.SendMessageRequest
	if err := json.Unmarshal(ctx.PostBody(), &req); err != nil {
		ctx.SetStatusCode(400)
		ctx.SetBodyString(`{"error":"invalid request body"}`)
		return
	}

	messageID := uuid.New().String()
	now := time.Now()

	message := map[string]interface{}{
		"id":           messageID,
		"session_id":   req.SessionID,
		"sender_id":    req.SenderID,
		"content":      req.Content,
		"message_type": req.Type,
		"created_at":   now,
	}

	if err := h.DB.Insert(context.Background(), "session_messages", message); err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"database error: %s"}`, err.Error()))
		return
	}

	h.Producer.PublishMessageSent(context.Background(), req.SessionID, messageID, req.SenderID)

	ctx.SetStatusCode(201)
	json.NewEncoder(ctx).Encode(map[string]interface{}{
		"id":        messageID,
		"sessionId": req.SessionID,
		"content":   req.Content,
		"createdAt": now,
	})
}

// GetMessages retrieves messages for a session
func (h *Handler) GetMessages(ctx *fasthttp.RequestCtx) {
	sessionID := ctx.UserValue("sessionId").(string)

	rows, err := h.DB.Query(context.Background(),
		"SELECT id, sender_id, content, message_type, created_at FROM session_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 100",
		sessionID)
	if err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"database error: %s"}`, err.Error()))
		return
	}
	defer rows.Close()

	messages := []map[string]interface{}{}
	for rows.Next() {
		var id, senderID, content, msgType string
		var createdAt time.Time
		rows.Scan(&id, &senderID, &content, &msgType, &createdAt)
		messages = append(messages, map[string]interface{}{
			"id":        id,
			"senderId":  senderID,
			"content":   content,
			"type":      msgType,
			"createdAt": createdAt,
		})
	}

	ctx.SetStatusCode(200)
	json.NewEncoder(ctx).Encode(map[string]interface{}{
		"sessionId": sessionID,
		"messages":  messages,
	})
}

// Recording handlers
func (h *Handler) StartRecording(ctx *fasthttp.RequestCtx) {
	var req struct {
		SessionID string `json:"sessionId"`
	}
	json.Unmarshal(ctx.PostBody(), &req)

	recordingID := uuid.New().String()

	recording := map[string]interface{}{
		"id":        recordingID,
		"session_id": req.SessionID,
		"status":    "recording",
		"created_at": time.Now(),
	}

	h.DB.Insert(context.Background(), "recordings", recording)
	h.Producer.PublishRecordingStarted(context.Background(), recordingID, req.SessionID)

	ctx.SetStatusCode(201)
	json.NewEncoder(ctx).Encode(map[string]string{"recordingId": recordingID, "status": "recording"})
}

func (h *Handler) StopRecording(ctx *fasthttp.RequestCtx) {
	recordingID := ctx.UserValue("id").(string)

	h.DB.Update(context.Background(), "recordings", recordingID, map[string]interface{}{
		"status": "processing",
	})

	// In production, stop actual recording process

	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"status":"processing"}`)
}

func (h *Handler) GetRecording(ctx *fasthttp.RequestCtx) {
	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"status":"completed"}`)
}

func (h *Handler) GetSessionRecordings(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) DownloadRecording(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }

// Transcription handlers
func (h *Handler) StartTranscription(ctx *fasthttp.RequestCtx) {
	var req struct {
		SessionID string `json:"sessionId"`
	}
	json.Unmarshal(ctx.PostBody(), &req)

	transcriptionID := uuid.New().String()

	transcription := map[string]interface{}{
		"id":        transcriptionID,
		"session_id": req.SessionID,
		"status":    "pending",
		"created_at": time.Now(),
	}

	h.DB.Insert(context.Background(), "transcriptions", transcription)

	ctx.SetStatusCode(201)
	json.NewEncoder(ctx).Encode(map[string]string{"transcriptionId": transcriptionID, "status": "pending"})
}

func (h *Handler) GetTranscription(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) GetSessionTranscriptions(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }

// ICE servers
func (h *Handler) GetICEServers(ctx *fasthttp.RequestCtx) {
	ctx.SetStatusCode(200)
	json.NewEncoder(ctx).Encode(h.Manager.GetICEServers())
}

// Placeholder implementations
func (h *Handler) GetSessionByBooking(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) GetActiveSessions(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) GetRoomParticipants(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }
func (h *Handler) MarkMessageRead(ctx *fasthttp.RequestCtx) { ctx.SetStatusCode(200) }