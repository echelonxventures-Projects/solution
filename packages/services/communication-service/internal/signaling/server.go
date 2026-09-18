package signaling

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"consultancy/communication-service/internal/config"
	"consultancy/communication-service/internal/events"
	"consultancy/communication-service/internal/models"
	"consultancy/communication-service/internal/webrtc"

	"github.com/gorilla/websocket"
	"github.com/google/uuid"
)

// Server handles WebSocket signaling
type Server struct {
	config     config.SignalingConfig
	manager    *webrtc.Manager
	producer   *events.Producer
	clients    map[string]*Client
	rooms      map[string]map[string]*Client // roomID -> participantID -> client
	mu         sync.RWMutex
}

// Client represents a WebSocket client
type Client struct {
	ID            string
	UserID        string
	UserRole      string
	SessionID     string
	RoomID        string
	ParticipantID string
	Conn          *websocket.Conn
	Send          chan []byte
	LastHeartbeat time.Time
	mu            sync.Mutex
}

// Message types for signaling
const (
	TypeJoin          = "join"
	TypeLeave         = "leave"
	TypeOffer         = "offer"
	TypeAnswer        = "answer"
	TypeICECandidate  = "ice_candidate"
	TypeUserJoined    = "user_joined"
	TypeUserLeft      = "user_left"
	TypeStateUpdate   = "state_update"
	TypeChat          = "chat"
	TypeError         = "error"
	TypeHeartbeat     = "heartbeat"
	TypeRecordingStart = "recording_start"
	TypeRecordingStop  = "recording_stop"
)

func NewServer(cfg config.SignalingConfig, manager *webrtc.Manager, producer *events.Producer) *Server {
	return &Server{
		config:   cfg,
		manager:  manager,
		producer: producer,
		clients:  make(map[string]*Client),
		rooms:    make(map[string]map[string]*Client),
	}
}

// Start begins the signaling server
func (s *Server) Start() {
	log.Printf("Signaling server started")

	// Heartbeat checker
	go s.heartbeatChecker()
}

// HandleConnection handles a new WebSocket connection
func (s *Server) HandleConnection(conn *websocket.Conn) {
	clientID := uuid.New().String()
	client := &Client{
		ID:            clientID,
		Conn:          conn,
		Send:          make(chan []byte, 256),
		LastHeartbeat: time.Now(),
	}

	s.mu.Lock()
	s.clients[clientID] = client
	s.mu.Unlock()

	// Start read and write goroutines
	go s.writePump(client)
	go s.readPump(client)

	log.Printf("New WebSocket connection: %s", clientID)
}

// readPump reads messages from WebSocket
func (s *Server) readPump(client *Client) {
	defer func() {
		s.disconnectClient(client)
	}()

	conn := client.Conn
	conn.SetReadLimit(512 * 1024) // 512KB max message size
	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		client.LastHeartbeat = time.Now()
		return nil
	})

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		s.handleMessage(client, message)
	}
}

