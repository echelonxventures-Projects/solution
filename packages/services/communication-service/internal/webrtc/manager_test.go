package webrtc

import (
	"testing"

	"consultancy/communication-service/internal/config"
)

func testManager() *Manager {
	return NewManager(config.WebRTCConfig{
		MaxParticipants:         2,
		SessionTimeoutMinutes:   30,
	})
}

func TestCreateRoom(t *testing.T) {
	m := testManager()
	room, err := m.CreateRoom("session-123")
	if err != nil {
		t.Fatalf("CreateRoom() error = %v", err)
	}
	if room.ID == "" {
		t.Error("room.ID is empty")
	}
	if room.SessionID != "session-123" {
		t.Errorf("room.SessionID = %q, want session-123", room.SessionID)
	}
	if room.Status != "waiting" {
		t.Errorf("room.Status = %q, want waiting", room.Status)
	}
	if len(room.Participants) != 0 {
		t.Errorf("expected 0 participants, got %d", len(room.Participants))
	}
}

func TestGetRoom(t *testing.T) {
	m := testManager()
	room, _ := m.CreateRoom("session-1")

	got, err := m.GetRoom(room.ID)
	if err != nil {
		t.Fatalf("GetRoom() error = %v", err)
	}
	if got.ID != room.ID {
		t.Errorf("GetRoom().ID = %q, want %q", got.ID, room.ID)
	}
}

func TestGetRoom_NotFound(t *testing.T) {
	m := testManager()
	if _, err := m.GetRoom("nonexistent"); err == nil {
		t.Error("GetRoom() expected error for nonexistent room, got nil")
	}
}

func TestGetRoomBySession(t *testing.T) {
	m := testManager()
	m.CreateRoom("session-alpha")
	m.CreateRoom("session-beta")

	room, err := m.GetRoomBySession("session-beta")
	if err != nil {
		t.Fatalf("GetRoomBySession() error = %v", err)
	}
	if room.SessionID != "session-beta" {
		t.Errorf("GetRoomBySession().SessionID = %q, want session-beta", room.SessionID)
	}
}

func TestGetRoomBySession_NotFound(t *testing.T) {
	m := testManager()
	if _, err := m.GetRoomBySession("missing"); err == nil {
		t.Error("GetRoomBySession() expected error for missing session, got nil")
	}
}

func TestJoinRoom_BecomesActiveWithTwoParticipants(t *testing.T) {
	m := testManager()
	room, _ := m.CreateRoom("session-1")

	p1, _, err := m.JoinRoom(room.ID, "user-1", "seeker")
	if err != nil {
		t.Fatalf("JoinRoom(1) error = %v", err)
	}
	if p1.UserID != "user-1" || p1.Role != "seeker" {
		t.Errorf("participant = %+v, want user-1/seeker", p1)
	}

	got, _ := m.GetRoom(room.ID)
	if got.Status != "waiting" {
		t.Errorf("after 1 participant, Status = %q, want waiting", got.Status)
	}

	if _, _, err := m.JoinRoom(room.ID, "user-2", "consultant"); err != nil {
		t.Fatalf("JoinRoom(2) error = %v", err)
	}

	got, _ = m.GetRoom(room.ID)
	if got.Status != "active" {
		t.Errorf("after 2 participants, Status = %q, want active", got.Status)
	}
	if len(got.Participants) != 2 {
		t.Errorf("participants = %d, want 2", len(got.Participants))
	}
}

func TestJoinRoom_RoomFull(t *testing.T) {
	m := testManager()
	room, _ := m.CreateRoom("session-1")

	m.JoinRoom(room.ID, "user-1", "seeker")
	m.JoinRoom(room.ID, "user-2", "consultant")

	if _, _, err := m.JoinRoom(room.ID, "user-3", "seeker"); err == nil {
		t.Error("JoinRoom() expected error when room is full, got nil")
	}
}

func TestJoinRoom_RoomNotFound(t *testing.T) {
	m := testManager()
	if _, _, err := m.JoinRoom("nonexistent", "user-1", "seeker"); err == nil {
		t.Error("JoinRoom() expected error for nonexistent room, got nil")
	}
}

