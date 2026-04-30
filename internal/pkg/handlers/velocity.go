package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/getmetraly/metraly/internal/pkg/biz"
	"github.com/go-chi/chi/v5"
)

type VelocityHandler struct {
	svc biz.VelocityServiceInterface
}

func NewVelocityHandler(svc biz.VelocityServiceInterface) *VelocityHandler {
	return &VelocityHandler{svc: svc}
}

func (h *VelocityHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	teamID := chi.URLParam(r, "team_id")

	velocity, err := h.svc.Get(r.Context(), teamID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(velocity)
}