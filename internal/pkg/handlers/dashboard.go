package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/getmetraly/metraly/internal/pkg/biz"
)

type DashboardHandler struct {
	svc biz.DashboardServiceInterface
}

func NewDashboardHandler(svc biz.DashboardServiceInterface) *DashboardHandler {
	return &DashboardHandler{svc: svc}
}

func (h *DashboardHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	result, err := h.svc.GetDashboard(r.Context())
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"overview": map[string]int{
			"prs_opened":    result.Overview.PRsOpened,
			"tasks_blocked": result.Overview.TasksBlocked,
			"ci_failures":   result.Overview.CIFailures,
			"prs_merged":    result.Overview.PRsMerged,
		},
		"activity":    result.Activity,
		"top_teams":   result.TopTeams,
		"hourly":      result.Hourly,
		"top_authors": result.TopAuthors,
	})
}