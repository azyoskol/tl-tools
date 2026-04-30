package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/getmetraly/metraly/internal/pkg/biz"
)

type WebhookHandler struct {
	svc biz.WebhookServiceInterface
}

func NewWebhookHandler(svc biz.WebhookServiceInterface) *WebhookHandler {
	return &WebhookHandler{svc: svc}
}

func (h *WebhookHandler) Receive(w http.ResponseWriter, r *http.Request) {
	var req biz.WebhookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	resp, err := h.svc.Receive(r.Context(), req)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(resp)
}