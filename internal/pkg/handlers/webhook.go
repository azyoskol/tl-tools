package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/getmetraly/metraly/internal/pkg/biz"
	apperrors "github.com/getmetraly/metraly/internal/pkg/middleware/apperrors"
	"github.com/getmetraly/metraly/internal/pkg/middleware"
)

type WebhookHandler struct {
	svc biz.WebhookServiceInterface
}

func NewWebhookHandler(svc biz.WebhookServiceInterface) *WebhookHandler {
	return &WebhookHandler{svc: svc}
}

// @Summary Receive webhook event
// @Description Receive events from external systems
// @Tags webhook
// @Accept json
// @Produce json
// @Param request body biz.WebhookRequest true "Webhook request"
// @Success 200 {object} biz.WebhookResponse
// @Failure 400 {object} apperrors.AppError
// @Router /api/v1/collectors [post]
func (h *WebhookHandler) Receive(w http.ResponseWriter, r *http.Request) {
	var req biz.WebhookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.WriteError(w, apperrors.BadRequest("invalid JSON"))
		return
	}

	if err := middleware.ValidateStruct(req); err != nil {
		middleware.WriteError(w, apperrors.ValidationError(err.Error()))
		return
	}

	resp, err := h.svc.Receive(r.Context(), req)
	if err != nil {
		middleware.WriteError(w, apperrors.InternalError(err.Error()))
		return
	}

	json.NewEncoder(w).Encode(resp)
}