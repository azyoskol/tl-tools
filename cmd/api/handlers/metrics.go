package handlers

import (
	"encoding/json"
	"net/http"
)

type MetricsHandler struct{}

func NewMetricsHandler() *MetricsHandler {
	return &MetricsHandler{}
}

func (h *MetricsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	series := []map[string]any{
		{"date": "2026-01-01", "value": 100},
		{"date": "2026-02-01", "value": 120},
		{"date": "2026-03-01", "value": 115},
		{"date": "2026-04-01", "value": 130},
	}

	compare := []map[string]any{
		{"period": "prev", "value": 95},
		{"period": "curr", "value": 130},
		{"change": "+36.8%"},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"metric": map[string]any{
			"name":    "PRs Merged",
			"value":   130,
			"unit":    "count",
			"series":  series,
			"compare": compare,
		},
	})
}