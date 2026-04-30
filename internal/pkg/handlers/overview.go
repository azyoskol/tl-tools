package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/getmetraly/metraly/internal/pkg/database"
	"github.com/go-chi/chi/v5"
)

type OverviewHandler struct {
	db database.Database
}

func NewOverviewHandler(db database.Database) *OverviewHandler {
	return &OverviewHandler{db: db}
}

func (h *OverviewHandler) Routes() http.Handler {
	r := chi.NewRouter()
	r.Get("/{team_id}/overview", h.Overview)
	r.Get("/{team_id}/activity", h.Activity)
	r.Get("/{team_id}/insights", h.Insights)
	return r
}

func (h *OverviewHandler) Overview(w http.ResponseWriter, r *http.Request) {
	teamID := chi.URLParam(r, "team_id")

	prsReview, _ := h.db.Query(r.Context(), "SELECT count() as cnt FROM events WHERE team_id = ? AND source_type = 'git' AND event_type = 'pr_opened' AND occurred_at > now() - INTERVAL 7 DAY", teamID)
	prsMerged, _ := h.db.Query(r.Context(), "SELECT count() as cnt FROM events WHERE team_id = ? AND source_type = 'git' AND event_type = 'pr_merged' AND occurred_at > now() - INTERVAL 7 DAY", teamID)
	blocked, _ := h.db.Query(r.Context(), "SELECT count() as cnt FROM events WHERE team_id = ? AND source_type = 'pm' AND event_type = 'task_blocked' AND occurred_at > now() - INTERVAL 1 DAY", teamID)
	ciFail, _ := h.db.Query(r.Context(), "SELECT count() as cnt FROM events WHERE team_id = ? AND source_type = 'cicd' AND event_type = 'pipeline_failed' AND occurred_at > now() - INTERVAL 1 HOUR", teamID)

	json.NewEncoder(w).Encode(map[string]any{
		"team_id":                teamID,
		"prs_awaiting_review":   getCount(prsReview),
		"prs_merged":            getCount(prsMerged),
		"blocked_tasks":         getCount(blocked),
		"ci_failures_last_hour":  getCount(ciFail),
	})
}

func (h *OverviewHandler) Activity(w http.ResponseWriter, r *http.Request) {
	teamID := chi.URLParam(r, "team_id")
	rows, _ := h.db.Query(r.Context(), "SELECT toDate(occurred_at) as date, source_type, event_type, count() as count FROM events WHERE team_id = ? AND occurred_at > now() - INTERVAL 7 DAY GROUP BY date, source_type, event_type ORDER BY date", teamID)

	var activities []map[string]any
	for _, r := range rows {
		activities = append(activities, map[string]any{
			"date":        r["date"],
			"source_type": r["source_type"],
			"event_type":  r["event_type"],
			"count":       r["count"],
		})
	}
	json.NewEncoder(w).Encode(map[string]any{"data": activities})
}

func (h *OverviewHandler) Insights(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]any{
		"insights": []map[string]any{
			{"type": "info", "message": "Insights feature coming soon"},
		},
	})
}

func getCount(rows []map[string]any) int {
	if len(rows) > 0 {
		return int(rows[0]["cnt"].(int64))
	}
	return 0
}