package webrtc

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"consultancy/communication-service/internal/config"
	"consultancy/communication-service/internal/models"

	"github.com/google/uuid"
	"github.com/pion/webrtc/v3"
)

// Manager manages WebRTC sessions and rooms
type Manager struct {
	config      config.WebRTCConfig
	rooms       map[string]*Room
	connections map[string]*webrtc.PeerConnection
	mu          sync.RWMutex
	api         *webrtc.API
}

// Room represents a WebRTC room with participants
type Room struct {
	ID           string
	SessionID    string
	Participants map[string]*Participant
	Tracks       map[string]*webrtc.TrackLocalStaticRTP
	CreatedAt    time.Time
	Status       string
	mu           sync.RWMutex
}

// Participant in a WebRTC room
type Participant struct {
	ID           string
	UserID       string
	Role         string
	Connection   *webrtc.PeerConnection
	JoinedAt     time.Time
	LeftAt       *time.Time
	IsMuted      bool
	IsVideoOff   bool
	StreamID     string
}

func NewManager(cfg config.WebRTCConfig) *Manager {
	// Create WebRTC API with custom settings
	settingsEngine := webrtc.SettingEngine{}

	// Configure media engine
	mediaEngine := webrtc.MediaEngine{}
	mediaEngine.RegisterDefaultCodecs()

	// Create API
	api := webrtc.NewAPI(webrtc.WithSettingEngine(settingsEngine), webrtc.WithMediaEngine(&mediaEngine))

	return &Manager{
		config:      cfg,
		rooms:       make(map[string]*Room),
		connections: make(map[string]*webrtc.PeerConnection),
		api:         api,
	}
}

// CreateRoom creates a new WebRTC room
func (m *Manager) CreateRoom(sessionID string) (*Room, error) {
	roomID := uuid.New().String()

	room := &Room{
		ID:           roomID,
		SessionID:    sessionID,
		Participants: make(map[string]*Participant),
		Tracks:       make(map[string]*webrtc.TrackLocalStaticRTP),
		CreatedAt:    time.Now(),
		Status:       "waiting",
	}

	m.mu.Lock()
	m.rooms[roomID] = room
	m.mu.Unlock()

	log.Printf("Created WebRTC room: %s for session: %s", roomID, sessionID)

	return room, nil
}

// GetRoom retrieves a room by ID
func (m *Manager) GetRoom(roomID string) (*Room, error) {
	m.mu.RLock()
	room, ok := m.rooms[roomID]
	m.mu.RUnlock()

	if !ok {
		return nil, fmt.Errorf("room not found: %s", roomID)
	}

	return room, nil
}

// GetRoomBySession retrieves a room by session ID
func (m *Manager) GetRoomBySession(sessionID string) (*Room, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, room := range m.rooms {
		if room.SessionID == sessionID {
			return room, nil
		}
	}

	return nil, fmt.Errorf("room not found for session: %s", sessionID)
}

// JoinRoom adds a participant to a room and creates peer connection
func (m *Manager) JoinRoom(roomID string, userID string, userRole string) (*Participant, *webrtc.PeerConnection, error) {
	room, err := m.GetRoom(roomID)
	if err != nil {
		return nil, nil, err
	}

	// Check max participants
	room.mu.RLock()
	if len(room.Participants) >= m.config.MaxParticipants {
		room.mu.RUnlock()
		return nil, nil, fmt.Errorf("room is full")
	}
	room.mu.RUnlock()

	// Create peer connection
	pc, err := m.createPeerConnection(roomID)
	if err != nil {
		return nil, nil, err
	}

	participantID := uuid.New().String()
	participant := &Participant{
		ID:         participantID,
		UserID:     userID,
		Role:       userRole,
		Connection: pc,
		JoinedAt:   time.Now(),
		StreamID:   uuid.New().String(),
	}

	room.mu.Lock()
	room.Participants[participantID] = participant
	if len(room.Participants) >= 2 {
		room.Status = "active"
	}
	room.mu.Unlock()

	m.mu.Lock()
	m.connections[participantID] = pc
	m.mu.Unlock()

	log.Printf("Participant %s (%s) joined room %s", userID, userRole, roomID)

	return participant, pc, nil
}

