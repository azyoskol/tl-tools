package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/getmetraly/metraly/internal/pkg/database"
	"github.com/go-chi/chi/v5"
)

type VelocityHandler struct {
	db database.Database
}

func NewVelocityHandler(db database.Database) *VelocityHandler {
	return &VelocityHandler{db: db}
}

func (h *VelocityHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	teamID := chi.URLParam(r, "team_id")
	ctx := r.Context()

	cycleRows, _ := h.db.Query(ctx, "SELECT toDate(occurred_at) as date, count() as tasks FROM events WHERE team_id = ? AND source_type = 'pm' AND event_type = 'task_completed' AND occurred_at > now() - INTERVAL 30 DAY GROUP BY date ORDER BY date", teamID)

	leadRows, _ := h.db.Query(ctx, "SELECT toDate(occurred_at) as date, count() as tasks FROM events WHERE team_id = ? AND source_type = 'git' AND event_type = 'pr_merged' AND occurred_at > now() - INTERVAL 30 DAY GROUP BY date ORDER BY date", teamID)

	var cycleTime, leadTime []map[string]any
	for _, r := range cycleRows {
		cycleTime = append(cycleTime, map[string]any{"date": r["date"], "tasks": r["tasks"]})
	}
	for _, r := range leadRows {
		leadTime = append(leadTime, map[string]any{"date": r["date"], "tasks": r["tasks"]})
	}

	json.NewEncoder(w).Encode(map[string]any{
		"cycle_time": cycleTime,
		"lead_time": leadTime,
	})
}