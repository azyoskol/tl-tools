package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/getmetraly/metraly/internal/pkg/database"
	"github.com/go-chi/chi/v5"
)

type TeamsHandler struct {
	db database.Database
}

func NewTeamsHandler(db database.Database) *TeamsHandler {
	return &TeamsHandler{db: db}
}

func (h *TeamsHandler) Routes() http.Handler {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Get("/{team_id}", h.Get)
	r.Get("/{team_id}/overview", h.Overview)
	r.Get("/{team_id}/activity", h.Activity)
	r.Get("/{team_id}/insights", h.Insights)
	return r
}

func (h *TeamsHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), "SELECT id, name FROM teams")
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	var teams []map[string]any
	for _, row := range rows {
		teams = append(teams, map[string]any{"id": row["id"], "name": row["name"]})
	}
	json.NewEncoder(w).Encode(teams)
}

func (h *TeamsHandler) Get(w http.ResponseWriter, r *http.Request) {
	teamID := chi.URLParam(r, "team_id")
	if teamID == "comparison" {
		http.Error(w, `{"detail":"Team not found"}`, 404)
		return
	}

	rows, err := h.db.Query(r.Context(), "SELECT id, name FROM teams WHERE id = ?", teamID)
	if err != nil || len(rows) == 0 {
		http.Error(w, `{"detail":"Team not found"}`, 404)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"id": rows[0]["id"], "name": rows[0]["name"]})
}

func (h *TeamsHandler) Overview(w http.ResponseWriter, r *http.Request) {
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
		"ci_failures_last_hour": getCount(ciFail),
	})
}

func (h *TeamsHandler) Activity(w http.ResponseWriter, r *http.Request) {
	teamID := chi.URLParam(r, "team_id")
	rows, _ := h.db.Query(r.Context(), "SELECT toDate(occurred_at) as date, source_type, event_type, count() as count FROM events WHERE team_id = ? AND occurred_at > now() - INTERVAL 7 DAY GROUP BY date, source_type, event_type ORDER BY date", teamID)

	var activities []map[string]any
	for _, row := range rows {
		activities = append(activities, map[string]any{
			"date":        row["date"],
			"source_type": row["source_type"],
			"event_type":  row["event_type"],
			"count":       row["count"],
		})
	}
	json.NewEncoder(w).Encode(map[string]any{"data": activities})
}

func (h *TeamsHandler) Insights(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]any{
		"insights": []map[string]any{
			{"type": "info", "message": "Insights feature coming soon"},
		},
	})
}