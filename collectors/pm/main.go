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

	"github.com/tl-tools/collectors/pm/adapters"
)

type Config struct {
	ClickHouse struct {
		Host string `yaml:"host"`
		Port int    `yaml:"port"`
	} `yaml:"clickhouse"`
	Webhook struct {
		Port int `yaml:"port"`
	} `yaml:"webhook"`
	PollInterval int `yaml:"poll_interval"`
	Teams        []struct {
		ID      string `yaml:"id"`
		Name    string `yaml:"name"`
		Sources []struct {
			Type   string            `yaml:"type"`
			Config map[string]string `yaml:"config"`
		} `yaml:"sources"`
	} `yaml:"teams"`
}

var config Config

func main() {
	loadConfig(&config)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go startWebhookServer(ctx)
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

func startWebhookServer(ctx context.Context) {
	http.HandleFunc("/webhook/jira", handleJiraWebhook)
	http.HandleFunc("/webhook/linear", handleLinearWebhook)

	addr := fmt.Sprintf(":%d", config.Webhook.Port)
	log.Printf("Starting PM webhook server on %s", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Printf("Server error: %v", err)
	}
}

func handleJiraWebhook(w http.ResponseWriter, r *http.Request) {
	var payload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	webhookEvent := r.URL.Query().Get("webhookEvent")
	teamID := findTeamBySource("jira")

	event := adapters.Event{
		ID:         uuid.New().String(),
		SourceType: "pm",
		EventType:  "jira_" + webhookEvent,
		TeamID:     teamID,
		Payload:    mustMarshal(payload),
		OccurredAt: time.Now(),
	}

	saveEvent(event)
	w.WriteHeader(http.StatusOK)
}

func handleLinearWebhook(w http.ResponseWriter, r *http.Request) {
	var payload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	teamID := findTeamBySource("linear")

	eventType, ok := payload["type"].(string)
	if !ok {
		eventType = "unknown"
	}

	event := adapters.Event{
		ID:         uuid.New().String(),
		SourceType: "pm",
		EventType:  "linear_" + eventType,
		TeamID:     teamID,
		Payload:    mustMarshal(payload),
		OccurredAt: time.Now(),
	}

	saveEvent(event)
	w.WriteHeader(http.StatusOK)
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
			pollPMSources(ctx)
		}
	}
}

func pollPMSources(ctx context.Context) {
	for _, team := range config.Teams {
		for _, source := range team.Sources {
			switch source.Type {
			case "jira":
				adapters.FetchJiraIssues(ctx, team.ID, source.Config, saveEvent)
			case "linear":
				adapters.FetchLinearIssues(ctx, team.ID, source.Config, saveEvent)
			}
		}
	}
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