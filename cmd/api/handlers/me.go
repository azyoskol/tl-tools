package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/getmetraly/metraly/cmd/api/middleware"
)

type MeResponse struct {
	Email string `json:"email"`
	Role  string `json:"role"`
}

func MeHandler(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFrom(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	resp := MeResponse{
		Email: claims.Email,
		Role:  claims.Role,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
