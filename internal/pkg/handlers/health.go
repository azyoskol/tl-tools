package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/getmetraly/metraly/internal/pkg/biz"
)

type HealthHandler struct {
	svc biz.HealthServiceInterface
}

func NewHealthHandler(svc biz.HealthServiceInterface) *HealthHandler {
	return &HealthHandler{svc: svc}
}

func (h *HealthHandler) Root(w http.ResponseWriter, r *http.Request) {
	resp := h.svc.Root(r.Context())
	json.NewEncoder(w).Encode(map[string]string{
		"message": resp.Message,
		"version": resp.Version,
	})
}

func (h *HealthHandler) API(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}

func (h *HealthHandler) ClickHouse(w http.ResponseWriter, r *http.Request) {
	if err := h.svc.Ping(r.Context()); err != nil {
		http.Error(w, `{"status":"error","message":"`+err.Error()+`"}`, 503)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}