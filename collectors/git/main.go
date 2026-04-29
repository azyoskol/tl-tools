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
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"gopkg.in/yaml.v3"
	
	"github.com/azyoskol/tl-tools/collectors/shared/retry"
)

type Config struct {
	ClickHouse struct {
		Host string `yaml:"host"`
		Port int    `yaml:"port"`
	} `yaml:"clickhouse"`
	Webhook struct {
		Port int `yaml:"port"`
	} `yaml:"webhook"`
	Teams []struct {
		ID      string `yaml:"id"`
		Name    string `yaml:"name"`
		Sources []struct {
			Type   string            `yaml:"type"`
			Config map[string]string `yaml:"config"`
		} `yaml:"sources"`
	} `yaml:"teams"`
}

type Event struct {
	ID          string          `json:"id"`
	SourceType  string          `json:"source_type"`
	EventType   string          `json:"event_type"`
	TeamID      string          `json:"team_id"`
	ProjectID   *string         `json:"project_id"`
	Payload     json.RawMessage `json:"payload"`
	OccurredAt  time.Time       `json:"occurred_at"`
}

var config Config

var (
	eventsProcessed = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "collector_events_total",
			Help: "Total number of events processed",
		},
	)
	eventsFailed = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "collector_events_failed_total",
			Help: "Total number of events failed",
		},
	)
)

func init() {
	prometheus.MustRegister(eventsProcessed)
	prometheus.MustRegister(eventsFailed)
}

func main() {
	loadConfig(&config)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go startWebhookServer(ctx)

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

func startWebhookServer(ctx context.Context) {
	http.HandleFunc("/webhook/github", handleGitHubWebhook)
	http.HandleFunc("/webhook/gitlab", handleGitLabWebhook)
	http.Handle("/metrics", promhttp.Handler())

	addr := fmt.Sprintf(":%d", config.Webhook.Port)
	log.Printf("Starting webhook server on %s", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Printf("Server error: %v", err)
	}
}

func handleGitHubWebhook(w http.ResponseWriter, r *http.Request) {
	var payload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	eventType := r.Header.Get("X-GitHub-Event")
	teamID := findTeamBySource("github")

	event := Event{
		ID:         uuid.New().String(),
		SourceType: "git",
		EventType:  eventType,
		TeamID:     teamID,
		Payload:    mustMarshal(payload),
		OccurredAt: time.Now(),
	}

	saveEvent(event)
	w.WriteHeader(http.StatusOK)
}

func handleGitLabWebhook(w http.ResponseWriter, r *http.Request) {
	var payload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	eventType := r.Header.Get("X-Gitlab-Event")
	teamID := findTeamBySource("gitlab")

	event := Event{
		ID:         uuid.New().String(),
		SourceType: "git",
		EventType:  eventType,
		TeamID:     teamID,
		Payload:    mustMarshal(payload),
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

func saveEvent(event Event) {
	ctx := context.Background()
	
	err := retry.WithRetry(ctx, func() error {
		conn, err := clickhouse.Open(&clickhouse.Options{
			Addr: []string{fmt.Sprintf("%s:%d", config.ClickHouse.Host, config.ClickHouse.Port)},
		})
		if err != nil {
			return fmt.Errorf("failed to connect: %w", err)
		}
		defer conn.Close()

		query := `INSERT INTO events (id, source_type, event_type, team_id, payload, occurred_at) VALUES (?, ?, ?, ?, ?, ?)`
		return conn.AsyncInsert(ctx, query, false, event.ID, event.SourceType, event.EventType, event.TeamID, event.Payload, event.OccurredAt)
	})
	
	if err != nil {
		log.Printf("Failed to insert event after retries: %v", err)
		eventsFailed.Inc()
		saveToDLQ(event, err.Error())
	} else {
		eventsProcessed.Inc()
	}
}

func saveToDLQ(event Event, errorMsg string) {
	ctx := context.Background()
	conn, err := clickhouse.Open(&clickhouse.Options{
		Addr: []string{fmt.Sprintf("%s:%d", config.ClickHouse.Host, config.ClickHouse.Port)},
	})
	if err != nil {
		log.Printf("Failed to connect to ClickHouse for DLQ: %v", err)
		return
	}
	defer conn.Close()

	query := `INSERT INTO events_dlq (id, original_payload, source_type, event_type, team_id, error_reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
	if err := conn.AsyncInsert(ctx, query, false, event.ID, string(event.Payload), event.SourceType, event.EventType, event.TeamID, errorMsg, time.Now()); err != nil {
		log.Printf("Failed to save to DLQ: %v", err)
	}
}

func mustMarshal(v interface{}) json.RawMessage {
	data, _ := json.Marshal(v)
	return data
}