// LeaveRoom removes a participant from a room
func (m *Manager) LeaveRoom(roomID string, participantID string) error {
	room, err := m.GetRoom(roomID)
	if err != nil {
		return err
	}

	room.mu.Lock()
	participant, ok := room.Participants[participantID]
	if !ok {
		room.mu.Unlock()
		return fmt.Errorf("participant not found")
	}

	now := time.Now()
	participant.LeftAt = &now
	participant.Connection.Close()
	delete(room.Participants, participantID)

	// If no participants left, close room
	if len(room.Participants) == 0 {
		room.Status = "ended"
	}
	room.mu.Unlock()

	m.mu.Lock()
	delete(m.connections, participantID)
	m.mu.Unlock()

	log.Printf("Participant %s left room %s", participantID, roomID)

	return nil
}

// createPeerConnection creates a new WebRTC peer connection
func (m *Manager) createPeerConnection(roomID string) (*webrtc.PeerConnection, error) {
	// Configure ICE servers
	iceServers := []webrtc.ICEServer{}
	for _, server := range m.config.ICEServers {
		iceServers = append(iceServers, webrtc.ICEServer{
			URLs: server.URLs,
		})
	}
	for _, server := range m.config.TURNServers {
		iceServers = append(iceServers, webrtc.ICEServer{
			URLs:       server.URLs,
			Username:   server.Username,
			Credential: server.Password,
		})
	}

	config := webrtc.Configuration{
		ICEServers: iceServers,
	}

	pc, err := m.api.NewPeerConnection(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create peer connection: %v", err)
	}

	// Handle incoming tracks
	pc.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
		log.Printf("Track received: %s in room %s", track.ID(), roomID)

		room, err := m.GetRoom(roomID)
		if err != nil {
			return
		}

		// Create local track to relay to other participants
		localTrack, err := webrtc.NewTrackLocalStaticRTP(track.Codec().RTPCodecCapability, track.ID(), track.StreamID())
		if err != nil {
			log.Printf("Failed to create local track: %v", err)
			return
		}

		room.mu.Lock()
		room.Tracks[track.ID()] = localTrack
		room.mu.Unlock()

		// Read from remote track and write to local track
		go func() {
			rtpBuf := make([]byte, 1500)
			for {
				_, _, err := track.Read(rtpBuf)
				if err != nil {
					log.Printf("Track read error: %v", err)
					return
				}

				_, err = localTrack.Write(rtpBuf)
				if err != nil {
					log.Printf("Local track write error: %v", err)
					return
				}
			}
		}()
	})

	// Handle connection state changes
	pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		log.Printf("Connection state changed: %s for room %s", state, roomID)

		if state == webrtc.PeerConnectionStateDisconnected ||
			state == webrtc.PeerConnectionStateFailed ||
			state == webrtc.PeerConnectionStateClosed {
			// Clean up connection
			log.Printf("Connection closed for room %s", roomID)
		}
	})

	// Handle ICE candidates
	pc.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		if candidate == nil {
			return
		}

		// ICE candidate will be sent via signaling channel
		log.Printf("ICE candidate discovered for room %s", roomID)
	})

	return pc, nil
}

// AddTrack adds a local track to a peer connection
func (m *Manager) AddTrack(roomID string, participantID string, trackType string) (*webrtc.TrackLocalStaticRTP, error) {
	m.mu.RLock()
	pc, ok := m.connections[participantID]
	m.mu.RUnlock()

	if !ok {
		return nil, fmt.Errorf("connection not found")
	}

	// Create track
	var codec webrtc.RTPCodecCapability
	if trackType == "audio" {
		codec = webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeOpus}
	} else {
		codec = webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeVP8}
	}

	trackID := uuid.New().String()
	streamID := uuid.New().String()

	track, err := webrtc.NewTrackLocalStaticRTP(codec, trackID, streamID)
	if err != nil {
		return nil, fmt.Errorf("failed to create track: %v", err)
	}

	// Add track to connection
	_, err = pc.AddTrack(track)
	if err != nil {
		return nil, fmt.Errorf("failed to add track: %v", err)
	}

	room, err := m.GetRoom(roomID)
	if err == nil {
		room.mu.Lock()
		room.Tracks[trackID] = track
		room.mu.Unlock()
	}

	log.Printf("Track %s added for participant %s in room %s", trackType, participantID, roomID)

	return track, nil
}

