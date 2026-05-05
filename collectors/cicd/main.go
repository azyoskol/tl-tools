// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors

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

	"github.com/getmetraly/metraly/collectors/cicd/adapters"
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
	http.HandleFunc("/webhook/github_actions", handleGitHubActionsWebhook)
	http.HandleFunc("/webhook/gitlab_ci", handleGitLabCIWebhook)

	addr := fmt.Sprintf(":%d", config.Webhook.Port)
	log.Printf("Starting CI/CD webhook server on %s", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Printf("Server error: %v", err)
	}
}

func handleGitHubActionsWebhook(w http.ResponseWriter, r *http.Request) {
	var payload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	webhookEvent := r.Header.Get("X-GitHub-Event-Override")
	if webhookEvent == "" {
		webhookEvent = "workflow_run"
	}
	teamID := findTeamBySource("github_actions")

	event := adapters.Event{
		ID:         uuid.New().String(),
		SourceType: "cicd",
		EventType:  "github_actions_" + webhookEvent,
		TeamID:     teamID,
		Payload:    mustMarshal(payload),
		OccurredAt: time.Now(),
	}

	saveEvent(event)
	w.WriteHeader(http.StatusOK)
}

func handleGitLabCIWebhook(w http.ResponseWriter, r *http.Request) {
	var payload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	eventType := r.Header.Get("X-Gitlab-Event")
	teamID := findTeamBySource("gitlab_ci")

	event := adapters.Event{
		ID:         uuid.New().String(),
		SourceType: "cicd",
		EventType:  "gitlab_ci_" + eventType,
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
			pollCICDSources(ctx)
		}
	}
}

func pollCICDSources(ctx context.Context) {
	for _, team := range config.Teams {
		for _, source := range team.Sources {
			switch source.Type {
			case "github_actions":
				adapters.FetchGitHubActions(ctx, team.ID, source.Config, saveEvent)
			case "gitlab_ci":
				adapters.FetchGitLabCIPipelines(ctx, team.ID, source.Config, saveEvent)
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
