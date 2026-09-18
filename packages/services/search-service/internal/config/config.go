package config

import (
	"os"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server       ServerConfig       `yaml:"server"`
	Database     DatabaseConfig     `yaml:"database"`
	Kafka        KafkaConfig        `yaml:"kafka"`
	Elasticsearch ElasticsearchConfig `yaml:"elasticsearch"`
	Search       SearchConfig       `yaml:"search"`
	Autocomplete AutocompleteConfig `yaml:"autocomplete"`
	Logging      LoggingConfig      `yaml:"logging"`
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

type ElasticsearchConfig struct {
	URLs           []string `yaml:"urls"`
	IndexPrefix    string   `yaml:"index_prefix"`
	RefreshInterval string  `yaml:"refresh_interval"`
	BulkSize       int      `yaml:"bulk_size"`
}

type SearchConfig struct {
	MaxResults       int     `yaml:"max_results"`
	DefaultPageSize  int     `yaml:"default_page_size"`
	MinScore         float64 `yaml:"min_score"`
	HighlightEnabled bool    `yaml:"highlight_enabled"`
}

type AutocompleteConfig struct {
	Enabled       bool `yaml:"enabled"`
	MinCharacters int  `yaml:"min_characters"`
	MaxSuggestions int `yaml:"max_suggestions"`
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
	if esURLs := os.Getenv("ELASTICSEARCH_URL"); esURLs != "" {
		cfg.Elasticsearch.URLs = strings.Split(esURLs, ",")
	}

	return &cfg, nil
}