// CreateOffer creates an SDP offer
func (m *Manager) CreateOffer(participantID string) (string, error) {
	m.mu.RLock()
	pc, ok := m.connections[participantID]
	m.mu.RUnlock()

	if !ok {
		return "", fmt.Errorf("connection not found")
	}

	offer, err := pc.CreateOffer(nil)
	if err != nil {
		return "", fmt.Errorf("failed to create offer: %v", err)
	}

	err = pc.SetLocalDescription(offer)
	if err != nil {
		return "", fmt.Errorf("failed to set local description: %v", err)
	}

	return offer.SDP, nil
}

// HandleAnswer handles an SDP answer
func (m *Manager) HandleAnswer(participantID string, sdp string) error {
	m.mu.RLock()
	pc, ok := m.connections[participantID]
	m.mu.RUnlock()

	if !ok {
		return fmt.Errorf("connection not found")
	}

	answer := webrtc.SessionDescription{
		SDP:  sdp,
		Type: webrtc.SDPTypeAnswer,
	}

	err := pc.SetRemoteDescription(answer)
	if err != nil {
		return fmt.Errorf("failed to set remote description: %v", err)
	}

	log.Printf("Answer set for participant %s", participantID)

	return nil
}

// AddICECandidate adds an ICE candidate
func (m *Manager) AddICECandidate(participantID string, candidateJSON string) error {
	m.mu.RLock()
	pc, ok := m.connections[participantID]
	m.mu.RUnlock()

	if !ok {
		return fmt.Errorf("connection not found")
	}

	var candidate webrtc.ICECandidateInit
	if err := json.Unmarshal([]byte(candidateJSON), &candidate); err != nil {
		return fmt.Errorf("failed to parse candidate: %v", err)
	}

	err := pc.AddICECandidate(candidate)
	if err != nil {
		return fmt.Errorf("failed to add ICE candidate: %v", err)
	}

	return nil
}

// GetICEServers returns configured ICE servers
func (m *Manager) GetICEServers() []models.ICEServer {
	servers := []models.ICEServer{}

	for _, s := range m.config.ICEServers {
		servers = append(servers, models.ICEServer{
			URLs: s.URLs,
		})
	}

	for _, s := range m.config.TURNServers {
		servers = append(servers, models.ICEServer{
			URLs:     s.URLs,
			Username: s.Username,
			Password: s.Password,
		})
	}

	return servers
}

// CloseRoom closes a room and cleans up
func (m *Manager) CloseRoom(roomID string) error {
	room, err := m.GetRoom(roomID)
	if err != nil {
		return err
	}

	room.mu.Lock()
	for _, participant := range room.Participants {
		participant.Connection.Close()
		m.mu.Lock()
		delete(m.connections, participant.ID)
		m.mu.Unlock()
	}
	room.Status = "ended"
	room.mu.Unlock()

	m.mu.Lock()
	delete(m.rooms, roomID)
	m.mu.Unlock()

	log.Printf("Room %s closed", roomID)

	return nil
}

// GetRoomInfo returns room information
func (m *Manager) GetRoomInfo(roomID string) (map[string]interface{}, error) {
	room, err := m.GetRoom(roomID)
	if err != nil {
		return nil, err
	}

	room.mu.RLock()
	defer room.mu.RUnlock()

	participants := []map[string]interface{}{}
	for _, p := range room.Participants {
		participants = append(participants, map[string]interface{}{
			"id":       p.ID,
			"userId":   p.UserID,
			"role":     p.Role,
			"joinedAt": p.JoinedAt,
			"isMuted":  p.IsMuted,
			"isVideoOff": p.IsVideoOff,
		})
	}

	return map[string]interface{}{
		"id":           room.ID,
		"sessionId":    room.SessionID,
		"status":       room.Status,
		"participants": participants,
		"createdAt":    room.CreatedAt,
	}, nil
}