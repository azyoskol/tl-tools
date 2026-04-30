package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/getmetraly/metraly/internal/pkg/biz"
	"github.com/go-chi/chi/v5"
)

type TeamsHandler struct {
	svc biz.TeamsServiceInterface
}

func NewTeamsHandler(svc biz.TeamsServiceInterface) *TeamsHandler {
	return &TeamsHandler{svc: svc}
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
	teams, err := h.svc.List(r.Context())
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(teams)
}

func (h *TeamsHandler) Get(w http.ResponseWriter, r *http.Request) {
	teamID := chi.URLParam(r, "team_id")
	if teamID == "comparison" {
		http.Error(w, `{"detail":"Team not found"}`, 404)
		return
	}

	team, err := h.svc.Get(r.Context(), teamID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	if team == nil {
		http.Error(w, `{"detail":"Team not found"}`, 404)
		return
	}

	json.NewEncoder(w).Encode(team)
}

func (h *TeamsHandler) Overview(w http.ResponseWriter, r *http.Request) {
	teamID := chi.URLParam(r, "team_id")

	overview, err := h.svc.Overview(r.Context(), teamID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(overview)
}

func (h *TeamsHandler) Activity(w http.ResponseWriter, r *http.Request) {
	teamID := chi.URLParam(r, "team_id")

	activities, err := h.svc.Activity(r.Context(), teamID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": activities})
}

func (h *TeamsHandler) Insights(w http.ResponseWriter, r *http.Request) {
	teamID := chi.URLParam(r, "team_id")

	insights, err := h.svc.Insights(r.Context(), teamID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"insights": insights})
}