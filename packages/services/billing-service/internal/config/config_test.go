package config

import (
	"os"
	"path/filepath"
	"testing"
)

const testConfigYAML = `
server:
  port: "8080"
  host: "0.0.0.0"
database:
  host: localhost
  port: 5432
  name: consultancy
  user: postgres
  password: postgres
  max_connections: 10
kafka:
  brokers:
    - localhost:9092
  topic_prefix: consultancy
stripe:
  api_key: sk_test_123
  webhook_secret: whsec_123
paypal:
  client_id: client_id
  client_secret: client_secret
  mode: sandbox
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
	path := writeTestConfig(t, testConfigYAML)
	cfg, err := Load(path)
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.Server.Port != "8080" {
		t.Errorf("Server.Port = %q, want 8080", cfg.Server.Port)
	}
	if cfg.Database.Port != 5432 {
		t.Errorf("Database.Port = %v, want 5432", cfg.Database.Port)
	}
	if cfg.Database.Name != "consultancy" {
		t.Errorf("Database.Name = %q, want consultancy", cfg.Database.Name)
	}
	if len(cfg.Kafka.Brokers) != 1 || cfg.Kafka.Brokers[0] != "localhost:9092" {
		t.Errorf("Kafka.Brokers = %v, want [localhost:9092]", cfg.Kafka.Brokers)
	}
	if cfg.Stripe.APIKey != "sk_test_123" {
		t.Errorf("Stripe.APIKey = %q, want sk_test_123", cfg.Stripe.APIKey)
	}
	if cfg.PayPal.Mode != "sandbox" {
		t.Errorf("PayPal.Mode = %q, want sandbox", cfg.PayPal.Mode)
	}
	if cfg.Database.MaxConnections != 10 {
		t.Errorf("Database.MaxConnections = %v, want 10", cfg.Database.MaxConnections)
	}
}

func TestLoad_MissingFile(t *testing.T) {
	_, err := Load("/nonexistent/path/config.yaml")
	if err == nil {
		t.Error("Load() expected error for missing file, got nil")
	}
}

func TestLoad_InvalidYAML(t *testing.T) {
	path := writeTestConfig(t, "server: [unclosed")
	_, err := Load(path)
	if err == nil {
		t.Error("Load() expected error for invalid YAML, got nil")
	}
}

func TestLoad_EnvOverrides(t *testing.T) {
	t.Setenv("SERVER_PORT", "9090")
	t.Setenv("DB_HOST", "db.example.com")
	t.Setenv("DB_PORT", "6543")
	t.Setenv("DB_NAME", "prod_db")
	t.Setenv("DB_USER", "prod_user")
	t.Setenv("DB_PASSWORD", "prod_pass")
	t.Setenv("KAFKA_BROKERS", "kafka1:9092,kafka2:9092")

	path := writeTestConfig(t, testConfigYAML)
	cfg, err := Load(path)
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.Server.Port != "9090" {
		t.Errorf("Server.Port = %q, want 9090", cfg.Server.Port)
	}
	if cfg.Database.Host != "db.example.com" {
		t.Errorf("Database.Host = %q, want db.example.com", cfg.Database.Host)
	}
	if cfg.Database.Port != 6543 {
		t.Errorf("Database.Port = %v, want 6543", cfg.Database.Port)
	}
	if cfg.Database.Name != "prod_db" {
		t.Errorf("Database.Name = %q, want prod_db", cfg.Database.Name)
	}
	if cfg.Database.User != "prod_user" {
		t.Errorf("Database.User = %q, want prod_user", cfg.Database.User)
	}
	if cfg.Database.Password != "prod_pass" {
		t.Errorf("Database.Password = %q, want prod_pass", cfg.Database.Password)
	}
	if len(cfg.Kafka.Brokers) != 2 {
		t.Fatalf("Kafka.Brokers len = %v, want 2", len(cfg.Kafka.Brokers))
	}
	if cfg.Kafka.Brokers[0] != "kafka1:9092" || cfg.Kafka.Brokers[1] != "kafka2:9092" {
		t.Errorf("Kafka.Brokers = %v, want [kafka1:9092 kafka2:9092]", cfg.Kafka.Brokers)
	}
}

func TestLoad_EnvOverridesUnsetDoNotChangeDefaults(t *testing.T) {
	os.Unsetenv("SERVER_PORT")
	os.Unsetenv("DB_HOST")

	path := writeTestConfig(t, testConfigYAML)
	cfg, err := Load(path)
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.Server.Port != "8080" {
		t.Errorf("Server.Port = %q, want 8080 (file default)", cfg.Server.Port)
	}
	if cfg.Database.Host != "localhost" {
		t.Errorf("Database.Host = %q, want localhost (file default)", cfg.Database.Host)
	}
}
