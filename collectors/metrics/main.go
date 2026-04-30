package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2"
	"github.com/google/uuid"
	"gopkg.in/yaml.v3"

	"github.com/getmetraly/metraly/collectors/metrics/adapters"
)

type Config struct {
	ClickHouse  HostPortConfig `yaml:"clickhouse"`
	Pushgateway HostPortConfig `yaml:"pushgateway"`
	PollInterval int           `yaml:"poll_interval"`
	Teams       []TeamConfig   `yaml:"teams"`
}

type HostPortConfig struct {
	Host string `yaml:"host"`
	Port int    `yaml:"port"`
}

type TeamConfig struct {
	ID      string             `yaml:"id"`
	Name    string             `yaml:"name"`
	Sources []SourceConfig     `yaml:"sources"`
}

type SourceConfig struct {
	Type   string            `yaml:"type"`
	Config map[string]string `yaml:"config"`
}

var config Config

func main() {
	loadConfig(&config)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go startPushgatewayServer(ctx)
	go startPolling(ctx)

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	log.Println("Shutting down...")
}

func loadConfig(cfg *Config) {
	data, err := os.ReadFile("config.yaml")
	if err != nil {
		log.Fatalf("Failed to read config: %v", err)
	}
	if err := yaml.Unmarshal(data, cfg); err != nil {
		log.Fatalf("Failed to parse config: %v", err)
	}
}

func startPushgatewayServer(ctx context.Context) {
	addr := fmt.Sprintf("%s:%d", config.Pushgateway.Host, config.Pushgateway.Port)
	if addr == ":" {
		addr = ":9091"
	}
	log.Printf("Starting Pushgateway server on %s", addr)

	mux := http.NewServeMux()
	mux.HandleFunc("/metrics/job/", handlePushgateway)
	mux.HandleFunc("/metrics", handlePushgateway)

	if err := http.ListenAndServe(addr, mux); err != nil && err != http.ErrServerClosed {
		log.Printf("Pushgateway server error: %v", err)
	}
}

func handlePushgateway(w http.ResponseWriter, r *http.Request) {
	var payload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	teamID := findTeamBySource("prometheus")

	event := adapters.Event{
		ID:         uuid.New().String(),
		SourceType: "metrics",
		EventType:  "prometheus_push",
		TeamID:     teamID,
		Payload:   mustMarshal(payload),
		OccurredAt: time.Now(),
	}

	saveEvent(event)
	w.WriteHeader(http.StatusOK)
}

func findTeamBySource(sourceType string) string {
	for _, team := range config.Teams {
		for _, source := range team.Sources {
			if source.Type == sourceType {
				return team.ID
			}
		}
	}
	return ""
}

func startPolling(ctx context.Context) {
	interval := config.PollInterval
	if interval == 0 {
		interval = 5
	}
	ticker := time.NewTicker(time.Duration(interval) * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			pollMetricsSources(ctx)
		}
	}
}

func pollMetricsSources(ctx context.Context) {
	for _, team := range config.Teams {
		for _, source := range team.Sources {
			switch source.Type {
			case "prometheus":
				adapters.FetchPrometheusMetrics(ctx, team.ID, source.Config, saveEvent)
			}
		}
	}
}

func saveEvent(event adapters.Event) {
	ctx := context.Background()
	conn, err := clickhouse.Open(&clickhouse.Options{
		Addr: []string{fmt.Sprintf("%s:%d", config.ClickHouse.Host, config.ClickHouse.Port)},
	})
	if err != nil {
		log.Printf("Failed to connect to ClickHouse: %v", err)
		return
	}
	defer conn.Close()

	query := `INSERT INTO events (id, source_type, event_type, team_id, payload, occurred_at) VALUES (?, ?, ?, ?, ?, ?)`
	if err := conn.AsyncInsert(ctx, query, false, event.ID, event.SourceType, event.EventType, event.TeamID, event.Payload, event.OccurredAt); err != nil {
		log.Printf("Failed to insert event: %v", err)
	}
}

func mustMarshal(v interface{}) json.RawMessage {
	data, _ := json.Marshal(v)
	return data
}