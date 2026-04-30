package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/getmetraly/metraly/internal/pkg/database"
)

type WebhookHandler struct {
	db database.Database
}

func NewWebhookHandler(db database.Database) *WebhookHandler {
	return &WebhookHandler{db: db}
}

type WebhookRequest struct {
	Source    string         `json:"source"`
	EventType string         `json:"event_type"`
	TeamID    string         `json:"team_id"`
	Payload   map[string]any `json:"payload"`
}

func (h *WebhookHandler) Receive(w http.ResponseWriter, r *http.Request) {
	var req WebhookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	if req.TeamID == "" {
		req.TeamID = "550e8400-e29b-41d4-a716-446655440000"
	}

	payloadJSON, _ := json.Marshal(req.Payload)

	query := "INSERT INTO events (team_id, source_type, event_type, payload, occurred_at) VALUES (?, ?, ?, ?, now())"
	h.db.Exec(r.Context(), query, req.TeamID, req.Source, req.EventType, string(payloadJSON))

	json.NewEncoder(w).Encode(map[string]string{
		"status":    "ok",
		"received": req.EventType,
	})
}