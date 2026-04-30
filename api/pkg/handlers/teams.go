package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/azyoskol/tl-tools/api/pkg/database"
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

	rows, err := h.db.Query(r.Context(), "SELECT id, name FROM teams WHERE id = %(team_id)s", map[string]any{"team_id": teamID})
	if err != nil || len(rows) == 0 {
		http.Error(w, `{"detail":"Team not found"}`, 404)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"id": rows[0]["id"], "name": rows[0]["name"]})
}