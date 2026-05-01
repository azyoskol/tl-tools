package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type RoleHandler struct{}

func NewRoleHandler() *RoleHandler {
	return &RoleHandler{}
}

func (h *RoleHandler) Routes() http.Handler {
	r := chi.NewRouter()
	r.Get("/cto", h.CTO)
	r.Get("/vp", h.VP)
	r.Get("/tl", h.TL)
	r.Get("/devops", h.DevOps)
	r.Get("/ic", h.IC)
	return r
}

func (h *RoleHandler) CTO(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"role": "cto",
		"stats": map[string]any{
			"total_teams":          8,
			"total_engineers":      45,
			"velocity_trend":       "+12%",
			"on_call_load":         "2.1 hrs/wk",
			"ci_reliability":       "94%",
			"deployment_frequency": "daily",
		},
		"payload": map[string]any{
			"org_health":      85,
			"budget_util":    78,
			"roadmap_progress": 65,
			"risk_items":      []string{"vendor expiration", "key retention"},
		},
	})
}

func (h *RoleHandler) VP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"role": "vp",
		"stats": map[string]any{
			"team_count":          5,
			"engineer_count":      28,
			"sprint_velocity":      42,
			"cycle_time":           "3.2 days",
			"bug_escape_rate":     "2%",
			"code_review_time":     "4 hrs",
		},
		"payload": map[string]any{
			"team_health":    []int{90, 85, 78, 92, 88},
			"blockers":       3,
			"upcoming_milestones": []string{"Q2 GA", "Security audit"},
		},
	})
}

func (h *RoleHandler) TL(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"role": "tl",
		"stats": map[string]any{
			"team_size":           6,
			"sprint_commit":       "85%",
			"tech_debt_ratio":     "15%",
			"PR_review_burden":    "8 PRs/day",
			"on_call_incidents":   2,
			"knowledge_share":     "3 sessions/wk",
		},
		"payload": map[string]any{
			"sprint_burndown": []int{20, 18, 15, 12, 8, 5},
			"risks":          []string{"API deadline", "QA bandwidth"},
			"resources":      map[string]any{"allocated": 6, "needed": 1},
		},
	})
}

func (h *RoleHandler) DevOps(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"role": "devops",
		"stats": map[string]any{
			"uptime":               "99.9%",
			"deploy_success":       "97%",
			"incident_mttr":        "25 min",
			"pipeline_duration":    "12 min",
			"infra_cost":           "$12.5K/mo",
			"auto_scaling":         "enabled",
		},
		"payload": map[string]any{
			"services":      map[string]any{"total": 24, "healthy": 23},
			"alerts":       map[string]any{"critical": 0, "warning": 2},
			"cost_breakdown": map[string]any{"compute": 8500, "storage": 2000, "network": 2000},
		},
	})
}

func (h *RoleHandler) IC(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"role": "ic",
		"stats": map[string]any{
			"tasks_completed":      28,
			"PRs_contributed":     15,
			"code_lines":          2500,
			"reviews_given":       12,
			"on_call_hours":       6,
			"learning_hours":      8,
		},
		"payload": map[string]any{
			"activity": map[string]any{"commits": 45, "reviews": 12, "bugs_filed": 3},
			"skills":   []string{"Go", "React", "PostgreSQL"},
		},
	})
}