// writePump writes messages to WebSocket
func (s *Server) writePump(client *Client) {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		client.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-client.Send:
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := client.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Drain queue
			n := len(client.Send)
			for i := 0; i < n; i++ {
				msg, ok := <-client.Send
				if !ok {
					break
				}
				w.Write([]byte{'\n'})
				w.Write(msg)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage processes incoming WebSocket messages
func (s *Server) handleMessage(client *Client, message []byte) {
	var msg models.SignalingMessage
	if err := json.Unmarshal(message, &msg); err != nil {
		s.sendError(client, "invalid message format")
		return
	}

	msg.Timestamp = time.Now()

	switch msg.Type {
	case TypeJoin:
		s.handleJoin(client, msg)

	case TypeLeave:
		s.handleLeave(client)

	case TypeOffer:
		s.handleOffer(client, msg)

	case TypeAnswer:
		s.handleAnswer(client, msg)

	case TypeICECandidate:
		s.handleICECandidate(client, msg)

	case TypeStateUpdate:
		s.handleStateUpdate(client, msg)

	case TypeChat:
		s.handleChat(client, msg)

	case TypeHeartbeat:
		client.LastHeartbeat = time.Now()
		s.sendMessage(client, map[string]interface{}{
			"type":      TypeHeartbeat,
			"timestamp": time.Now(),
		})

	case TypeRecordingStart:
		s.handleRecordingStart(client, msg)

	case TypeRecordingStop:
		s.handleRecordingStop(client, msg)

	default:
		s.sendError(client, "unknown message type: "+msg.Type)
	}
}

// handleJoin handles room join
func (s *Server) handleJoin(client *Client, msg models.SignalingMessage) {
	sessionID := msg.SessionID
	userID := msg.Data["userId"].(string)
	userRole := msg.Data["userRole"].(string)

	// Get or create room
	room, err := s.manager.GetRoomBySession(sessionID)
	if err != nil {
		// Create new room
		room, err = s.manager.CreateRoom(sessionID)
		if err != nil {
			s.sendError(client, "failed to create room")
			return
		}
	}

	// Join room
	participant, pc, err := s.manager.JoinRoom(room.ID, userID, userRole)
	if err != nil {
		s.sendError(client, "failed to join room: "+err.Error())
		return
	}
	_ = pc

	// Update client info
	client.UserID = userID
	client.UserRole = userRole
	client.SessionID = sessionID
	client.RoomID = room.ID
	client.ParticipantID = participant.ID

	// Add to room clients
	s.mu.Lock()
	if s.rooms[room.ID] == nil {
		s.rooms[room.ID] = make(map[string]*Client)
	}
	s.rooms[room.ID][participant.ID] = client
	s.mu.Unlock()

	// Create offer
	offer, err := s.manager.CreateOffer(participant.ID)
	if err != nil {
		s.sendError(client, "failed to create offer")
		return
	}

	// Send join response with ICE servers
	s.sendMessage(client, map[string]interface{}{
		"type":        TypeJoin,
		"roomId":      room.ID,
		"participantId": participant.ID,
		"iceServers":  s.manager.GetICEServers(),
		"offer":       offer,
	})

	// Notify others in room
	s.broadcastToRoom(room.ID, participant.ID, map[string]interface{}{
		"type":        TypeUserJoined,
		"userId":      userID,
		"userRole":    userRole,
		"participantId": participant.ID,
		"timestamp":   time.Now(),
	})

	// Publish event
	s.producer.PublishParticipantJoined(context.Background(), sessionID, userID, userRole)

	log.Printf("User %s joined room %s", userID, room.ID)
}

// handleLeave handles room leave
func (s *Server) handleLeave(client *Client) {
	if client.RoomID == "" {
		return
	}

	// Leave room
	s.manager.LeaveRoom(client.RoomID, client.ParticipantID)

	// Notify others
	s.broadcastToRoom(client.RoomID, client.ParticipantID, map[string]interface{}{
		"type":        TypeUserLeft,
		"userId":      client.UserID,
		"participantId": client.ParticipantID,
		"timestamp":   time.Now(),
	})

	// Remove from room clients
	s.mu.Lock()
	if s.rooms[client.RoomID] != nil {
		delete(s.rooms[client.RoomID], client.ParticipantID)
	}
	s.mu.Unlock()

	// Publish event
	s.producer.PublishParticipantLeft(context.Background(), client.SessionID, client.UserID, client.UserRole)

	client.RoomID = ""
	client.ParticipantID = ""

	s.sendMessage(client, map[string]interface{}{
		"type": TypeLeave,
		"success": true,
	})
}

// handleOffer handles SDP offer
func (s *Server) handleOffer(client *Client, msg models.SignalingMessage) {
	// Forward offer to target participant
	targetID := msg.To
	if targetID == "" {
		s.sendError(client, "missing target participant")
		return
	}

	s.mu.RLock()
	targetClient, ok := s.rooms[client.RoomID][targetID]
	s.mu.RUnlock()

	if !ok {
		s.sendError(client, "target participant not found")
		return
	}

	s.sendMessage(targetClient, map[string]interface{}{
		"type":        TypeOffer,
		"from":        client.ParticipantID,
		"participantId": client.ParticipantID,
		"sdp":         msg.Data["sdp"],
	})
}

// handleAnswer handles SDP answer
func (s *Server) handleAnswer(client *Client, msg models.SignalingMessage) {
	sdp := msg.Data["sdp"].(string)

	// Set remote description
	err := s.manager.HandleAnswer(client.ParticipantID, sdp)
	if err != nil {
		s.sendError(client, "failed to handle answer")
		return
	}

	// Forward answer to offerer
	targetID := msg.To
	if targetID != "" {
		s.mu.RLock()
		targetClient, ok := s.rooms[client.RoomID][targetID]
		s.mu.RUnlock()

		if ok {
			s.sendMessage(targetClient, map[string]interface{}{
				"type":        TypeAnswer,
				"from":        client.ParticipantID,
				"sdp":         sdp,
			})
		}
	}
}

// handleICECandidate handles ICE candidate
func (s *Server) handleICECandidate(client *Client, msg models.SignalingMessage) {
	candidateJSON, err := json.Marshal(msg.Data)
	if err != nil {
		s.sendError(client, "invalid candidate data")
		return
	}

	// Add ICE candidate
	err = s.manager.AddICECandidate(client.ParticipantID, string(candidateJSON))
	if err != nil {
		log.Printf("Failed to add ICE candidate: %v", err)
	}

	// Forward to other participants
	s.broadcastToRoom(client.RoomID, client.ParticipantID, map[string]interface{}{
		"type":        TypeICECandidate,
		"from":        client.ParticipantID,
		"candidate":   msg.Data,
	})
}

// handleStateUpdate handles participant state updates
func (s *Server) handleStateUpdate(client *Client, msg models.SignalingMessage) {
	// Broadcast state update
	s.broadcastToRoom(client.RoomID, "", map[string]interface{}{
		"type":        TypeStateUpdate,
		"participantId": client.ParticipantID,
		"userId":      client.UserID,
		"data":        msg.Data,
		"timestamp":   time.Now(),
	})
}

// handleChat handles chat message
func (s *Server) handleChat(client *Client, msg models.SignalingMessage) {
	// Broadcast chat to room
	s.broadcastToRoom(client.RoomID, "", map[string]interface{}{
		"type":        TypeChat,
		"from":        client.UserID,
		"fromRole":    client.UserRole,
		"content":     msg.Data["content"],
		"timestamp":   time.Now(),
	})

	// Publish event
	s.producer.PublishMessageSent(context.Background(), client.SessionID, uuid.New().String(), client.UserID)
}

// handleRecordingStart handles recording start request
func (s *Server) handleRecordingStart(client *Client, msg models.SignalingMessage) {
	// Only consultant can start recording
	if client.UserRole != "consultant" {
		s.sendError(client, "only consultant can start recording")
		return
	}

	// Broadcast recording start
	s.broadcastToRoom(client.RoomID, "", map[string]interface{}{
		"type":        TypeRecordingStart,
		"startedBy":   client.UserID,
		"timestamp":   time.Now(),
	})

	s.producer.PublishRecordingStarted(context.Background(), uuid.New().String(), client.SessionID)
}

// handleRecordingStop handles recording stop request
func (s *Server) handleRecordingStop(client *Client, msg models.SignalingMessage) {
	// Broadcast recording stop
	s.broadcastToRoom(client.RoomID, "", map[string]interface{}{
		"type":        TypeRecordingStop,
		"stoppedBy":   client.UserID,
		"timestamp":   time.Now(),
	})
}

// sendMessage sends a message to a client
func (s *Server) sendMessage(client *Client, message map[string]interface{}) {
	data, err := json.Marshal(message)
	if err != nil {
		return
	}

	client.mu.Lock()
	select {
	case client.Send <- data:
	default:
		// Channel full, skip
	}
	client.mu.Unlock()
}

// sendError sends an error message
func (s *Server) sendError(client *Client, errorMsg string) {
	s.sendMessage(client, map[string]interface{}{
		"type":  TypeError,
		"error": errorMsg,
	})
}

// broadcastToRoom broadcasts message to room participants
func (s *Server) broadcastToRoom(roomID string, excludeParticipant string, message map[string]interface{}) {
	s.mu.RLock()
	roomClients := s.rooms[roomID]
	s.mu.RUnlock()

	if roomClients == nil {
		return
	}

	data, err := json.Marshal(message)
	if err != nil {
		return
	}

	for participantID, client := range roomClients {
		if participantID == excludeParticipant {
			continue
		}

		client.mu.Lock()
		select {
		case client.Send <- data:
		default:
		}
		client.mu.Unlock()
	}
}

// disconnectClient handles client disconnect
func (s *Server) disconnectClient(client *Client) {
	// Leave room if connected
	if client.RoomID != "" {
		s.handleLeave(client)
	}

	s.mu.Lock()
	delete(s.clients, client.ID)
	s.mu.Unlock()

	client.Conn.Close()
	log.Printf("Client disconnected: %s", client.ID)
}

// heartbeatChecker checks for inactive clients
func (s *Server) heartbeatChecker() {
	ticker := time.NewTicker(time.Duration(s.config.HeartbeatIntervalSeconds) * time.Second)

	for {
		select {
		case <-ticker.C:
			s.mu.RLock()
			for _, client := range s.clients {
				if time.Since(client.LastHeartbeat) > 90*time.Second {
					log.Printf("Client timeout: %s", client.ID)
					go s.disconnectClient(client)
				}
			}
			s.mu.RUnlock()
		}
	}
}

// GetRoomParticipants returns room participants
func (s *Server) GetRoomParticipants(roomID string) []map[string]interface{} {
	s.mu.RLock()
	roomClients := s.rooms[roomID]
	s.mu.RUnlock()

	participants := []map[string]interface{}{}
	for _, client := range roomClients {
		participants = append(participants, map[string]interface{}{
			"userId":   client.UserID,
			"userRole": client.UserRole,
			"joinedAt": client.LastHeartbeat,
		})
	}

	return participants
}