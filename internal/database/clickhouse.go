package database

import (
	"context"
	"fmt"

	"github.com/azyoskol/tl-tools/api/internal/config"
	"github.com/clickhouse/go-clickhouse/v2"
)

type clickhouseDB struct {
	client *clickhouse.Client
}

func NewClickHouse(cfg config.Config) (Database, error) {
	client, err := clickhouse.Open(&clickhouse.Options{
		Addr:   []string{fmt.Sprintf("%s:%s", cfg.Get("CLICKHOUSE_HOST", "localhost"), cfg.Get("CLICKHOUSE_PORT", "9000"))},
		Settings: clickhouse.Settings{"database": cfg.Get("CLICKHOUSE_DB", "default")},
	})
	if err != nil {
		return nil, fmt.Errorf("clickhouse open: %w", err)
	}

	return &clickhouseDB{client: client}, nil
}

func (c *clickhouseDB) Query(ctx context.Context, query string, args ...any) (QueryResult, error) {
	rows, err := c.client.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results QueryResult
	for rows.Next() {
		var m map[string]any
		if err := rows.ScanMap(&m); err != nil {
			return nil, err
		}
		results = append(results, m)
	}
	return results, rows.Err()
}

func (c *clickhouseDB) Exec(ctx context.Context, query string, args ...any) error {
	return c.client.Exec(ctx, query, args...)
}

func (c *clickhouseDB) Ping(ctx context.Context) error {
	return c.client.Ping(ctx)
}