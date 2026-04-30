package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/azyoskol/tl-tools/api/pkg/database"
)

type ComparisonHandler struct {
	db database.Database
}

func NewComparisonHandler(db database.Database) *ComparisonHandler {
	return &ComparisonHandler{db: db}
}

func (h *ComparisonHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	rows, _ := h.db.Query(r.Context(), `
		SELECT t.id as team_id, t.name,
			(SELECT count() FROM events WHERE team_id = t.id AND source_type = 'git' AND event_type = 'pr_merged' AND occurred_at > now() - INTERVAL 7 DAY) as prs,
			(SELECT count() FROM events WHERE team_id = t.id AND source_type = 'pm' AND event_type = 'task_completed' AND occurred_at > now() - INTERVAL 7 DAY) as tasks,
			(SELECT count() FROM events WHERE team_id = t.id AND source_type = 'cicd' AND event_type = 'pipeline_run' AND occurred_at > now() - INTERVAL 7 DAY) as ci_runs
		FROM teams t
	`)

	var teams []map[string]any
	for _, r := range rows {
		teams = append(teams, map[string]any{
			"team_id": r["team_id"],
			"name":    r["name"],
			"prs":     r["prs"],
			"tasks":   r["tasks"],
			"ci_runs": r["ci_runs"],
		})
	}

	json.NewEncoder(w).Encode(map[string]any{"teams": teams})
}