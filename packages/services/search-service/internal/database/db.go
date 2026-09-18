package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"consultancy/search-service/internal/config"

	_ "github.com/lib/pq"
)

type DB struct {
	pool *sql.DB
}

func New(cfg config.DatabaseConfig) (*DB, error) {
	connStr := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Name,
	)

	pool, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	pool.SetMaxOpenConns(cfg.MaxConnections)
	pool.SetMaxIdleConns(cfg.MaxConnections / 2)
	pool.SetConnMaxLifetime(time.Hour)

	// Verify connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := pool.PingContext(ctx); err != nil {
		return nil, err
	}

	return &DB{pool: pool}, nil
}

func (db *DB) Close() error {
	return db.pool.Close()
}

func (db *DB) Query(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error) {
	return db.pool.QueryContext(ctx, query, args...)
}

func (db *DB) QueryRow(ctx context.Context, query string, args ...interface{}) *sql.Row {
	return db.pool.QueryRowContext(ctx, query, args...)
}

func (db *DB) Exec(ctx context.Context, query string, args ...interface{}) (sql.Result, error) {
	return db.pool.ExecContext(ctx, query, args...)
}