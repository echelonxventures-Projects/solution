package config

import (
	"os"
	"path/filepath"
	"testing"
)

const testConfigYAML = `
server:
  port: "3004"
  host: "0.0.0.0"
database:
  host: localhost
  port: 5432
  name: consultancy_communication
  user: postgres
  password: postgres
  max_connections: 20
kafka:
  brokers:
    - localhost:9092
  topic_prefix: consultancy
webrtc:
  ice_servers:
    - urls:
        - stun:stun.l.google.com:19302
  max_participants: 10
  session_timeout_minutes: 120
recording:
  enabled: true
  storage_path: /var/consultancy/recordings
  max_duration_hours: 4
  format: webm
transcription:
  enabled: true
  provider: whisper
  language: auto
signaling:
  port: 3004
  heartbeat_interval_seconds: 30
logging:
  level: info
  format: json
`

func writeTestConfig(t *testing.T, content string) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatalf("failed to write test config: %v", err)
	}
	return path
}

func TestLoad_Defaults(t *testing.T) {
	cfg, err := Load(writeTestConfig(t, testConfigYAML))
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.Server.Port != "3004" {
		t.Errorf("Server.Port = %q, want 3004", cfg.Server.Port)
	}
	if cfg.Database.Name != "consultancy_communication" {
		t.Errorf("Database.Name = %q, want consultancy_communication", cfg.Database.Name)
	}
	if cfg.Database.MaxConnections != 20 {
		t.Errorf("Database.MaxConnections = %v, want 20", cfg.Database.MaxConnections)
	}
	if len(cfg.Kafka.Brokers) != 1 || cfg.Kafka.Brokers[0] != "localhost:9092" {
		t.Errorf("Kafka.Brokers = %v, want [localhost:9092]", cfg.Kafka.Brokers)
	}
	if cfg.WebRTC.MaxParticipants != 10 {
		t.Errorf("WebRTC.MaxParticipants = %v, want 10", cfg.WebRTC.MaxParticipants)
	}
	if len(cfg.WebRTC.ICEServers) != 1 {
		t.Fatalf("WebRTC.ICEServers len = %v, want 1", len(cfg.WebRTC.ICEServers))
	}
	if len(cfg.WebRTC.ICEServers[0].URLs) != 1 {
		t.Errorf("ICEServers[0].URLs = %v, want one URL", cfg.WebRTC.ICEServers[0].URLs)
	}
	if !cfg.Recording.Enabled {
		t.Error("Recording.Enabled = false, want true")
	}
	if cfg.Recording.MaxDurationHours != 4 {
		t.Errorf("Recording.MaxDurationHours = %v, want 4", cfg.Recording.MaxDurationHours)
	}
	if cfg.Transcription.Provider != "whisper" {
		t.Errorf("Transcription.Provider = %q, want whisper", cfg.Transcription.Provider)
	}
	if cfg.Signaling.HeartbeatIntervalSeconds != 30 {
		t.Errorf("Signaling.HeartbeatIntervalSeconds = %v, want 30", cfg.Signaling.HeartbeatIntervalSeconds)
	}
}

func TestLoad_MissingFile(t *testing.T) {
	if _, err := Load("/nonexistent/config.yaml"); err == nil {
		t.Error("Load() expected error for missing file, got nil")
	}
}

func TestLoad_InvalidYAML(t *testing.T) {
	if _, err := Load(writeTestConfig(t, "server: [unclosed")); err == nil {
		t.Error("Load() expected error for invalid YAML, got nil")
	}
}

func TestLoad_EnvOverrides(t *testing.T) {
	t.Setenv("SERVER_PORT", "4000")
	t.Setenv("DB_HOST", "db.example.com")
	t.Setenv("DB_PORT", "6543")
	t.Setenv("DB_NAME", "prod_comm")
	t.Setenv("DB_USER", "comm_user")
	t.Setenv("DB_PASSWORD", "comm_pass")
	t.Setenv("KAFKA_BROKERS", "kafka1:9092,kafka2:9092")

	cfg, err := Load(writeTestConfig(t, testConfigYAML))
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.Server.Port != "4000" {
		t.Errorf("Server.Port = %q, want 4000", cfg.Server.Port)
	}
	if cfg.Database.Host != "db.example.com" {
		t.Errorf("Database.Host = %q, want db.example.com", cfg.Database.Host)
	}
	if cfg.Database.Port != 6543 {
		t.Errorf("Database.Port = %v, want 6543", cfg.Database.Port)
	}
	if cfg.Database.Name != "prod_comm" {
		t.Errorf("Database.Name = %q, want prod_comm", cfg.Database.Name)
	}
	if cfg.Database.User != "comm_user" {
		t.Errorf("Database.User = %q, want comm_user", cfg.Database.User)
	}
	if cfg.Database.Password != "comm_pass" {
		t.Errorf("Database.Password = %q, want comm_pass", cfg.Database.Password)
	}
	if len(cfg.Kafka.Brokers) != 2 {
		t.Fatalf("Kafka.Brokers len = %v, want 2", len(cfg.Kafka.Brokers))
	}
}
