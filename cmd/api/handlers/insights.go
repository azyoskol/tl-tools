package handlers

import (
	"encoding/json"
	"net/http"
)

type InsightsHandler struct{}

func NewInsightsHandler() *InsightsHandler {
	return &InsightsHandler{}
}

func (h *InsightsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	insights := []map[string]any{
		{
			"id":          "ins-1",
			"title":       "Deploy frequency trending up",
			"description": "Your team deployed 40% more this sprint compared to last month. This correlates with reduced cycle time.",
			"severity":    "positive",
			"category":    "dora",
		},
		{
			"id":          "ins-2",
			"title":       "Code review bottleneck detected",
			"description": "Average review time exceeded 24h for 3 consecutive days. Consider adding more reviewers or adjusting capacity.",
			"severity":    "warning",
			"category":    "process",
		},
		{
			"id":          "ins-3",
			"title":       "Tech debt threshold approaching",
			"description": "PR merge rate vs tech debt tickets ratio is 8:1. Consider allocating 20% of next sprint to debt reduction.",
			"severity":    "info",
			"category":    "quality",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"insights": insights,
	})
}