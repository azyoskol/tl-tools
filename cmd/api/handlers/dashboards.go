package handlers

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/go-chi/chi/v5"
)

type Dashboard struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Config  any   `json:"config"`
	OwnerID string `json:"owner_id"`
}

var (
	dashboardsMu sync.RWMutex
	dashboards  = map[string]Dashboard{
		"1": {ID: "1", Name: "Engineering Overview", Config: map[string]any{"widgets": []string{"dora", "velocity"}}, OwnerID: "user-1"},
		"2": {ID: "2", Name: "Team Performance", Config: map[string]any{"widgets": []string{"metrics", "insights"}}, OwnerID: "user-1"},
	}
	dashboardIDCounter = 3
)

type GetDashboardsHandler struct{}

func NewGetDashboardsHandler() *GetDashboardsHandler {
	return &GetDashboardsHandler{}
}

func (h *GetDashboardsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	dashboardsMu.RLock()
	defer dashboardsMu.RUnlock()

	list := make([]Dashboard, 0, len(dashboards))
	for _, d := range dashboards {
		list = append(list, d)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"dashboards": list,
	})
}

type PostDashboardHandler struct{}

func NewPostDashboardHandler() *PostDashboardHandler {
	return &PostDashboardHandler{}
}

func (h *PostDashboardHandler) Routes() http.Handler {
	r := chi.NewRouter()
	r.Post("/", h.Create)
	return r
}

func (h *PostDashboardHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name   string `json:"name"`
		Config any    `json:"config"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	dashboardsMu.Lock()
	defer dashboardsMu.Unlock()

	id := dashboardIDCounter
	dashboardIDCounter++

	d := Dashboard{
		ID:      string(rune(id)),
		Name:    req.Name,
		Config:  req.Config,
		OwnerID: "user-1",
	}
	dashboards[d.ID] = d

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"dashboard": d,
	})
}