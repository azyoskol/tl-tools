package database

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/getmetraly/metraly/internal/pkg/config"
)

// clickHouseDB implements Database interface for ClickHouse via HTTP.
type clickHouseDB struct {
	url    string
	client *http.Client
}

// NewClickHouse creates a new ClickHouse database connection via HTTP.
func NewClickHouse(cfg config.Config) (Database, error) {
	host := cfg.Get("CLICKHOUSE_HOST", "localhost")
	port := cfg.Get("CLICKHOUSE_PORT", "8123")

	dbURL := fmt.Sprintf("http://%s:%s/", host, port)
	if _, err := url.Parse(dbURL); err != nil {
		return nil, fmt.Errorf("parse url: %w", err)
	}

	return &clickHouseDB{
		url:    dbURL,
		client: &http.Client{},
	}, nil
}

// Query executes a query and returns results as a slice of maps.
func (c *clickHouseDB) Query(ctx context.Context, query string, args ...any) (QueryResult, error) {
	// Build query URL with parameters - always use JSON format
	params := url.Values{}
	params.Set("database", "default")
	params.Set("query", query + " FORMAT JSON")

	req, err := http.NewRequestWithContext(ctx, "GET", c.url+"?"+params.Encode(), nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("do request: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("http status %d: %s", resp.StatusCode, string(body))
	}

	// Parse JSON response in ClickHouse format
	var chResp struct {
		Data []map[string]json.RawMessage `json:"data"`
	}
	if err := json.Unmarshal(body, &chResp); err != nil {
		return nil, fmt.Errorf("decode json: %w, body: %s", err, string(body))
	}

	// Convert raw messages to any
	qr := make(QueryResult, len(chResp.Data))
	for i, row := range chResp.Data {
		m := make(map[string]any)
		for k, v := range row {
			// Parse as any first
			var parsed any
			if err := json.Unmarshal(v, &parsed); err == nil {
				// Convert string numbers to actual numbers
				m[k] = convertNumeric(parsed)
			} else {
				m[k] = string(v)
			}
		}
		qr[i] = m
	}

	return qr, nil
}

// Exec executes a query without returning results.
func (c *clickHouseDB) Exec(ctx context.Context, query string, args ...any) error {
	params := url.Values{}
	params.Set("database", "default")
	params.Set("query", query)

	req, err := http.NewRequestWithContext(ctx, "GET", c.url+"?"+params.Encode(), nil)
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("do request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("http status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// Ping checks if the database connection is alive.
func (c *clickHouseDB) Ping(ctx context.Context) error {
	params := url.Values{}
	params.Set("query", "SELECT 1")

	req, err := http.NewRequestWithContext(ctx, "GET", c.url+"?"+params.Encode(), nil)
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("do request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("ping failed: %d", resp.StatusCode)
	}

	return nil
}

// convertNumeric converts string numbers to actual numbers.
func convertNumeric(v any) any {
	if s, ok := v.(string); ok {
		// Try to parse as integer first
		var i int64
		if _, err := fmt.Sscanf(s, "%d", &i); err == nil {
			return i
		}
		// Then as float
		var f float64
		if _, err := fmt.Sscanf(s, "%f", &f); err == nil {
			return f
		}
	}
	return v
}