func TestLeaveRoom(t *testing.T) {
	m := testManager()
	room, _ := m.CreateRoom("session-1")
	p, _, _ := m.JoinRoom(room.ID, "user-1", "seeker")

	if err := m.LeaveRoom(room.ID, p.ID); err != nil {
		t.Fatalf("LeaveRoom() error = %v", err)
	}

	got, _ := m.GetRoom(room.ID)
	if len(got.Participants) != 0 {
		t.Errorf("after leave, participants = %d, want 0", len(got.Participants))
	}
	if got.Status != "ended" {
		t.Errorf("after last participant leaves, Status = %q, want ended", got.Status)
	}
}

func TestLeaveRoom_ParticipantNotFound(t *testing.T) {
	m := testManager()
	room, _ := m.CreateRoom("session-1")

	if err := m.LeaveRoom(room.ID, "nonexistent-participant"); err == nil {
		t.Error("LeaveRoom() expected error for unknown participant, got nil")
	}
}

func TestLeaveRoom_RoomNotFound(t *testing.T) {
	m := testManager()
	if err := m.LeaveRoom("nonexistent", "p1"); err == nil {
		t.Error("LeaveRoom() expected error for nonexistent room, got nil")
	}
}

func TestCloseRoom(t *testing.T) {
	m := testManager()
	room, _ := m.CreateRoom("session-1")
	m.JoinRoom(room.ID, "user-1", "seeker")

	if err := m.CloseRoom(room.ID); err != nil {
		t.Fatalf("CloseRoom() error = %v", err)
	}

	if _, err := m.GetRoom(room.ID); err == nil {
		t.Error("GetRoom() expected error after CloseRoom, got nil")
	}
}

func TestCloseRoom_NotFound(t *testing.T) {
	m := testManager()
	if err := m.CloseRoom("nonexistent"); err == nil {
		t.Error("CloseRoom() expected error for nonexistent room, got nil")
	}
}

func TestGetRoomInfo(t *testing.T) {
	m := testManager()
	room, _ := m.CreateRoom("session-1")
	p, _, _ := m.JoinRoom(room.ID, "user-1", "seeker")

	info, err := m.GetRoomInfo(room.ID)
	if err != nil {
		t.Fatalf("GetRoomInfo() error = %v", err)
	}
	if info["id"] != room.ID {
		t.Errorf("info[id] = %v, want %s", info["id"], room.ID)
	}
	if info["sessionId"] != "session-1" {
		t.Errorf("info[sessionId] = %v, want session-1", info["sessionId"])
	}
	if info["status"] != "waiting" {
		t.Errorf("info[status] = %v, want waiting", info["status"])
	}

	participants, ok := info["participants"].([]map[string]interface{})
	if !ok {
		t.Fatalf("info[participants] is not a slice, got %T", info["participants"])
	}
	if len(participants) != 1 {
		t.Fatalf("participants len = %d, want 1", len(participants))
	}
	if participants[0]["userId"] != "user-1" {
		t.Errorf("participant[0][userId] = %v, want user-1", participants[0]["userId"])
	}
	if participants[0]["id"] != p.ID {
		t.Errorf("participant[0][id] = %v, want %s", participants[0]["id"], p.ID)
	}
}

func TestGetRoomInfo_NotFound(t *testing.T) {
	m := testManager()
	if _, err := m.GetRoomInfo("nonexistent"); err == nil {
		t.Error("GetRoomInfo() expected error for nonexistent room, got nil")
	}
}

func TestGetICEServers(t *testing.T) {
	m := NewManager(config.WebRTCConfig{
		ICEServers: []config.ICEServerConfig{
			{URLs: []string{"stun:stun.l.google.com:19302"}},
		},
		TURNServers: []config.TURNServerConfig{
			{URLs: []string{"turn:turn.example.com"}, Username: "user", Password: "pass"},
		},
	})

	servers := m.GetICEServers()
	if len(servers) != 2 {
		t.Fatalf("GetICEServers() returned %d servers, want 2", len(servers))
	}
	if len(servers[0].URLs) != 1 || servers[0].URLs[0] != "stun:stun.l.google.com:19302" {
		t.Errorf("STUN server = %+v", servers[0])
	}
	if servers[1].Username != "user" || servers[1].Password != "pass" {
		t.Errorf("TURN server = %+v, want username/password set", servers[1])
	}
}

func TestGetICEServers_Empty(t *testing.T) {
	m := testManager()
	if servers := m.GetICEServers(); len(servers) != 0 {
		t.Errorf("GetICEServers() = %v, want empty", servers)
	}
}
