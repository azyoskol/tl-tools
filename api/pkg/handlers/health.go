package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/azyoskol/tl-tools/api/pkg/database"
)

type HealthHandler struct {
	db database.Database
}

func NewHealthHandler(db database.Database) *HealthHandler {
	return &HealthHandler{db: db}
}

func (h *HealthHandler) Root(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Team Dashboard API",
		"version": "1.0.0",
	})
}

func (h *HealthHandler) API(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}

func (h *HealthHandler) ClickHouse(w http.ResponseWriter, r *http.Request) {
	if err := h.db.Ping(r.Context()); err != nil {
		http.Error(w, `{"status":"error","message":"`+err.Error()+`"}`, 503)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}