package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/getmetraly/metraly/internal/pkg/biz"
)

type ComparisonHandler struct {
	svc biz.ComparisonServiceInterface
}

func NewComparisonHandler(svc biz.ComparisonServiceInterface) *ComparisonHandler {
	return &ComparisonHandler{svc: svc}
}

func (h *ComparisonHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	teams, err := h.svc.Get(r.Context())
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"teams": teams})
}