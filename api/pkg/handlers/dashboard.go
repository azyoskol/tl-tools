package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/azyoskol/tl-tools/api/pkg/database"
)

type DashboardHandler struct {
	db database.Database
}

func NewDashboardHandler(db database.Database) *DashboardHandler {
	return &DashboardHandler{db: db}
}

func (h *DashboardHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	json.NewEncoder(w).Encode(map[string]any{
		"overview":    h.getOverview(ctx),
		"activity":    h.getActivity(ctx),
		"top_teams":   h.getTopTeams(ctx),
		"hourly":      h.getHourly(ctx),
		"top_authors": h.getTopAuthors(ctx),
	})
}

func (h *DashboardHandler) getOverview(ctx context.Context) map[string]int {
	metrics := []struct {
		key, source, event, period string
	}{
		{"prs_opened", "git", "pr_opened", "INTERVAL 2 DAY"},
		{"tasks_blocked", "pm", "task_blocked", "INTERVAL 1 DAY"},
		{"ci_failures", "cicd", "pipeline_failed", "INTERVAL 1 HOUR"},
		{"prs_merged", "git", "pr_merged", "INTERVAL 7 DAY"},
	}

	result := make(map[string]int)
	for _, m := range metrics {
		query := "SELECT count() FROM events WHERE source_type = ? AND event_type = ? AND occurred_at > now() - ?"
		rows, _ := h.db.Query(ctx, query, m.source, m.event, m.period)
		if len(rows) > 0 {
			result[m.key] = int(rows[0]["count"].(int64))
		} else {
			result[m.key] = 0
		}
	}
	return result
}

func (h *DashboardHandler) getActivity(ctx context.Context) []map[string]any {
	rows, _ := h.db.Query(ctx, "SELECT toDate(occurred_at) as date, source_type, count() as count FROM events WHERE occurred_at > now() - INTERVAL 7 DAY GROUP BY date, source_type ORDER BY date")
	var result []map[string]any
	for _, r := range rows {
		result = append(result, map[string]any{"date": r["date"], "source_type": r["source_type"], "count": r["count"]})
	}
	return result
}

func (h *DashboardHandler) getTopTeams(ctx context.Context) []map[string]any {
	rows, _ := h.db.Query(ctx, "SELECT team_id, source_type, count() as cnt FROM events WHERE occurred_at > now() - INTERVAL 7 DAY GROUP BY team_id, source_type ORDER BY cnt DESC LIMIT 10")
	var result []map[string]any
	for _, r := range rows {
		result = append(result, map[string]any{"team_id": r["team_id"], "source_type": r["source_type"], "count": r["cnt"]})
	}
	return result
}

func (h *DashboardHandler) getHourly(ctx context.Context) []map[string]any {
	rows, _ := h.db.Query(ctx, "SELECT formatDateTime(occurred_at, '%H:00') as hour, count() as count FROM events WHERE occurred_at > now() - INTERVAL 24 HOUR GROUP BY hour ORDER BY hour")
	var result []map[string]any
	for _, r := range rows {
		result = append(result, map[string]any{"hour": r["hour"], "count": r["count"]})
	}
	return result
}

func (h *DashboardHandler) getTopAuthors(ctx context.Context) []map[string]any {
	rows, _ := h.db.Query(ctx, "SELECT JSONExtract(payload, 'author', 'String') as author, count() as count FROM events WHERE source_type = 'git' AND occurred_at > now() - INTERVAL 7 DAY GROUP BY author ORDER BY count DESC LIMIT 10")
	var result []map[string]any
	for _, r := range rows {
		author, _ := r["author"].(string)
		if author == "" {
			author = "unknown"
		}
		result = append(result, map[string]any{"author": author, "count": r["count"]})
	}
	return result
}