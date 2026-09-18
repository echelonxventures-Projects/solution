package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"consultancy/billing-service/internal/config"

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

func (db *DB) BeginTx(ctx context.Context) (*sql.Tx, error) {
	return db.pool.BeginTx(ctx, nil)
}

// Helper functions for common operations
func (db *DB) FindOne(ctx context.Context, table string, id string) (*sql.Row, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE id = $1", table)
	return db.QueryRow(ctx, query, id), nil
}

func (db *DB) FindAll(ctx context.Context, table string, conditions map[string]interface{}) (*sql.Rows, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE deleted_at IS NULL", table)
	for key, val := range conditions {
		query += fmt.Sprintf(" AND %s = '%v'", key, val)
	}
	return db.Query(ctx, query)
}

func (db *DB) Insert(ctx context.Context, table string, data map[string]interface{}) error {
	tx, err := db.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	columns := ""
	values := ""
	args := make([]interface{}, 0)
	i := 1
	for col, val := range data {
		if columns != "" {
			columns += ", "
			values += ", "
		}
		columns += col
		values += fmt.Sprintf("$%d", i)
		args = append(args, val)
		i++
	}

	query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)", table, columns, values)
	_, err = tx.ExecContext(ctx, query, args...)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (db *DB) Update(ctx context.Context, table string, id string, data map[string]interface{}) error {
	tx, err := db.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	updates := ""
	args := make([]interface{}, 0)
	args = append(args, id)
	i := 2
	for col, val := range data {
		if updates != "" {
			updates += ", "
		}
		updates += fmt.Sprintf("%s = $%d", col, i)
		args = append(args, val)
		i++
	}

	query := fmt.Sprintf("UPDATE %s SET %s, updated_at = NOW() WHERE id = $1", table, updates)
	_, err = tx.ExecContext(ctx, query, args...)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (db *DB) SoftDelete(ctx context.Context, table string, id string) error {
	query := fmt.Sprintf("UPDATE %s SET deleted_at = NOW() WHERE id = $1", table)
	_, err := db.Exec(ctx, query, id)
	return err
}