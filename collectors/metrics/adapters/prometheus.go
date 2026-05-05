// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors

package adapters

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
)

func FetchPrometheusMetrics(ctx context.Context, teamID string, config map[string]string, save EventSaver) {
	url, ok := config["url"]
	if !ok {
		log.Printf("Prometheus URL not configured for team %s", teamID)
		return
	}

	query := config["query"]
	if query == "" {
		query = "up"
	}

	apiURL := url + "/api/v1/query?query=" + query

	req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
	if err != nil {
		log.Printf("Failed to create request: %v", err)
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Failed to query Prometheus: %v", err)
		return
	}
	defer resp.Body.Close()

	var result struct {
		Status string `json:"status"`
		Data   struct {
			Result []struct {
				Metric map[string]string `json:"metric"`
				Value  []interface{}     `json:"value"`
			} `json:"result"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("Failed to decode response: %v", err)
		return
	}

	if result.Status != "success" {
		log.Printf("Prometheus query returned status: %s", result.Status)
		return
	}

	for _, r := range result.Data.Result {
		payload := map[string]interface{}{
			"metric": r.Metric,
			"values": r.Value,
		}

		event := Event{
			ID:         uuid.New().String(),
			SourceType: "metrics",
			EventType:  "prometheus_query",
			TeamID:     teamID,
			Payload:    mustMarshal(payload),
			OccurredAt: time.Now(),
		}
		save(event)
	}
}

func mustMarshal(v interface{}) json.RawMessage {
	data, _ := json.Marshal(v)
	return data
}
