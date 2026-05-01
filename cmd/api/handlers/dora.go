package handlers

import (
	"encoding/json"
	"net/http"
)

type DORAHandler struct{}

func NewDORAHandler() *DORAHandler {
	return &DORAHandler{}
}

func (h *DORAHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	series := []map[string]any{
		{"date": "2026-01-01", "value": 0.5},
		{"date": "2026-02-01", "value": 0.8},
		{"date": "2026-03-01", "value": 1.2},
		{"date": "2026-04-01", "value": 1.5},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"deploy-freq": map[string]any{
			"current":   "daily",
			"trend":     "improving",
			"score":     "elite",
			"series":    series,
		},
		"lead-time": map[string]any{
			"current":   "2 days",
			"trend":      "improving",
			"score":     "elite",
			"series":    series,
		},
		"mttr": map[string]any{
			"current":   "1 hour",
			"trend":      "stable",
			"score":     "high",
			"series":    series,
		},
		"change-fail": map[string]any{
			"current":   "5%",
			"trend":      "improving",
			"score":     "elite",
			"series":    series,
		},
	})
}