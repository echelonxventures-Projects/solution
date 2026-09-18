package config

import (
	"os"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server      ServerConfig      `yaml:"server"`
	Database    DatabaseConfig    `yaml:"database"`
	Kafka       KafkaConfig       `yaml:"kafka"`
	WebRTC      WebRTCConfig      `yaml:"webrtc"`
	Recording   RecordingConfig   `yaml:"recording"`
	Transcription TranscriptionConfig `yaml:"transcription"`
	Signaling   SignalingConfig   `yaml:"signaling"`
	Logging     LoggingConfig     `yaml:"logging"`
}

type ServerConfig struct {
	Port string `yaml:"port"`
	Host string `yaml:"host"`
}

type DatabaseConfig struct {
	Host           string `yaml:"host"`
	Port           int    `yaml:"port"`
	Name           string `yaml:"name"`
	User           string `yaml:"user"`
	Password       string `yaml:"password"`
	MaxConnections int    `yaml:"max_connections"`
}

type KafkaConfig struct {
	Brokers      []string `yaml:"brokers"`
	TopicPrefix  string   `yaml:"topic_prefix"`
}

type WebRTCConfig struct {
	ICEServers       []ICEServerConfig `yaml:"ice_servers"`
	TURNServers      []TURNServerConfig `yaml:"turn_servers"`
	MaxParticipants  int               `yaml:"max_participants"`
	SessionTimeoutMinutes int          `yaml:"session_timeout_minutes"`
}

type ICEServerConfig struct {
	URLs []string `yaml:"urls"`
}

type TURNServerConfig struct {
	URLs     []string `yaml:"urls"`
	Username string   `yaml:"username"`
	Password string   `yaml:"password"`
}

type RecordingConfig struct {
	Enabled            bool   `yaml:"enabled"`
	StoragePath        string `yaml:"storage_path"`
	MaxDurationHours   int    `yaml:"max_duration_hours"`
	Format             string `yaml:"format"`
}

type TranscriptionConfig struct {
	Enabled   bool   `yaml:"enabled"`
	Provider  string `yaml:"provider"`
	Language  string `yaml:"language"`
}

type SignalingConfig struct {
	Port                  int `yaml:"port"`
	HeartbeatIntervalSeconds int `yaml:"heartbeat_interval_seconds"`
}

type LoggingConfig struct {
	Level  string `yaml:"level"`
	Format string `yaml:"format"`
}

func Load(filename string) (*Config, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	// Apply environment overrides
	if port := os.Getenv("SERVER_PORT"); port != "" {
		cfg.Server.Port = port
	}
	if dbHost := os.Getenv("DB_HOST"); dbHost != "" {
		cfg.Database.Host = dbHost
	}
	if dbPort := os.Getenv("DB_PORT"); dbPort != "" {
		cfg.Database.Port, _ = strconv.Atoi(dbPort)
	}
	if dbName := os.Getenv("DB_NAME"); dbName != "" {
		cfg.Database.Name = dbName
	}
	if dbUser := os.Getenv("DB_USER"); dbUser != "" {
		cfg.Database.User = dbUser
	}
	if dbPassword := os.Getenv("DB_PASSWORD"); dbPassword != "" {
		cfg.Database.Password = dbPassword
	}
	if brokers := os.Getenv("KAFKA_BROKERS"); brokers != "" {
		cfg.Kafka.Brokers = strings.Split(brokers, ",")
	}

	return &cfg, nil
}